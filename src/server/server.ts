/**
 * Express.js serverin luonti.
 * HUOM! Tulee olla tarkkana eri app.use ja reittien lisäyksen järjestyksen kanssa!
 * 
 * HTTP status lista, ks. https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
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

import dotenv from 'dotenv';
// Ladataan ympäristömuuttuja heti, jotta ne ovat käytössä import komennoille:
dotenv.config();
if (!process.env.PORT)
    throw new Error('Missing PORT environment variable, check server configuration.');

import express from 'express';
import helmet from 'helmet';
import path from 'path';
import cors from 'cors';
import liveScoreRoutes from './liveScoreRoutes.js';
import machineVisionRoutes from './machine_vision/machineVisionRoutes.js';
import databaseRoutes from './database/databaseRoutes.js';
import generalRoutes from './generalRoutes.js';
import { logger, initializeErrorHandling } from './serverErrorHandler.js';
import 'express-async-errors';

const app = express();

const PORT = process.env.PORT;
const BASE_URL = process.env.BASE_URL || "";

// Käytetään Helmet kirjastoa parantamaan turvallisuutta, asettaa HTTP headereita:
app.use(helmet());
// Kaikki reitit käyttävät CORS-politiikkaa:
app.use(cors());
// Määritetään middleware JSON-parsija:
app.use(express.json());

// Välitä staattisia tiedostoja 'dist' hakemistosta
app.use(BASE_URL, express.static(path.join(process.cwd(), 'dist')));

// Lisätään live tulospalvelun reitit:
app.use(BASE_URL + '/api/live', liveScoreRoutes);
// Lisätään konenäön reitit:
app.use(BASE_URL + '/api/vision', machineVisionRoutes);
// Lisätään reitit tietokannan käsittelyyn:
app.use(BASE_URL + '/api/db', databaseRoutes);
// Lisätään sekalaiset reitit:
app.use(BASE_URL + '/api', generalRoutes);

// Alustetaan virheenkäsittelijät:
initializeErrorHandling(app);

// Käynnistetään express.js serveri:
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});