/**
 * Live tulospalveluun liittyvät reitit ja muu tarvittava.
 * Perusidea on käyttää https://en.wikipedia.org/wiki/Server-sent_events .
 * Livenä ilmoitettavia otteluita seurataan kuvauksessa
 * liveMatches ja otteluita seuraavia yhteyksiä pidetään kirjaa kuvauksessa
 * liveConnections. Jokainen arvo liveConnections vastaa yhtä EvenSource 
 * yhteyttä, joka pidetään koko ajan auki. Kun otteluihin tulee muutoksia,
 * niitä vastaaviin yhteyksiin kirjoitetaan uusia tuloksia. Pitkään
 * kestäneitä otteluita ja yhteyksiä siivotaan periodisesti pois.
 * 
 * Serveri pitää kirjaa otteluista LiveMatch-muodossa. Jokainen muutos kasvattaa
 * versionumeroa yhdellä ja client (Scoresheet.tsx) käyttää sitä
 * varmistaakseen, ettei se palaa vahingossa aikaisempaan versioon.
 * - Kun käyttäjä tekee muutoksia pöytäkirjaan, se lähettää serverille kaksi versiota 
 *   pöytäkirjasta: edellisen serveriltä saadun (c1) ja käyttäjän muokatun version (c2). 
 *   Serveri muodostaa uuden version pöytäkirjasta tekemällä senhetkiseen versioon
 *   samat muutokset kuin c2:ssa on c1 nähden käyttäen funktiota integrateLiveMatchChanges.
 *   Tämän jälkeen serveri lähettää uuden pöytäkirjan kaikille sen seuraajille.
 * - Kun client saa serverin lähettämän pöytäkirjan (s2), se vertaa sitä serverin 
 *   edelliseen lähettämään versioon (s1) ja tekee käyttäjän näkemään pöytäkirjaan
 *   samat muutokset kuin s2:ssa on s1 nähden käyttäen funktiota integrateLiveMatchChanges.
 * 
 * HUOM! Tietorakenteet ja menettely voidaan toteuttaa usealla eri tavalla.
 * Nyt käytössä oleva koodi on tehty mahdollisimman yksinkertaiseksi. Jos koodin
 * tehokkuus tai tietoliikenteen määrä tulee ongelmaksi, niitä voi parantaa usealla 
 * tavalla.
 * 
 * HUOM! Ottelut säilytetään levyllä käyttäen SQLite tietokantaa, katso sqliteWrapper.ts.
 */
/**
 * Correctness proof idea:
 * Claim 1: Every local change the user makes gets incorporated into all versions 
 * starting from some time on the server and stays until it is overridden by another 
 * user change on the server.
 * Claim 2: The client’s form matches the newest version it has received from the server, 
 * except possibly in the fields where the user has made local changes.
 */

import express, { Router } from 'express';
import { base64JSONStringifyNode, createRandomUniqueIdentifier } from '../../shared/generalUtils.js';
import { currentScore } from '../../client/utils/matchTools.js';
import { CustomError, LiveMatchEntry } from '../../shared/commonTypes.js';
import { injectAuth, requireAuth } from '../auth/auth.js';
import { integrateLiveMatchChanges } from '../../shared/liveMatchTools.js';
import { LiveConnection, LiveMatch } from './liveTypes.js';
import { logger } from '../logger.js';

const router: Router = express.Router();

// Aikoja millisekunteina, helpottaa koodin lukemista:
const SECOND_ms = 1000;
const MINUTE_ms = 60*SECOND_ms;
//@ts-ignore
const HOUR_ms = 60*MINUTE_ms;

/**
 * Aikaväli, jolla lähetetään "heartbeat" yhteyksille pitämään ne elossa.
 */
const HEARTBEAT_INTERVAL = 25*SECOND_ms;
/**
 * Aikaväli, jolla ajetaan siivoustoimenpiteitä.
 */
const MAINTENANCE_INTERVAL = 15*MINUTE_ms;
/**
 * Maksimiaika live ottelun seuraamiseen ilman uuden datan lähettämistä ennen tuhoamista.
 */
const MAX_LIVE_CONNECTION_INACTIVITY = 4*HOUR_ms;
/**
 * Maksimiaika live ottelun ilmoittamiseen. 
 */
const MAX_LIVE_MATCH_DURATION = 8*HOUR_ms;
/**
 * Maksimiaika live tulosten ilmoittamisessa oleville päivittämisväleille.
 * Jos mitään muutoksia ei tule tässä ajassa, ottelu siivotaan pois.
 */
const MAX_LIVE_MATCH_INACTIVITY = 4*HOUR_ms;

/**
 * Kuvaus, jonka avulla aktiiviset live yhteydet pidetään muistissa.
 * Avain on merkityksetön satunnainen merkkijono.
 */
const liveConnections: Map<string, LiveConnection> = new Map();

/**
 * Live ottelut, kuvaus (ep_ottelu.id) -> LiveMatch.
 */
const liveMatches: Map<number, LiveMatch> = new Map();

/**
 * Kirjoittaa yhteyteen ottelun tilan.
 */
function sendLiveMatch(connectionId: string, liveMatch: LiveMatch) {
    const connection = liveConnections.get(connectionId);
    if (!connection || !connection.res.writable || connection.res.writableEnded)
        return;
    const data = { type: "matchUpdate", timestamp: liveMatch.lastUpdate, author: liveMatch.lastAuthor, version: liveMatch.version, data: liveMatch.data };
    try {
        connection.lastActivity = Date.now();
        connection.res.write(`data: ${base64JSONStringifyNode(data)}\n\n`);
    } catch (error) {
        logger.error(`Failed to send livescore data`);
    }
}

/**
 * Kirjoittaa yhteyteen listan otteluista.
 */
function sendMatchList(connectionId: string, matchList: any[]) {
    const connection = liveConnections.get(connectionId);
    if (!connection || !connection.res.writable || connection.res.writableEnded)
        return;
    const data = { type: "matchListUpdate", data: matchList };
    try {
        connection.lastActivity = Date.now();
        connection.res.write(`data: ${base64JSONStringifyNode(data)}\n\n`);
    } catch (error) {
        logger.error(`Failed to send livescore data`);
    }
}

/**
 * Käy läpi liveConnections ja kirjoittaa ottelua matchId vastaaviin
 * yhteyksiin ottelun tilan.
 * 
 * HUOM! Tässä tehdään ylimääräistä työtä koska jokainen liveConnections
 * käydään läpi mutta tämä on hyvin yksinkertainen ratkaisu. Jos tietoliikennettä 
 * tulee paljon enemmän, tulee käyttää lisätietorakennetta toimen tehostamiseen.
 */
function broadcastLiveMatch(matchId: number) {
    const liveMatch = liveMatches.get(matchId);
    if (!liveMatch)
        return;

    // Käy läpi liveConnections ja kirjoita siihen jos matchId vastaavat:
    for (let [connectionId, connection] of liveConnections) {
        if (connection.matchId === matchId)
            sendLiveMatch(connectionId, liveMatch);
    }
}

/**
 * Luo listan live otteluista yhteyksiin lähetettävässä muodossa.
 */
function createMatchList() {
    const matchList: LiveMatchEntry[] = [];
    for (const [matchId, liveMatch] of liveMatches) {
        const startTimeAsDate = new Date(liveMatch.startTime);
        matchList.push({ matchId, home: liveMatch.data.teamHome.teamName, away: liveMatch.data.teamAway.teamName, score: liveMatch.score, submitStartTime: startTimeAsDate.toISOString() });
    }
    return matchList;
}

/**
 * Lähettää listan live otteluista kaikkiin yhteyksiin.
 */
function broadcastMatchList() {
    const matchList = createMatchList();

    for (let [connectionId, _connection] of liveConnections)
        sendMatchList(connectionId, matchList);
}

/**
 * Palauttaa tekstimuotoisen tiedon otteluiden ja seuraajien määrästä.
 */
function getLivescoreInfo() {
    const matchIds = Array.from(liveMatches.keys());
    return `${matchIds.length} ottelua (${matchIds}), ${liveConnections.size} yhteyttä`;
}

/**
 * Tämä kutsutaan kun ottelupöytäkirja talletetaan tietokantaan hyväksytysti.
 * Poistaa ottelun liveMatches listalta.
 */
function endLiveMatch(matchId: number) {
    try {
        logger.info("endLiveMatch", { matchId });
        const liveMatch = liveMatches.get(matchId);
        if (liveMatch) {
            logger.info("endLiveMatch", { matchId });
            liveMatch.lastUpdate = Date.now();
            liveMatch.data.isSubmitted = true;
            liveMatches.set(matchId, liveMatch);
            broadcastLiveMatch(matchId);
            liveMatches.delete(matchId);
            broadcastMatchList();
        }
    } catch (error) {
        logger.error("Error at endLiveMatch()", { matchId });
    }
}

/**
 * Vastaanottaa keskeneräisen pöytäkirjan live-seurantaa varten.
 * HUOM! TODO Tässäkin tulisi tehdä jonkinlaista validointia, muutoin 
 * väärinkäyttö mahdollinen.
 */
router.post('/submit_match', injectAuth, requireAuth(), async (req, res, next) => {
    try {
        const author = req.body.author;
        const result = req.body.result;
        const oldResult = req.body.oldResult;
        if (!author) 
            throw new CustomError(400, "error", "Missing author", "Missing author.");
        if (!result)
            throw new CustomError(400, "error", "Missing result", "Missing result.");
        if (result.status !== "T") 
            throw new CustomError(400, "error", "Invalid result", "Invalid result.");

        const matchId = result.id;
        const now = Date.now();

        let liveMatch: LiveMatch|undefined = liveMatches.get(matchId);
        let isMatchListChanged = false;
        if (liveMatch) {
            // console.log("received update from", author);
            // console.log("liveMatch.data", liveMatch.data.scores[0]);
            // console.log("oldResult", oldResult.scores[0]);
            // console.log("newResult", result.scores[0]);

            // Päivitä olemassaolevaa liveMatch:
            liveMatch.lastUpdate = now;
            liveMatch.lastAuthor = author;
            liveMatch.version += 1;

            // liveMatch.data = combineLiveMatchPlayers(liveMatch.data, result);
            if (oldResult)
                liveMatch.data = integrateLiveMatchChanges(liveMatch.data, oldResult, result);
            else 
                liveMatch.data = integrateLiveMatchChanges(liveMatch.data, liveMatch.data, result);

            const score = currentScore(liveMatch.data);
            if (liveMatch.score[0] != score[0] || liveMatch.score[1] != score[1])
                isMatchListChanged = true;
            liveMatch.score = score;
        } else {
            // Luodaan uusi liveMatch
            if (!result.isSubmitted) {
                const score = currentScore(result);
                liveMatch = { startTime: now, lastUpdate: now, lastAuthor: author, version: 0, data: result, score: score };
                liveMatches.set(matchId, liveMatch);
                isMatchListChanged = true;
                logger.info("Starting match in liveScoreRoutes", { matchId, author });
            }
        }

        // TODO REMOVE!
        // await delay(100+400*Math.random());

        if (isMatchListChanged)
            broadcastMatchList();
        broadcastLiveMatch(matchId);

        if (!res.headersSent)
            return res.json({ ok: true });
    } catch (error) {
        next(error);
    }
});

/**
 * Alustetaan uusi SSE-yhteys live-seurantaa varten.
 */
router.get('/watch_match/:matchId?', async (req, res) => {
    try {
        // Headerit SSE varten:
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-store, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-Accel-Buffering', 'no');

        let liveMatch: LiveMatch|undefined = undefined;
        let matchId = undefined;
        if (req.params.matchId) {
            matchId = parseInt(req.params.matchId);
            if (isNaN(matchId))
                matchId = undefined;
            else
                liveMatch = liveMatches.get(matchId);
        }

        logger.info("/watch_match", { matchId });

        const now = Date.now();
        const connectionId = createRandomUniqueIdentifier();
        liveConnections.set(connectionId, { lastActivity: now, matchId: matchId, res: res });

        // Käsitellään kirjoittamiseen liittyvät ongelmat, esimerkiksi kun kirjoitetaan res.end() jälkeen
        res.on('error', (error) => {
            logger.error('Stream error on /watch_match response', error);
        });

        // Käsitellään client disconnect
        req.on('close', () => {
            liveConnections.delete(connectionId);
            res.end();
        });

        // Käsitellään yhteysongelmat - tämä tapahtuu myös kun EventSource suljetaan (ECONNRESET)
        req.on('error', () => {
            liveConnections.delete(connectionId);
            res.end();
        });

        sendMatchList(connectionId, createMatchList());
        if (liveMatch)
            sendLiveMatch(connectionId, liveMatch);
    } catch (error) {
        logger.error(`Error during /watch_match`, error);
        res.end();
    }
});

/**
 * Palauttaa ottelun ilman SSE-yhteyttä.
 */
router.get('/get_match/:matchId', async (req, res, next) => {
    try {
        logger.info("/get_match", { matchId: req.params.matchId });
        const matchId = Number(req.params.matchId);
        let liveMatch = Number.isNaN(matchId) ? null : liveMatches.get(matchId);
        if (!liveMatch) {
            if (!res.headersSent)
                return res.status(400).send("Invalid matchId or no match found.");
            return;
        }
        if (!res.headersSent)
            return res.json({data: liveMatch.data});
    } catch (error) {
        next(error);
    }
});

/**
 * Periodisesti toistuva tehtävä: poistetaan vanhentuneet yhteydet ja live-ottelut.
 */
function runMaintenance() {
    try {
        logger.info("liveScoreRoutes maintenance");
        const now = Date.now();

        // Poistetaan liian vanhat ja epäaktiiviset ottelut:
        const liveMatchesToDelete = [];
        for (const [matchId, liveMatch] of liveMatches) {
            if ((now - liveMatch.lastUpdate > MAX_LIVE_MATCH_INACTIVITY) 
                || (now - liveMatch.startTime > MAX_LIVE_MATCH_DURATION))
                liveMatchesToDelete.push(matchId);
        }
        for (let key of liveMatchesToDelete)
            liveMatches.delete(key);

        // Poistetaan liveConnections jos niihin ei ole lähetetty mitään tuloksia pitkän aikaan:
        const liveConnectionsToDelete = [];
        for (const [connectionId, connection] of liveConnections) 
            if (now - connection.lastActivity > MAX_LIVE_CONNECTION_INACTIVITY)
                liveConnectionsToDelete.push(connectionId);
        for (let key of liveConnectionsToDelete)
            liveConnections.delete(key);

        // Jos liveMatches listaan tehtiin muutoksia, lähetetään uusi lista kaikille:
        if (liveMatchesToDelete.length > 0)
            broadcastMatchList();
    } catch (error) {
        logger.error("Error during liveScoreRoutes maintenance", error);
    } finally {
        // Sovitaan seuraava maintenance
        setTimeout(runMaintenance, MAINTENANCE_INTERVAL);
    }
}

/**
 * Periodisesti toistuva tehtävä: lähetetään jokaiselle
 * yhteydelle "heartbeat" pitämään yhteys elossa.
 * Syy tarpeellisuuteen: https://bugzilla.mozilla.org/show_bug.cgi?id=444328
 */
function runHeartbeat() {
    for (let [_connectionId, connection] of liveConnections) {
        try {
            if (connection && connection.res.writable && !connection.res.writableEnded)
                connection.res.write(`data: hb\n\n`);
        } catch (error) {
            // console.error(`Failed to send heartbeat`);
        }
    }
    setTimeout(runHeartbeat, HEARTBEAT_INTERVAL);
}

// Aloitetaan periodisten tehtävien ajaminen
setTimeout(runMaintenance, MAINTENANCE_INTERVAL);
setTimeout(runHeartbeat, HEARTBEAT_INTERVAL);

// DEBUGGING, REMOVE! Used to test SSE crashes.
// setInterval(() => {
//     for (let [_connectionId, connection] of liveConnections) {
//         if (connection) {
//             connection.res.end();
//         }
//     }
// }, 43*SECOND_ms);

export { router as liveScoreRouter, getLivescoreInfo, endLiveMatch };