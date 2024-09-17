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
 * TODO! Tarkista että koodi on thread-safe!
 * 
 * HUOM! Tietorakenteet ja menettely voidaan toteuttaa usealla eri tavalla.
 * Nyt käytössä oleva koodi on tehty mahdollisimman yksinkertaiseksi. Jos koodin
 * tehokkuus tai tietoliikenteen määrä tulee ongelmaksi, niitä voi parantaa usealla 
 * tavalla.
 */

import express, { Response, Router } from 'express';
import { base64JSONStringifyNode, createRandomUniqueIdentifier } from '../shared/generalUtils.js';
import { currentScore } from '../client/utils/matchTools.js';
import { LiveMatchEntry } from '../shared/commonTypes.js';
import { injectAuth, requireAuth } from './auth/auth.js';
import { ScoresheetFields } from '../client/components/scoresheet/scoresheetTypes.js';
import { logger } from './serverErrorHandler.js';

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
const MAX_LIVE_CONNECTION_INACTIVITY = 2*HOUR_ms;
/**
 * Maksimiaika live ottelun ilmoittamiseen. 
 */
const MAX_LIVE_MATCH_DURATION = 8*HOUR_ms;
/**
 * Maksimiaika live tulosten ilmoittamisessa oleville päivittämisväleille.
 * Jos mitään muutoksia ei tule tässä ajassa, ottelu siivotaan pois.
 */
const MAX_LIVE_MATCH_INACTIVITY = 2*HOUR_ms;

/**
 * Tyyppi ottelun seuraamiseen käytettävälle yhteydelle.
 */
type LiveConnection = {
    lastActivity: number;
    matchId: number | undefined;
    res: Response;           // yhteys clientiin, tähän kirjoitetaan päivityksiä
};

/**
 * Kuvaus, jonka avulla aktiiviset live yhteydet pidetään muistissa.
 * Avain on merkityksetön satunnainen merkkijono.
 */
const liveConnections: Map<string, LiveConnection> = new Map();

/**
 * Nämä tiedot talletetaan kustakin seurattavasta live ottelusta.
 */
type LiveMatch = {
    startTime: number;
    lastActivity: number;
    score: number[];
    data: ScoresheetFields;
};

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
    const data = { type: "matchUpdate", data: liveMatch.data };
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
    return `${liveMatches.size} ottelua, ${liveConnections.size} yhteyttä`;
}

/**
 * Vastaanottaa keskeneräisen pöytäkirjan live-seurantaa varten.
 * HUOM! TODO Tässäkin tulisi tehdä jonkinlaista validointia, muutoin 
 * väärinkäyttö mahdollinen.
 */
router.post('/submit_match', injectAuth, requireAuth(), async (req, res, next) => {
    try {
        if (!req.body.result) {
            if (!res.headersSent)
                return res.status(400).send(`Missing result.`);
            return;
        }
        const result = req.body.result;
        if (result.status !== "T") {
            if (!res.headersSent)
                return res.status(400).send(`Invalid result.`);
            return;
        }
        const score = currentScore(result);

        const matchId = result.id;
        const now = Date.now();

        let liveMatch: LiveMatch|undefined = liveMatches.get(matchId);
        let isMatchListChanged = false;
        if (liveMatch) {
            if (liveMatch.score[0] != score[0] || liveMatch.score[1] != score[1])
                isMatchListChanged = true;
            // Päivitä olemassaolevaa liveMatch:
            liveMatch.lastActivity = now;
            liveMatch.score = score;
            liveMatch.data = result;
        } else {
            // Luodaan uusi liveMatch
            liveMatch = { startTime: now, lastActivity: now, data: result, score: score };
            liveMatches.set(matchId, liveMatch);
            isMatchListChanged = true;
            logger.info("Starting match in liveScoreRoutes", { matchId });
        }
        
        // Jos ottelupöytäkirja on lähetetty, poistetaan seuranta:
        if (liveMatch && liveMatch.data.isSubmitted) {
            logger.info("Ending match in liveScoreRoutes", { matchId });
            // console.log("Poistetaan taulukosta liveMatches lähetettynä:", matchId);
            liveMatches.delete(matchId);
            isMatchListChanged = true;
        }

        if (isMatchListChanged)
            broadcastMatchList();
        broadcastLiveMatch(matchId);

        if (!res.headersSent)
            return res.json({ ok: true });
    } catch (error) {
        logger.error(`Error during /submit_match: ${error}`);
        next(error);
    }
});

/**
 * Palauttaa listan liveMatches otteluista.
 * Ei käytössä, tämän korvaa /watch_match reitti.
 */
// router.get('/get_match_list', async (_req, res) => {
//     const matchList = createMatchList();
//     res.json({ data: matchList });
// });

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
        liveConnections.set(connectionId, { lastActivity: now, matchId: matchId, res: res});

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
        const matchId = parseInt(req.params.matchId);
        if (!matchId || !liveMatches.has(matchId)) {
            if (!res.headersSent)
                return res.status(400).send("Invalid matchId.");
            return;
        }
        if (!res.headersSent)
            return res.json({data: liveMatches.get(matchId)?.data});
    } catch (error) {
        logger.error(`Error during /get_match`, error);
        next(error);
    }
});

// Asetetaan periodisesti toistuva tehtävä: poistetaan vanhentuneet yhteydet 
// ja live-ottelut.
setInterval(() => {
    logger.info("liveScoreRoutes maintenance");
    try {
        const now = Date.now();

        // Poistetaan liian vanhat ja epäaktiiviset liveMatches:
        const liveMatchesToDelete = [];
        for (const [matchId, liveMatch] of liveMatches) {
            if ((now - liveMatch.lastActivity > MAX_LIVE_MATCH_INACTIVITY) 
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
    }
}, MAINTENANCE_INTERVAL);

// Asetetaan periodisesti toistuva tehtävä: lähetetään jokaiselle
// yhteydelle "heartbeat" pitämään yhteys elossa.
// Syy tarpeellisuuteen: https://bugzilla.mozilla.org/show_bug.cgi?id=444328
setInterval(() => {
    for (let [_connectionId, connection] of liveConnections) {
        try {
            if (connection && connection.res.writable && !connection.res.writableEnded)
                connection.res.write(`data: hb\n\n`);
        } catch (error) {
            // console.error(`Failed to send livescore data`);
        }
    }
}, HEARTBEAT_INTERVAL);

// DEBUGGING, REMOVE! Used to test SSE crashes.
// setInterval(() => {
//     for (let [_connectionId, connection] of liveConnections) {
//         if (connection) {
//             connection.res.end();
//         }
//     }
// }, 43*SECOND_ms);

export { router as liveScoreRouter, getLivescoreInfo };