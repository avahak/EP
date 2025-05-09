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
 */
/**
 * Correctness proof idea:
 * Claim 1: Every local change the user makes gets incorporated into all versions 
 * starting from some time on the server and stays until it is overridden by another 
 * user change on the server.
 * Claim 2: The client’s form matches the newest version it has received from the server, 
 * except possibly in the fields where the user has made local changes.
 */


// use the following?
// res.on("close" instead of req.on("close"
//   res.writeHead(200, {
//     "Connection": "keep-alive",
//     "Cache-Control": "no-cache",
//     "Content-Type": "text/event-stream",
//   });
// https://github.com/zacbarton/node-server-sent-events/blob/master/index.js#L11

// see also https://github.com/dpskvn/express-sse/blob/master/index.js



import express, { Router } from 'express';
import { createRandomUniqueIdentifier } from '../../shared/generalUtils.js';
import { currentScore } from '../../client/utils/matchTools.js';
import { LiveMatchEntry } from '../../shared/commonTypes.js';
import { injectAuth, requireAuth } from '../auth/auth.js';
import { integrateLiveMatchChanges } from '../../shared/liveMatchTools.js';
import { LiveMatch } from './liveTypes.js';
import { logger } from '../logger.js';
import { CustomError } from '../../shared/customErrors.js';
import { LiveConnection } from './liveConnection.js';
import { BROADCAST_INTERVAL_MS, HEARTBEAT_INTERVAL_MS, MAINTENANCE_INTERVAL_MS, 
    MAX_LIVE_CONNECTION_INACTIVITY_MS, MAX_LIVE_MATCH_DURATION_MS, 
    MAX_LIVE_MATCH_INACTIVITY_MS } from '../config.js';
import { ScoresheetFields } from '../../shared/scoresheetTypes.js';

const router: Router = express.Router();

/**
 * Kuvaus, jonka avulla aktiiviset live yhteydet pidetään muistissa.
 * Avain on merkityksetön satunnainen merkkijono.
 */
const liveConnections: Map<string, LiveConnection> = new Map();

/**
 * Live-ottelut, kuvaus (ep_ottelu.id) -> LiveMatch.
 */
const liveMatches: Map<number, LiveMatch> = new Map();

/**
 * Live-otteluiden tilanne.
 */
let matchList: LiveMatchEntry[] = [];

/**
 * Jos jonkin live-ottelun tilanne muuttuu, lisätään versiota yhdellä.
 * Vertaamalla tätä LiveConnection.lastSentMatchListVersion nähdään tarvitseeko
 * uusi tilanne lähettää yhteyteen.
 */
let matchListVersion: number = 0;

/**
 * Pitää kirjaa kuinka monta live-ottelu-pyyntöä serveri on käsitellyt 
 * (get_match ja submit_match).
 */
let numLiveUpdateRequests: number = 0;

/**
 * Päivittää listan live-otteluista yhteyksiin lähetettävässä muodossa.
 * Jos lista on jo ajan tasalla, ei tehdä mitään.
 */
function updateMatchList() {
    const newMatchList: LiveMatchEntry[] = [];
    for (const [matchId, liveMatch] of liveMatches) {
        const startTimeAsDate = new Date(liveMatch.startTime);
        newMatchList.push({ 
            matchId, 
            home: liveMatch.data.teamHome.name, 
            away: liveMatch.data.teamAway.name, 
            score: liveMatch.score, 
            startTime: startTimeAsDate.toISOString() 
        });
    }
    // Tarkistetaan onko muuttunut, HIDAS!
    if (JSON.stringify(matchList) !== JSON.stringify(newMatchList)) {
        matchList = newMatchList;
        matchListVersion++;
    }
}

/**
 * Palauttaa tekstimuotoisen tiedon otteluiden ja seuraajien määrästä.
 */
function getLivescoreInfo() {
    const matchIds = Array.from(liveMatches.keys());
    return `${matchIds.length} ottelua (${matchIds}), ${liveConnections.size} yhteyttä, yhteensä ${numLiveUpdateRequests} pyyntöä`;
}

/**
 * Tämä kutsutaan kun ottelupöytäkirja talletetaan tietokantaan hyväksytysti.
 */
function endLiveMatch(matchId: number, newStatus: string, originalData: ScoresheetFields) {
    try {
        logger.info("endLiveMatch", { matchId, newStatus });
        const liveMatch = liveMatches.get(matchId);
        if (liveMatch) {
            liveMatch.data = originalData;
            liveMatch.data.status = newStatus;
            liveMatch.lastUpdateTime = Date.now();
            liveMatch.version++;
        }
    } catch (error) {
        logger.error("Error in endLiveMatch", { matchId });
    }
}

/**
 * Vastaanottaa keskeneräisen pöytäkirjan live-seurantaa varten.
 * HUOM! TODO Tässäkin tulisi tehdä jonkinlaista validointia, muutoin 
 * väärinkäyttö mahdollinen.
 */
router.post('/submit_match', injectAuth, requireAuth(), async (req, res, next) => {
    try {
        numLiveUpdateRequests++;
        if (numLiveUpdateRequests % 100 == 0)
            logger.info("Live-otteluiden pyyntöjen määrä", { num: numLiveUpdateRequests });

        const matchId = Number(req.body.matchId);
        if (Number.isNaN(matchId))
            throw new CustomError("INVALID_INPUT", { field: "matchId" })
        const data = req.body.data;

        // console.log("matchId", matchId, "data", data);

        const version = data?.version ?? -1;

        // Jos pyynnössä on lähetetty otteludataa, integroidaan se live-otteluihin
        if (data?.newValues) {
            const result = data?.newValues;
            const oldResult = data?.oldValues;
            if (!result)
                throw new CustomError("INVALID_INPUT", { field: "newValues" })
            if (result.status !== "T") 
                throw new CustomError("INVALID_INPUT", { field: "newValues" })

            const now = Date.now();

            let liveMatch: LiveMatch|undefined = liveMatches.get(matchId);
            if (liveMatch) {
                // console.log("received update from", author);
                // console.log("liveMatch.data", liveMatch.data.scores[0]);
                // console.log("oldResult", oldResult.scores[0]);
                // console.log("newResult", result.scores[0]);

                // Päivitä olemassaolevaa liveMatch:
                liveMatch.lastUpdateTime = now;
                liveMatch.version++;

                logger.info("Live match update", { matchId, ip: req.ip });

                // liveMatch.data = combineLiveMatchPlayers(liveMatch.data, result);
                if (oldResult)
                    liveMatch.data = integrateLiveMatchChanges(liveMatch.data, oldResult, result);
                else 
                    liveMatch.data = integrateLiveMatchChanges(liveMatch.data, liveMatch.data, result);

                const score = currentScore(liveMatch.data);
                liveMatch.score = score;
            } else {
                // Luodaan uusi liveMatch
                if (result.status === "T") {
                    const score = currentScore(result);
                    liveMatch = { startTime: now, lastUpdateTime: now, version: 0, data: result, score: score };
                    liveMatches.set(matchId, liveMatch);
                    logger.info("Starting match in liveScoreRoutes", { matchId, ip: req.ip });
                    // Tavallisesta poiketen lähetetään ottelun tietoja heti, ei viiveellä.
                    // Tämä tehdään koska muutoin Scoresheet ylikirjoittaa viiveellä ensimmäisen muutokset uudessa lomakkeessa.
                    // broadcast(matchId);
                    // HUOM tätä ei enää tehdä mutta ei pitäisi tarvita koska uusi versio
                    // lähetetään heti takaisin vastauksena
                }
            }

            updateMatchList();
        }

        const liveMatch: LiveMatch|undefined = liveMatches.get(matchId);
        // console.log("versions: request:", version, "on server:", liveMatch?.version);
        if (!liveMatch || version === liveMatch.version) {
            if (!res.headersSent && !res.writableEnded)
                return res.json({ });
        } else {
            const responseData = { timestamp: liveMatch.lastUpdateTime, version: liveMatch.version, data: liveMatch.data };
            if (!res.headersSent && !res.writableEnded)
                return res.json(responseData);
        }
    } catch (error) {
        next(error);
    }
});

/**
 * Alustetaan uusi SSE-yhteys live-seurantaa varten.
 */
router.get('/watch_match/:matchId?', async (req, res) => {
    try {
        let liveMatch: LiveMatch|undefined = undefined;
        let matchId: undefined | number = undefined;
        if (req.params.matchId) {
            matchId = parseInt(req.params.matchId);
            if (isNaN(matchId))
                matchId = undefined;
            else
                liveMatch = liveMatches.get(matchId);
        }

        const connection = new LiveConnection(res, matchId);

        const connectionId = createRandomUniqueIdentifier();
        liveConnections.set(connectionId, connection);

        // from https://github.com/zacbarton/node-server-sent-events/blob/master/index.js#L11
        // req.socket.setKeepAlive(true);
        // req.setTimeout(0);
        // req.socket.setNoDelay(true);

        req.socket.setKeepAlive(true);
        req.socket.setTimeout(0);

        // Kosmeettinen, ainoastaan duplikaattien lokimerkintöjen estämiseksi
        let errorLogged = false;

        // Käsitellään client disconnect
        req.on('close', () => {
            liveConnections.delete(connectionId);
            if (!errorLogged)
                logger.info("SSE close", { matchId, id: connectionId, numSSE: liveConnections.size });
            res.end();
        });

        // Käsitellään yhteysongelmat - tämä tapahtuu myös kun EventSource suljetaan (ECONNRESET)
        req.on('error', (err) => {
            errorLogged = true;
            liveConnections.delete(connectionId);
            logger.info("SSE error", { matchId, id: connectionId, numSSE: liveConnections.size, code: (err as any).code || '-' });
            res.end();
        });

        connection.sendMatchList(matchList, matchListVersion);
        if (liveMatch)
            connection.sendLiveMatch(liveMatch);

        logger.info("/watch_match", { matchId, id: connectionId, ip: req.ip, numSSE: liveConnections.size });
    } catch (error) {
        logger.error(`Error during /watch_match`, error);
        res.end();
    }
});

/**
 * Palauttaa ottelun ilman SSE-yhteyttä. Pyynnön yhteydessä lähetetään
 * viimeiset versionumerot ja jos serverillä on uudempia tietoja, ne lähetetään takaisin.
 */
router.get('/get_match', async (req, res, next) => {
    try {
        numLiveUpdateRequests++;
        if (numLiveUpdateRequests % 100 == 0)
            logger.info("Live-otteluiden pyyntöjen määrä", { num: numLiveUpdateRequests });

        const matchId = Number(req.query.mId);
        const matchVersion = Number(req.query.mVer);
        const listVersion = Number(req.query.lVer);
        if (Number.isNaN(matchId))
            throw new CustomError("INVALID_INPUT", { field: "mId" });
        if (Number.isNaN(matchVersion))
            throw new CustomError("INVALID_INPUT", { field: "mVer" });
        if (Number.isNaN(listVersion))
            throw new CustomError("INVALID_INPUT", { field: "lVer" });

        // Tämän loggaus toisi suuren määrän rivejä, ei tehdä lokimerkintää
        // logger.info("live/get_match", { matchId, ip: req.ip });

        const liveMatch = Number.isNaN(matchId) ? null : liveMatches.get(matchId);
        const matchObject = liveMatch ? { timestamp: liveMatch.lastUpdateTime, version: liveMatch.version, data: liveMatch.data } : null;
        const listObject = { version: matchListVersion, data: matchList };

        const data = { 
            "match": (liveMatch && liveMatch.version === matchVersion) ? null : matchObject, 
            "list": matchListVersion === listVersion ? null : listObject,
        };

        // console.log("body", req.body);
        // console.log("data", data);

        if (!res.headersSent && !res.writableEnded)
            return res.json(data);
    } catch (error) {
        next(error);
    }
});

/**
 * Lähetetään otteludata ja tilanteet SSE-yhteyksiin.
 * Jos matchId on määritelty, on kyseessä ylimääräinen lähetys (ei setTimout kautta).
 * Silloin lähetetään vain vastaavan ottelun dataa. Muutoin lähetetään kaikki 
 * live-ottelut ja tilanteet.
 */
function broadcast(matchId?: number) {
    try {
        const now = Date.now();

        // Päivitetään matchList
        updateMatchList();

        // Käydään liveConnections läpi ja kirjoitetaan kuhunkin
        for (let [_connectionId, connection] of liveConnections) {
            // Jos halutaan lähettää vain tietty ottelu, niin kaikkia ei tarvitse käydä läpi
            if (matchId && connection.matchId !== matchId)
                continue;

            // Jos aikaisempia viestejä ei ole vielä saatu lähetetyä, ei yritetä kirjoittaa
            if (connection.waitingForDrain)
                continue;

            // Jos jonkin ottelun tilanne on muuttunut, lähetetään tilanteet
            connection.sendMatchList(matchList, matchListVersion);

            // Jos ottelusta on uusi versio, lähetetään se
            if (connection.matchId) {
                const liveMatch = liveMatches.get(connection.matchId);
                if (liveMatch)
                    connection.sendLiveMatch(liveMatch);
            }

            // Lähetetään jokaiselle yhteydelle "heartbeat" pitämään se elossa.
            // Syy tarpeellisuuteen: https://bugzilla.mozilla.org/show_bug.cgi?id=444328
            if (now-connection.lastWriteTime > HEARTBEAT_INTERVAL_MS)
                connection.sendHeartbeat();
        }
    } catch (error) {
        logger.error("Error during broadcast", error);
    }
}

/**
 * Periodisesti toistuva tehtävä: lähetetään otteludataa.
 */
function runBroadcast() {
    broadcast();
    // Sovitaan seuraava broadcast
    setTimeout(runBroadcast, BROADCAST_INTERVAL_MS).unref();
}

/**
 * Periodisesti toistuva tehtävä: poistetaan vanhentuneet yhteydet ja live-ottelut.
 */
function runMaintenance() {
    try {
        logger.info("liveScoreRoutes runMaintenance");
        const now = Date.now();

        // Poistetaan liian vanhat, epäaktiiviset ottelut ja lähetetyt ottelut
        const liveMatchesToDelete = [];
        for (const [matchId, liveMatch] of liveMatches) {
            if (
                (now - liveMatch.lastUpdateTime > MAX_LIVE_MATCH_INACTIVITY_MS) ||
                (now - liveMatch.startTime > MAX_LIVE_MATCH_DURATION_MS) ||
                (liveMatch.data.status !== "T")
            )
                liveMatchesToDelete.push(matchId);
        }
        for (let key of liveMatchesToDelete)
            liveMatches.delete(key);

        // Poistetaan liveConnections jos niihin ei ole lähetetty mitään tuloksia pitkän aikaan
        const liveConnectionsToDelete = [];
        for (const [connectionId, connection] of liveConnections) 
            if (now - connection.lastUpdateTime > MAX_LIVE_CONNECTION_INACTIVITY_MS)
                liveConnectionsToDelete.push(connectionId);
        for (let key of liveConnectionsToDelete)
            liveConnections.delete(key);

    } catch (error) {
        logger.error("Error during runMaintenance", error);
    } finally {
        // Sovitaan seuraava maintenance
        setTimeout(runMaintenance, MAINTENANCE_INTERVAL_MS).unref();
    }
}

// Aloitetaan periodisten tehtävien ajaminen
setTimeout(runMaintenance, MAINTENANCE_INTERVAL_MS).unref();
setTimeout(runBroadcast, BROADCAST_INTERVAL_MS).unref();

// DEBUGGING, REMOVE! Used to test SSE crashes.
// setInterval(() => {
//     for (let [_connectionId, connection] of liveConnections) {
//         if (connection) {
//             connection.res.end();
//         }
//     }
// }, 43*SECOND_ms);

export { router as liveScoreRouter, getLivescoreInfo, endLiveMatch };