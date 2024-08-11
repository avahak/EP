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
import liveScoreRouter from './liveScoreRoutes.js';
import machineVisionRouter from './machine_vision/machineVisionRoutes.js';
import databaseRouter from './database/dbRoutes.js';
import generalRouter from './generalRoutes.js';
import { logger, initializeErrorHandling } from './serverErrorHandler.js';
import 'express-async-errors';

const app = express();

const PORT = process.env.PORT;
const BASE_URL = process.env.BASE_URL || "";

// Käytetään Helmet kirjastoa parantamaan tietoturvaa, asettaa esim. HTTP headereita:
// app.use(helmet());
// console.log(helmet.contentSecurityPolicy.getDefaultDirectives());
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

/**
 * Muuten käytetään Reactin omaa reititystä:
 */
const wildcard = BASE_URL ? `${BASE_URL}/*` : '*';
app.get(wildcard, (_req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

// Alustetaan virheenkäsittelijät:
initializeErrorHandling(app);

// Käynnistetään express.js serveri:
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}.`);
});
