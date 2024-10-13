/**
 * Virheenkäsittelyä ja lokitiedoston kirjoitusta serverille.
 */

import { Express, NextFunction, Request, Response } from 'express';
import { logger } from './logger';
import { CustomError, ErrorLevel } from '../shared/customErrors';

/**
 * Maksimimäärä kiinnisaamattomia poikkeuksia ennen serverin pysäyttämistä.
 * HUOM! Muista että tämä on vaarallinen lähestymistapa - serveri voi jäädä
 * käyntiin vaikka sen sisäinen tila on epäkelpo ja toimii epäodotetulla tavalla.
 */
const MAX_UNCAUGHT_ERRORS_BEFORE_SHUTDOWN = 5;
// Vastaava laskuri
let shutdownErrorCounter = 0;

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
        logger.error("Server shutdown: too many unhandled errors");
        shutdown();
    }
}

/**
 * Määrittelee globaalit virheenkäsittelijät.
 */
function initializeErrorHandling(app: Express) {
    // Globaali virheenkäsittely "GEH" (synkronisten reittien käsittelemättömät poikkeukset).
    app.use((err: any, req: Request, res: Response, _next: NextFunction): any => {
        try {
            const identifier = (err instanceof CustomError ? { code: err.code } : { message: err.message });
            const level: ErrorLevel = err?.details?.level || "error";
            const statusCode = err?.details?.status;
            const info = err?.info || {};
            if (level === "error") {
                // Kirjoitetaan enemmän tietoa kun on kyseessä "error"
                logger.error("GEH", {
                    ...identifier,
                    stack: err.stack,
                    ...( statusCode && { statusCode: statusCode } ),
                    agent: req.headers['user-agent'],
                    route: req.originalUrl,
                    method: req.method,
                    ...info,
                    ...(err?.logAdditionalInfo || {})
                });
            } else {
                logger[level]("GEH", {
                    ...identifier,
                    ...( statusCode && { statusCode: statusCode } ),
                    agent: req.headers['user-agent'],
                    route: req.originalUrl,
                    method: req.method,
                    ...info,
                    ...(err?.logAdditionalInfo || {})
                });
            }
            if (err instanceof CustomError) {
                if (!res.headersSent)
                    res.status(err.details.status).json({ error: err.details.clientMessage, code: err.code, ...err.info });
            } else {
                if (!res.headersSent)
                    res.status(500).json({ error: "Jokin meni pieleen." });
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

/**
 * Loppusiivous kun prosessia lopetetaan.
 */
const shutdown = async () => {
    logger.warn("Server shutdown");

    const timeout = setTimeout(() => {
        logger.warn("Cleanup taking too long, forcing exit.");
        process.exit(1);
    }, 1000);

    try {
        // Sulje resurssit tässä (SQLite close esim. jos sitä käytettäisiin)
        // Käytä tässä await Promise.all([cleanup1,cleanup2])..
        clearTimeout(timeout);
        process.exit(0);
    } catch (error) {
        clearTimeout(timeout);
        process.exit(1);
    }
};

// Ajetaan loppusiivous ennen prosessin pysäyttämistä
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export { initializeErrorHandling, getShutdownErrorCounter };