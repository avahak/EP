import { Response } from 'express';
import { LiveMatch } from './liveTypes';
import { base64JSONStringifyNode } from '../../shared/generalUtils';
import { logger } from '../logger';

/**
 * Luokka ottelun seuraamiseen käytettävälle yhteydelle.
 */
class LiveConnection {
    // yhteys clientiin, tähän kirjoitetaan päivityksiä
    res: Response;
    matchId: number | undefined;
    // Aika kun viimeisen kerran lähetettiin oikeaa dataa (ei heartbeat)
    lastUpdateTime: number;
    // Aika kun viimeisen kerran lähetettiin mikä tahansa viesti
    lastWriteTime: number;
    // Jos true niin kirjoittamista tulisi välttää. Tarkista tämän arvo ennen kirjoittamista!
    waitingForDrain: boolean;
    lastSentMatchListVersion: number | undefined;
    lastSentMatchVersion: number | undefined;

    constructor(res: Response, matchId: number|undefined) {
        this.res = res;
        this.matchId = matchId;
        this.lastUpdateTime = 0;        // vuonna 1970
        this.lastWriteTime = 0;         // vuonna 1970
        this.waitingForDrain = false;

        // Headerit SSE varten
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-store, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-Accel-Buffering', 'no');

        // Käsitellään kirjoittamiseen liittyvät ongelmat, esimerkiksi kun kirjoitetaan res.end() jälkeen
        res.on('error', (error) => {
            logger.error('Stream error on text stream response', error);
        });

        // Kuunnellaan drain event 
        res.on('drain', () => {
            this.waitingForDrain = false;
        });
    }

    /**
     * Kirjoittaa viestin yhteyteen. Tässä ei tarkisteta waitingForDrain.
     */
    writeMessage(message: string, containsActualData: boolean = true) {
        if (!this.res.writable || this.res.writableEnded) 
            return;
        const now = Date.now();
        this.lastWriteTime = now;
        if (containsActualData)
            this.lastUpdateTime = now; 
        const hasCapacity = this.res.write(message);
        if (!hasCapacity)
            this.waitingForDrain = true;
    }

    /**
     * Kirjoittaa yhteyteen ottelun tilan.
     */
    sendLiveMatch(liveMatch: LiveMatch) {
        if ((this.lastSentMatchVersion !== undefined) && (this.lastSentMatchVersion >= liveMatch.version))
            return;
        const data = { type: "matchUpdate", timestamp: liveMatch.lastUpdateTime, version: liveMatch.version, data: liveMatch.data };
        try {
            this.writeMessage(`data: ${base64JSONStringifyNode(data)}\n\n`);
            this.lastSentMatchVersion = liveMatch.version;
        } catch (error) {
            logger.error(`Failed sendLiveMatch`);
        }
    }

    /**
     * Kirjoittaa yhteyteen listan otteluista.
     */
    sendMatchList(matchList: any[], matchListVersion: number) {
        if ((this.lastSentMatchListVersion !== undefined) && (this.lastSentMatchListVersion >= matchListVersion))
            return;
        const data = { type: "matchListUpdate", data: matchList };
        try {
            this.writeMessage(`data: ${base64JSONStringifyNode(data)}\n\n`);
            this.lastSentMatchListVersion = matchListVersion;
        } catch (error) {
            logger.error(`Failed sendMatchList`);
        }
    }

    sendHeartbeat() {
        try {
            this.writeMessage(`data: hb\n\n`, false);
        } catch (error) {
            // logger.error(`Failed sendHeartbeat`);
        }
    }
}

export { LiveConnection };