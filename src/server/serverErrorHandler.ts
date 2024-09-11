/**
 * Virheenkäsittelyä ja lokitiedoston kirjoitusta serverille.
 */

import fs from 'fs';
import { Express, NextFunction, Request, Response } from 'express';
import winston from 'winston';

const MB = 1024*1024;

/**
 * Maksimimäärä kiinnisaamattomia poikkeuksia ennen serverin pysäyttämistä.
 * HUOM! Muista että tämä on vaarallinen lähestymistapa - serveri voi jäädä
 * käyntiin vaikka sen sisäinen tila on epäkelpo ja toimii epäodotetulla tavalla.
 */
const MAX_UNCAUGHT_ERRORS_BEFORE_SHUTDOWN = 5;
// Vastaava laskuri
let shutdownErrorCounter = 0;

// const BASE_URL = process.env.BASE_URL || "";
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
    winston.format.errors({ stack: true }),
    winston.format.timestamp({ format: 'DD-MM-YYYYTHH:mm:ss' }),
    winston.format.printf(info => {
        const { timestamp, level, message, ...restInfo } = info;
        // Tämä vain siirtää timestamp alkuun:
        return JSON.stringify({ timestamp, level, message, ...restInfo });
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
        new winston.transports.File({ 
            format: winstonFileFormat,
            filename: (process.env.LOG_FILE_DIRECTORY || '.') + '/info.log', 
            maxsize: 5*MB,
            level: 'info',
            maxFiles: 3,
        }),
    ],
});

/**
 * Palauttaa shutdownErrorCounter arvon.
 */
function getShutdownErrorCounter(): number {
    return shutdownErrorCounter;
}

/**
 * Pysäyttää serverin jos virheitä tulee liikaa (ei jäädä loputtomaan looppiin).
 */
function handleCriticalError() {
    shutdownErrorCounter += 1;
    // Pysäytetään serveri jos :
    if (shutdownErrorCounter >= MAX_UNCAUGHT_ERRORS_BEFORE_SHUTDOWN) {
        logger.error("Server shutdown: too many unhandled errors.");
        process.exit(1);
    }
}

/**
 * Määrittelee globaalit virheenkäsittelijät.
 */
function initializeErrorHandling(app: Express) {
    // Vain testausta varten: 
    // app.get(BASE_URL + '/throw_sync_error', (_req, _res) => {
    //     throw Error('Sync error');
    // });
    // app.get(BASE_URL + '/throw_async_error', async (_req, _res) => {
    //     throw Error('Async error');
    // });

    // Globaali virheenkäsittely:
    app.use((err: any, _req: Request, res: Response, _next: NextFunction): any => {
        logger.error("Global error handler:", err);
        try {
            res.status(500).send('Global error handler: something went wrong.');
        } catch (error) {
            // TODO remove
            logger.error("This should never happen:", error);
        }
    });

    // Tapahtumankuuntelija, joka sieppaa käsittelemättömät poikkeukset.
    // HUOM! Voi pysäyttää serverin.
    process.on('uncaughtException', (reason, _origin) => {
        logger.error("UncaughtException: reason:", reason, "origin:");
        handleCriticalError();
    });

    // Tapahtumankuuntelija, joka sieppaa käsittelemättömät lupaus-hylkäämiset.
    // HUOM! Voi pysäyttää serverin.
    process.on('unhandledRejection', (reason, _promise) => {
        logger.error("UnhandledRejection: reason:", reason);
        handleCriticalError();
    });
};

export { logger, initializeErrorHandling, getShutdownErrorCounter };