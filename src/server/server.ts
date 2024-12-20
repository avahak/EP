/**
 * Express.js serverin luonti. Serveri välittää staattiset tiedostot, mukaanlukien
 * React frontendin. Se vastaa myös API-pyyntöihin tietokantadatan välittämiseksi
 * frontendille.
 * 
 * HUOM! Tulee olla tarkkana eri app.use ja reittien lisäyksen järjestyksen kanssa!
 * 
 * HTTP status muistilista, ks. https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 * --- Ranges ---
 * 100-199: Informational responses
 * 200-299: Successfull responses
 * 300-399: Redirection messages
 * 400-499: Client error messages
 * 500-599: Server error messages
 * -----------------------
 * 200 OK: Request was successful.
 * 201 Created: Request resulted in a new resource being created.
 * 204 No Content: Request was successful, but no additional content to send.
 * 400 Bad Request: Server could not understand the request due to invalid syntax.
 * 401 Unauthorized: Authentication is required, and the client failed to provide valid credentials.
 * 403 Forbidden: Server refuses to authorize the request.
 * 404 Not Found: Server could not find the requested resource.
 * 500 Internal Server Error: An unexpected condition was encountered on the server.
 * 501 Not Implemented: Server does not support the functionality required to fulfill the request.
 * 503 Service Unavailable: Server is not ready to handle the request.
 */

// Ladataan ympäristömuuttuja ennen muuta koodia, jotta ne ovat käytössä import komennoille:
import dotenv from 'dotenv';
dotenv.config();
// Tarkistetaan myös, että ainakin muutama tärkein ympäristömuuttuja on määritelty:
if (!process.env.PORT || !process.env.SECRET_KEY || !process.env.KULUVA_KAUSI 
    || !process.env.DB_NAME)
    throw new Error('Missing an environment variable, check server configuration.');

import express from 'express';
import helmet from 'helmet';
import path from 'path';
import cors from 'cors';
import { authRouter } from './auth/auth.js';
import { liveScoreRouter, getLivescoreInfo } from './live/liveScoreRoutes.js';
import machineVisionRouter from './machine_vision/machineVisionRoutes.js';
import databaseRouter from './database/dbRoutes.js';
import generalRouter from './generalRoutes.js';
import { initializeErrorHandling, getShutdownErrorCounter } from './serverErrorHandler.js';
import 'express-async-errors';
import { buildTimestamp } from '../shared/buildInfo.js';
import { currentTimeInFinlandString, dateToYYYYMMDD } from '../shared/generalUtils.js';
import { freemem } from 'os';
import { getMatchSubmissionLocksString } from './database/dbMatchLocks.js';
import { logger } from './logger.js';
import { RESPONSE_DELAYED_MS, RESPONSE_TIMEOUT_MS } from './config.js';
import './eventLoopLag.js';

const app = express();

// Tarvitaan req.ip lukemiseen kun ollaan proxyn takana
app.set('trust proxy', true);

const PORT = process.env.PORT;
const BASE_URL = process.env.BASE_URL || "";

const serverStartTime = currentTimeInFinlandString();

// Käytetään Helmet kirjastoa parantamaan tietoturvaa, asettaa esim. HTTP headereita:
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                'default-src': ["'self'", 'https://www.example.com'],
                'style-src': ["'self'", 'https:', "'unsafe-inline'"],
            },
        },
    }));
// Sallitaan CORS-pyynnöt kaikille lähteille:
app.use(cors());
// Määritetään middleware JSON-parsija:
app.use(express.json());


// Middleware joka laskee pyynnön vastausajan ja varoittaa jos se on pitkä.
// Jos vastausta ei ole annettu pitkään aikaan, yhteys katkaistaan.
app.use((req, res, next) => {
    res.setTimeout(RESPONSE_TIMEOUT_MS, () => {
        logger.warn("Request has timed out", { method: req.method, url: req.url, headersSent: res.headersSent, ip: req.ip });
        if (!res.headersSent && !res.writableEnded) {
            res.status(500).send('Server response timeout');
        } else {
            res.end();
        }
    });

    const startTime = Date.now();
    res.on('finish', () => {
        const diff = Date.now() - startTime;
        if (diff > RESPONSE_DELAYED_MS)
            logger.warn("Request took long time to finish", { method: req.method, url: req.url, duration: `${(diff/1000).toFixed(1)}s`, ip: req.ip });
    });

    next();
});

// Ei välitetä lähdetiedostoja:
app.use([BASE_URL + '/server/*', BASE_URL + '/client/*', BASE_URL + '/shared/*'], (_req, res) => {
    return res.status(403).send("Forbidden.");
});

// Välitä staattisia tiedostoja 'dist' hakemistosta:
app.use(BASE_URL, express.static(path.join(process.cwd(), 'dist'), {
    // maxAge on maksimiaika selaimen välimuistin käytölle (3600000 on yksi tunti). 
    // Huom! Tämän voi poistaa tuotantoversiossa.
    maxAge: 2 * 3600000
}));

// Lisätään live tulospalvelun reitit:
app.use(BASE_URL + '/api/live', liveScoreRouter);
// Lisätään konenäön reitit (voi poistaa tuotantoversiossa):
app.use(BASE_URL + '/api/vision', machineVisionRouter);
// Lisätään reitit tietokannan käsittelyyn:
app.use(BASE_URL + '/api/db', databaseRouter);
// Lisätään autentikaatioon liittyvät reitit:
app.use(BASE_URL + '/auth', authRouter);
// Lisätään sekalaiset reitit (voi poistaa tuotantoversiossa):
app.use(BASE_URL + '/api', generalRouter);

// Tietoa serveristä:
app.get(BASE_URL + '/info', (_req, res, next) => {
    try {
        const serverTime = currentTimeInFinlandString();
        const formatMemory = (b: number) => `${(b/(1024*1024)).toFixed(0)} MB`;
        const freeMemory = formatMemory(freemem());
        const usedMemory = process.memoryUsage();
        const usedMemoryRSS = formatMemory(usedMemory.rss);
        const usedMemoryHeap = formatMemory(usedMemory.heapUsed);
        res.setHeader('Content-Type', 'text/html');
        res.send(`Serverin aika: ${serverTime} (${(Date.now()/1000).toFixed(0)})<br>
            Koodi rakennettu: ${buildTimestamp}<br>
            Serveri käynnistetty: ${serverStartTime}, pid ${process.pid}<br>
            Live-ottelut: ${getLivescoreInfo()}<br>
            Muisti: rss: ${usedMemoryRSS}, heap: ${usedMemoryHeap}, free: ${freeMemory}<br>
            shutdownErrorCounter: ${getShutdownErrorCounter()}<br>
            matchSubmissionLocks: ${getMatchSubmissionLocksString()}<br>
            `);
    } catch (err) {
        next(err);
    }
});

// Päivämäärä serverin mukaan:
app.get(BASE_URL + '/date', (_req, res, next) => {
    try {
        const date = dateToYYYYMMDD(new Date());
        res.json({ date });
    } catch (err) {
        next(err);
    }
});

/**
 * Muuten käytetään Reactin omaa reititystä:
 */
const wildcard = BASE_URL ? `${BASE_URL}/*` : '*';
app.get(wildcard, (_req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

// Alustetaan virheenkäsittelijät:
// Huom! Tämä tulee olla kaikkien reittien jälkeen.
initializeErrorHandling(app);

// Käynnistetään express.js serveri:
app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}.`);
});
