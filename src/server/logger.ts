/**
 * Lokitiedostojen kirjoitusta serverille.
 */

import fs from 'fs';
import winston from 'winston';

const MB = 1024*1024;

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

export { logger };