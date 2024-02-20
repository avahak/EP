import fs from 'fs';
import mysql from 'mysql2/promise';

/**
 * Tulkkaa .sql tiedoston sisällön kyselyt sisältäväksi taulukoksi.
 */
function parseSqlFileContent(sqlFileContent: string): string[] {
    // Poistetaan kommentit:
    let str = sqlFileContent.replace(/(\/\*[\s\S]*?\*\/|--[^\r\n]*)/gm, '');
    // Korvataan rivinvaihtomerkit välilyönnillä:
    str = str.replace(/\r?\n/g, ' ');
    // Jaetaan merkkijono hauiksi välimerkin ; perusteella:
    const queries = str.split(';').map(query => query.trim()).filter(Boolean);
    return queries;
}

// Ei testattu
// @ts-ignore
function parseSqlFileContent2(sqlFileContent: string): string[] {
    let str = sqlFileContent.replace(/(\/\*[\s\S]*?\*\/|--[^\r\n]*)/gm, '');

    const delimiterStack: string[] = [';']; // oletusarvoinen DELIMITER
    const parts: string[] = [];

    // Etsitään DELIMITER muutokset:
    const delimiterRegex = /DELIMITER\s+(\S+)/gi;
    let lastIndex = 0;
    let match;
    while ((match = delimiterRegex.exec(str)) !== null) {
        const currentDelimiter = delimiterStack[delimiterStack.length - 1];
        const part = str.substring(lastIndex, match.index).split(currentDelimiter);
        parts.push(...part.map(query => query.trim()).filter(Boolean));
        delimiterStack.push(match[1]);
        lastIndex = delimiterRegex.lastIndex;
    }

    // Jaetaan viimeinen osa:
    const currentDelimiter = delimiterStack[delimiterStack.length - 1];
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
async function recreateDatabase(pool: mysql.Pool, databaseName: string) {
    console.log("recreateDatabase", databaseName);
    try {
        let sqlFile = fs.readFileSync(`src/server/database/${databaseName}.sql`, 'utf-8');
        const queries = parseSqlFileContent(sqlFile);

        const connection = await pool.getConnection();
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

        console.log(queries);
        console.log("recreateDatabase done");
    } catch (error) {
        console.error("recreateDatabase error:", error);
    }
}

export { myQuery, recreateDatabase, parseSqlFileContent };