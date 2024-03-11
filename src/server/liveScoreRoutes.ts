/**
 * Live tulospalveluun liittyvät reitit ja muu tarvittava.
 * 
 * TODO! Tarkista että koodi on thread-safe!!!
 * 
 * HUOM! Tietorakenteet ja muu menettely voi toteuttaa usealla eri tavalla.
 * Nyt käytössä oleva koodi on tehty mahdollisimman yksinkertaiseksi. Jos koodin
 * tehokkuus tai tietoliikenteen määrä tulee ongelmaksi, niitä voi parantaa usealla 
 * tavalla.
 */

import express, { Router } from 'express';
import { base64JSONStringify, createRandomUniqueIdentifier } from '../shared/generalUtils.js';
import { LiveMatchEntry } from '../shared/commonTypes.js';
import { currentScore } from '../client/utils/matchTools.js';
// import { logger } from '../server/serverErrorHandler.js';

const router: Router = express.Router();

// Aikoja millisekunteina, helpottaa koodin lukemista:
const SECOND = 1000;
const MINUTE = 60*SECOND;
//@ts-ignore
const HOUR = 60*MINUTE;

const MAINTENANCE_INTERVAL = 5*MINUTE;
const MAX_LIVE_CONNECTION_DURATION = 6*HOUR;
const MAX_LIVE_MATCH_DURATION = 6*HOUR;
const MAX_LIVE_MATCH_INACTIVITY = 2*HOUR;

type LiveConnection = {
    startTime: number;
    matchId: number | undefined;
    res: any;           // yhteys clientiin, tähän kirjoitetaan päivityksiä
};

/**
 * Kuvaus, jonka avulla aktiiviset live yhteydet pidetään muistissa.
 */
const liveConnections: Map<string, LiveConnection> = new Map();

type LiveMatch = {
    startTime: number;
    lastActivity: number;
    score: number[];
    data: any;
};

/**
 * Kuvaus (ep_ottelu.id) -> LiveMatch.
 */
const liveMatches: Map<number, LiveMatch> = new Map();

/**
 * Kirjoittaa yhteyteen ottelun tilan.
 */
function sendLiveMatch(connectionId: string, liveMatch: LiveMatch) {
    const connection = liveConnections.get(connectionId);
    if (!connection)
        return;
    const data = { type: "matchUpdate", data: liveMatch.data };
    connection.res.write(`data: ${base64JSONStringify(data)}\n\n`);
}

/**
 * Kirjoittaa yhteyteen listan otteluista.
 */
function sendMatchList(connectionId: string, matchList: any[]) {
    const connection = liveConnections.get(connectionId);
    if (!connection)
        return;
    const data = { type: "matchListUpdate", data: matchList };
    connection.res.write(`data: ${base64JSONStringify(data)}\n\n`);
}

/**
 * Käy läpi liveConnections ja kirjoittaa ottelua matchId vastaaviin
 * yhteyksiin ottelun tilan.
 * 
 * HUOM! Tässä tehdään ylimääräistä työtä koska jokainen liveConnections
 * käydään läpi mutta tämä on hyvin yksinkertainen ratkaisu. Jos tietoliikennettä 
 * olisi paljon enemmän, tulisi käyttää lisätietorakennetta toimen tehostamiseen.
 */
function broadcastLiveMatch(matchId: number) {
    // Käy läpi liveConnections ja kirjoita siihen jos matchId vastaavat.
    const liveMatch = liveMatches.get(matchId);
    if (!liveMatch)
        return;
    
    for (let [connectionId, connection] of liveConnections) {
        if (connection.matchId != matchId)
            continue;
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
        matchList.push({ matchId: matchId, home: liveMatch.data.teamHome.teamName, away: liveMatch.data.teamAway.teamName, score: liveMatch.score, submitStartTime: startTimeAsDate.toISOString() });
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
 * Vastaanottaa keskeneräisen pöytäkirjan live-seurantaa varten.
 */
router.post('/submit_match', async (req, res) => {
    if (!req.body.result)
        res.status(400).send(`Missing result`);
    const result = req.body.result;
    const score = currentScore(result);

    const matchId = result.id;
    const now = Date.now();

    let liveMatch: LiveMatch | undefined = liveMatches.get(matchId);
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
    }
    
    // Jos ottelupöytäkirja on lähetetty, poistetaan seuranta:
    if (liveMatch && liveMatch.data.isSubmitted) {
        console.log("Poistetaan taulukosta liveMatches lähetettynä:", matchId);
        liveMatches.delete(matchId);
        isMatchListChanged = true;
    }

    if (isMatchListChanged)
        broadcastMatchList();
    broadcastLiveMatch(matchId);

    console.log("Server received live match data, matchId:", matchId);
    res.json({ ok: true });
});

/**
 * Palauttaa listan liveMatches otteluista
 */
router.get('/get_match_list', async (_req, res) => {
    const matchList = createMatchList();
    res.json({ data: matchList });
});

/**
 * Alustetaan uusi SSE-yhteys live-seurantaa varten.
 */
router.get('/watch_match/:matchId?', async (req, res) => {
    let liveMatch: LiveMatch | undefined = undefined;
    let matchId = undefined;
    if (req.params.matchId) {
        matchId = parseInt(req.params.matchId);
        if (isNaN(matchId))
            matchId = undefined;
        else
            liveMatch = liveMatches.get(matchId);
    }

    // Headers SSE varten:
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const now = Date.now();
    const connectionId = createRandomUniqueIdentifier();
    liveConnections.set(connectionId, { startTime: now, matchId: matchId, res: res});

    sendMatchList(connectionId, createMatchList());
    if (liveMatch)
        sendLiveMatch(connectionId, liveMatch);

    // Handle client disconnect
    req.on('close', () => {
        liveConnections.delete(connectionId);
    });

    console.log(`liveScoreRoutes: /watch_match/${matchId} done`);
});

// Asetetaan periodisesti toistuva tehtävä SSE varten: poistetaan vanhentuneet
// yhteydet ja live-ottelut.
setInterval(() => {
    const now = Date.now();

    // Poistetaan liian vanhat liveMatches:
    const liveMatchesToDelete = [];
    for (const [matchId, liveMatch] of liveMatches) {
        if ((now - liveMatch.lastActivity > MAX_LIVE_MATCH_INACTIVITY) 
            || (now - liveMatch.startTime > MAX_LIVE_MATCH_DURATION))
            liveMatchesToDelete.push(matchId);
    }
    for (let key of liveMatchesToDelete)
        liveMatches.delete(key);

    // Jos listaan tehtiin muutoksia, lähetetään uusi lista kaikille:
    if (liveMatchesToDelete.length > 0)
        broadcastMatchList();

    // Poistetaan vanhat liveConnections:
    const liveConnectionsToDelete = [];
    for (const [connectionId, connection] of liveConnections) 
        if (now - connection.startTime > MAX_LIVE_CONNECTION_DURATION)
            liveConnectionsToDelete.push(connectionId);
    for (let key of liveConnectionsToDelete)
        liveConnections.delete(key);

    console.log("#liveMatches: ", liveMatches.size, "#liveConnections: ", liveConnections.size);

}, MAINTENANCE_INTERVAL);

export default router;