/**
 * Live tulospalveluun liittyvät reitit ja muu tarvittava.
 */

import express, { Router } from 'express';
import { base64JSONStringify } from '../shared/generalUtils.js';
// import { logger } from '../server/serverErrorHandler.js';

const router: Router = express.Router();

// Aikoja millisekunteina, helpottaa koodin lukemista:
const SECOND = 1000;
const MINUTE = 60*SECOND;
//@ts-ignore
const HOUR = 60*MINUTE;

type LiveMatchConnection = {
    startTime: number;
    matchId: number;
    res: any;           // yhteys clientiin
};

const liveMatchConnections: Map<string, LiveMatchConnection> = new Map();

type LiveMatch = {
    startTime: number;
    lastActivity: number;
    data: any;
};

// Kuvaus (ep_ottelu.id) -> LiveMatch
const liveMatches: Map<number, LiveMatch> = new Map();

/**
 * Kirjoittaa yhteyteen ottelun tilan.
 */
function sendLiveMatchTo(liveMatch: LiveMatch, connectionId: string) {
    const connection = liveMatchConnections.get(connectionId);
    if (!connection)
        return;
    connection.res.write(`data: ${base64JSONStringify(liveMatch)}\n\n`);
}

/**
 * Käy läpi liveMatchConnections ja kirjoittaa ottelua matchId vastaaviin
 * yhteyksiin ottelun tilan.
 */
function broadcastLiveMatch(matchId: number) {
    // käy läpi liveMatchConnections ja kirjoita jos matchId vastaavat
    const liveMatch = liveMatches.get(matchId);
    if (!liveMatch)
        return;
    
    for (let [connectionId, connection] of liveMatchConnections) {
        if (connection.matchId != matchId)
            continue;
        sendLiveMatchTo(liveMatch, connectionId);
    }
}

/**
 * Vastaanottaa keskeneräisen pöytäkirjan live-seurantaa varten.
 */
router.post('/submit_match', async (req, res) => {
    if (!req.body.result)
        res.status(400).send(`Missing result`);
    const result = req.body.result;

    const matchId = result.id;
    const now = Date.now();

    let liveMatch: LiveMatch | undefined = liveMatches.get(matchId);
    if (liveMatch) {
        // Päivitä olemassaolevaa liveMatch:
        liveMatch.lastActivity = now;
        liveMatch.data = result;
    } else {
        // Luodaan uusi liveMatch
        liveMatch = { startTime: now, lastActivity: now, data: result };
        liveMatches.set(matchId, liveMatch);
    }
    broadcastLiveMatch(matchId);

    console.log("Server received live match data, matchId:", matchId);
    res.json({ ok: true });
});

/**
 * Palauttaa listan liveMatches otteluista
 */
router.get('/get_match_list', async (_req, res) => {
    const matchList = [];
    for (const [matchId, liveMatch] of liveMatches)
        matchList.push({ id: matchId, home: liveMatch.data.teamHome.teamName, away: liveMatch.data.teamAway.teamName });
    res.json({ data: matchList });
});

/**
 * Alustetaan uusi SSE-yhteys live-seurantaa varten.
 */
router.get('/watch_match/:matchId', async (req, res) => {
    const matchId = parseInt(req.params.matchId);
    if (isNaN(matchId)) {
        res.status(400).send("Invalid matchId.");
        return;
    }
    const liveMatch = liveMatches.get(matchId);
    if (!liveMatch) {
        res.status(404).send("Live match not found.");
        return;
    }

    // Headers SSE varten:
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const now = Date.now();
    const connectionId = now.toString() + Math.random().toString();
    liveMatchConnections.set(connectionId, { startTime: now, matchId: matchId, res: res});

    sendLiveMatchTo(liveMatch, connectionId);

    // Handle client disconnect
    req.on('close', () => {
        liveMatchConnections.delete(connectionId);
    });

    console.log(`liveScoreRoutes: /watch_match/${matchId} done`);
});

// Asetetaan periodisesti toistuva tehtävä SSE varten: poistetaan vanhentuneet
// yhteydet ja live-ottelut.
setInterval(() => {
    const now = Date.now();

    // Poistetaan vanhat liveMatches:
    const liveMatchesToDelete = [];
    for (const [matchId, liveMatch] of liveMatches) 
        if ((now - liveMatch.lastActivity > 10*MINUTE) || (now - liveMatch.startTime > 1*HOUR))
            liveMatchesToDelete.push(matchId);
    for (let key of liveMatchesToDelete)
        liveMatches.delete(key);

    // Poistetaan vanhat liveMatchConnections:
    const liveMatchConnectionsToDelete = [];
    for (const [connectionId, connection] of liveMatchConnections) 
        if (now - connection.startTime > 1*HOUR)
            liveMatchConnectionsToDelete.push(connectionId);
    for (let key of liveMatchConnectionsToDelete)
        liveMatchConnections.delete(key);

}, 10*MINUTE);

export default router;