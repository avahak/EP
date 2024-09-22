/**
 * Virheenkäsittelyä ja lokitiedoston kirjoitusta serverille.
 */

import fs from 'fs';
import { Express, NextFunction, Request, Response } from 'express';
import winston from 'winston';
import { CustomError, ErrorLevel } from '../shared/commonTypes';

const MB = 1024*1024;

/**
 * Maksimimäärä kiinnisaamattomia poikkeuksia ennen serverin pysäyttämistä.
 * HUOM! Muista että tämä on vaarallinen lähestymistapa - serveri voi jäädä
 * käyntiin vaikka sen sisäinen tila on epäkelpo ja toimii epäodotetulla tavalla.
 */
const MAX_UNCAUGHT_ERRORS_BEFORE_SHUTDOWN = 5;
// Vastaava laskuri
let shutdownErrorCounter = 0;

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
        // Järjestetään kenttiä:
        const { timestamp, level, message, ...restInfo } = info;
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
    // Pysäytetään serveri jos liian monta vakavaa virhettä:
    if (shutdownErrorCounter >= MAX_UNCAUGHT_ERRORS_BEFORE_SHUTDOWN) {
        logger.error("Server shutdown: too many unhandled errors.");
        process.exit(1);
    }
}

/**
 * Määrittelee globaalit virheenkäsittelijät.
 */
function initializeErrorHandling(app: Express) {
    // Globaali virheenkäsittely "GEH" (synkronisten reittien käsittelemättömät poikkeukset).
    app.use((err: any, req: Request, res: Response, _next: NextFunction): any => {
        try {
            const level: ErrorLevel = err.level || "error";
            if (level === "error") {
                // Kirjoitetaan enemmän tietoa kun on kyseessä "error"
                logger.error("GEH", {
                    message: err.message,
                    stack: err.stack,
                    statusCode: err.statusCode,
                    ip: req.ip,
                    route: req.originalUrl,
                    method: req.method,
                    ...(err.debugInfo && { debugInfo: err.debugInfo })
                });
            } else {
                logger[level]("GEH", {
                    message: err.message,
                    statusCode: err.statusCode,
                    ip: req.ip,
                    route: req.originalUrl,
                    method: req.method,
                    ...(err.debugInfo && { debugInfo: err.debugInfo })
                });
            }
            if (err instanceof CustomError) {
                if (!res.headersSent)
                    res.status(err.statusCode).send({ error: err.clientMessage });
            } else {
                if (!res.headersSent)
                    res.status(500).send({ error: "Jokin meni pieleen." });
            }
        } catch (error) {
            logger.error("Unexpected error in global error handler", error);
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