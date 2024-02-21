import fs from 'fs';
import mysql from 'mysql2/promise';
import { generateAndInsertToDatabase } from './dbFakeData.js';

/**
 * Tulkkaa .sql tiedoston sisällön kyselyt sisältäväksi taulukoksi.
 */
// @ts-ignore
function parseSqlFileContentOld(sqlFileContent: string): string[] {
    // Poistetaan kommentit:
    let str = sqlFileContent.replace(/(\/\*[\s\S]*?\*\/|--[^\r\n]*)/gm, '');
    // Korvataan rivinvaihtomerkit välilyönnillä:
    str = str.replace(/\r?\n/g, ' ');
    // Jaetaan merkkijono hauiksi välimerkin ; perusteella:
    const queries = str.split(';').map(query => query.trim()).filter(Boolean);
    return queries;
}

/**
 * Tämä on yksinkertainen .sql tiedostojen lukija, joka erottelee tekstin 
 * yksittäisiin kyselyihin.
 * HUOM! VAROITUS! Toimii karkeasti ja saattaa tehdä virheitä. Yleisempää käyttöä
 * varten tulee käyttää omistettua kirjastoa, joka tukee monimutkaisempia 
 * SQL-tiedostoja ja toimii varmemmin.
 */
function parseSqlFileContent(sqlFileContent: string): string[] {
    let str = sqlFileContent.replace(/(\/\*[\s\S]*?\*\/|--[^\r\n]*)/gm, '');

    let currentDelimiter = ';';   // oletusarvoinen DELIMITER
    const parts: string[] = [];

    // Etsitään DELIMITER muutokset:
    const delimiterRegex = /DELIMITER\s+(\S+)/gi;
    let lastIndex = 0;
    let match;
    while ((match = delimiterRegex.exec(str)) !== null) {
        const part = str.substring(lastIndex, match.index).split(currentDelimiter);
        parts.push(...part.map(query => query.trim()).filter(Boolean));
        currentDelimiter = match[1];
        lastIndex = delimiterRegex.lastIndex;
    }

    // Jaetaan viimeinen osa:
    const lastPart = str.substring(lastIndex).split(currentDelimiter);
    parts.push(...lastPart.map(query => query.trim()).filter(Boolean));

    return parts;
}

/**
 * Wrapperi tietokantakyselylle
 */
async function myQuery(pool: mysql.Pool, query: string, substitutions: any[]|null=null) {
    console.log("myQuery", query);
    try {
        const connection = await pool.getConnection();
        try {
            const [rows] = (substitutions == null) ? 
                await connection.query(query) : 
                await connection.query(query, substitutions);
            return rows;
        } catch (error) {
            console.error("myQuery error:", error);
            return [];
        } finally {
            connection.destroy();       // TEHOTONTA! Käytetään vain Azure SQL ongelmien takia
            // connection.release();
        }
    } catch (err) {
        console.error("myQuery error:", err);
        return [];
    }
}

/**
 * Poistaa ja luo tietokannan ja sen taulut testaus_ep.sql mukaisesti.
 * NOTE: Käytä varovaisesti, tuhoaa tietoa!
 */
async function recreateDatabase(pool: mysql.Pool, poolNoDatabase: mysql.Pool, databaseName: string, stage: number) {
    console.log(`starting recreateDatabase ${databaseName} stage ${stage}..`);
    try {
        if (stage == 1) {
            let sqlFile = fs.readFileSync(`src/server/database/${databaseName}.sql`, 'utf-8');
            const queries = parseSqlFileContent(sqlFile);

            const connection = await poolNoDatabase.getConnection();
            try {
                await connection.query(`DROP DATABASE IF EXISTS ${databaseName}`);
                for (const query of queries) {
                    console.log("query: ", query);
                    await connection.query(query);
                }
            } catch (error) {
                console.error("recreateDatabase error:", error);
            } finally {
                connection.destroy();       // TEHOTONTA! Käytetään vain Azure SQL ongelmien takia
                // Vapautetaan yhteys takaisin altaaseen:
                // connection.release();
            }
            // console.log(queries);
        } else if (stage == 2) {
            let sqlFile = fs.readFileSync(`src/server/database/${databaseName}_triggers.sql`, 'utf-8');
            const queries = parseSqlFileContent(sqlFile);

            const connection = await pool.getConnection();
            try {
                for (const query of queries) {
                    console.log("query: ", query);
                    await connection.query(query);
                }
            } catch (error) {
                console.error("recreateDatabase error:", error);
            } finally {
                connection.destroy();       // TEHOTONTA! Käytetään vain Azure SQL ongelmien takia
                // Vapautetaan yhteys takaisin altaaseen:
                // connection.release();
            }
        } else if (stage == 3) {
            await generateAndInsertToDatabase(pool);
            // const data = generateFakeData();
            // const filePath = path.join(miscDirectory, `testaus_ep_data.json`);
            // fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
        }
        console.log(`done with: recreateDatabase ${databaseName} stage ${stage}`);
    } catch (error) {
        console.error("recreateDatabase error:", error);
    }
}

export { myQuery, recreateDatabase, parseSqlFileContent };