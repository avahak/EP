import fs from 'fs';
import mysql from 'mysql2/promise';

/**
 * Tulkkaa .sql tiedoston sisällön kyselyt sisältäväksi taulukoksi.
 */
function parseSqlFileContent(sqlFileContent: string): string[] {
    let str = sqlFileContent.replace(/(\/\*[\s\S]*?\*\/|--[^\r\n]*)/gm, '');
    // Korvataan rivinvaihtomerkit välilyönnillä:
    str = str.replace(/\r?\n/g, ' ');
    // Jaetaan merkkijono hauiksi välimerkin ; perusteella:
    const queries = str.split(';').map(query => query.trim()).filter(Boolean);
    return queries;
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
                await pool.query(query) : 
                await pool.query(query, substitutions);
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
        let sqlFile = fs.readFileSync('src/server/database/testaus_ep.sql', 'utf-8');
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