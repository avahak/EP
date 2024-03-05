import fs from 'fs';
import { Express, NextFunction, Request, Response } from 'express';
import winston from 'winston';

const MB = 1024*1024;

const BASE_URL = process.env.BASE_URL || "";
const LOG_FILE_DIRECTORY = process.env.LOG_FILE_DIRECTORY || '.';

// Luodaan hakemisto lokitiedostoille, jos ei vielä olemassa.
if (!fs.existsSync(LOG_FILE_DIRECTORY))
    fs.mkdirSync(LOG_FILE_DIRECTORY, { recursive: true });

/** 
 * Määrittää miten virheilmoitukset kirjoitetaan konsolille.
 */
const winstonConsoleFormat = winston.format.prettyPrint();

/** 
 * Määrittää miten virheilmoitukset kirjoitetaan lokitiedostoon.
 */
const winstonFileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'DD-MM-YYYYTHH:mm:ss' }),
    winston.format.printf(info => {
        const { timestamp, ...restInfo } = info;
        // Tämä vain siirtää timestamp alkuun:
        return JSON.stringify({ timestamp, ...restInfo });
    }),
);

/** 
 * Winston virheloggeri, kirjoittaa virheet konsolille ja lokitiedostoon.
 * Winston vakio tasot: error, warn, info, http, verbose, debug, silly.
 */
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',      // minimi leveli entrylle
    transports: [
        new winston.transports.Console({ format: winstonConsoleFormat }),
        new winston.transports.File({ 
            format: winstonFileFormat,
            filename: (process.env.LOG_FILE_DIRECTORY || '.') + '/error.log', 
            maxsize: 5*MB,
            level: 'error',
            maxFiles: 3,
        }),
    ],
});

/**
 * Määrittelee globaalit virheenkäsittelijät.
 */
function initializeErrorHandling(app: Express) {
    // Vain testausta varten: 
    // TODO poista nämä reitit
    app.get(BASE_URL + '/throw_sync_error', (_req, _res) => {
        throw Error('Sync error');
    });
    app.get(BASE_URL + '/throw_async_error', async (_req, _res) => {
        throw Error('Async error');
    });

    // Globaali virheenkäsittely:
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction): any => {
        logger.error("global error handler:", err, err.stack);
        res.status(500).send('Something went wrong.');
    });

    // Tapahtumankuuntelija, joka sieppaa käsittelemättömät lupaus-hylkäämiset:
    // HUOM! Pysäyttää serverin.
    process.on('unhandledRejection', (reason, _promise) => {
        logger.error("unhandledRejection causes server crash:", reason);
        // Pysäytetään serveri:
        process.exit(1);
    });
};

export { logger, initializeErrorHandling };