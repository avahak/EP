/**
 * Reittejä SQL-kyselyille.
 */

import express, { Router } from 'express';
import fs from 'fs';
import mysql from 'mysql2/promise';
import { getMatchesToReport, getPlayersInTeam, getResultsTeams, getResultsPlayers, getScores, submitMatchResult, getMatchInfo, AddPlayer } from './database/dbSpecific.js';
import { parseSqlFileContent, recreateDatabase } from './database/dbGeneral.js';

const router: Router = express.Router();

// Tämänhetkinen kausi, käytetään tietokantakyselyissä:
const KULUVA_KAUSI = 3;

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dateStrings: ['DATE'],          // use a string to represent dates instead of javascript Date
    // idleTimeout: 20000,
    // connectTimeout: 5000,
});

const poolNoDatabase = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dateStrings: ['DATE'],          // use a string to represent dates instead of javascript Date
    // idleTimeout: 20000,
    // connectTimeout: 5000
});

// interface User extends RowDataPacket {
//     id: number;
//     email: string;
// }

/**
 * SQL-tietokannan testausta
*/
router.get('/schema', async (_req, res) => {
    console.log(new Date(), "databaseRoutes: /schema requested");
    try {
        const databaseName = process.env.DB_NAME;
        if (!databaseName)
            throw Error("Missing database info.");
        const sqlFile1 = fs.readFileSync(`src/server/database/${databaseName}_tables.sql`, 'utf-8');
        const sqlFile2 = fs.readFileSync(`src/server/database/${databaseName}_triggers.sql`, 'utf-8');
        const commands1 = parseSqlFileContent(sqlFile1);
        const commands2 = parseSqlFileContent(sqlFile2);

        // Poistetaan \r merkit ja muutetaan rivinvaihdot <br>:
        const sanitizedSchema1 = sqlFile1.replace(/\r/g, '').replace(/\n/g, '<br>');
        const sanitizedSchema2 = sqlFile2.replace(/\r/g, '').replace(/\n/g, '<br>');
        
        res.json({ 
            DB_NAME: process.env.DB_NAME,
            // dbList: dbList,
            commands1: commands1,
            commands2: commands2,
            // matches: matches,
            schema1: sanitizedSchema1,
            schema2: sanitizedSchema2
        });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * Poistaa testaus_ep tietokannan ja luo sen uudelleen kaavion perusteella.
 * Sitten generoi ja lisää testidataa sen tauluihin.
 * HUOM: Poistaa kaiken olemassaolevan tiedon tietokannasta.
 */
router.get('/recreate/:stage', async (req, res) => {
    if (process.env.ENVIRONMENT != 'LOCALHOST')
        return res.status(403).send("Database creation forbidden in this environment.");
    const stage = parseInt(req.params.stage);
    if (isNaN(stage) || stage < 1 || stage > 3)
        return res.status(400).send("Invalid stage.");
    try {
        await recreateDatabase(pool, poolNoDatabase, process.env.DB_NAME || "testaus_ep", stage);
        // const filePath = path.join(miscDirectory, `testaus_ep_data.json`);
        // fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
        console.log(`databaseRoutes: /recreate/${stage} done`);
        res.send("success!");
    } catch (error) {
        console.error(`databaseRoutes: Error in /recreate/${stage}:`, error);
        res.status(500).send('Internal Server Error.');
    }
});

/**
 * Yhdistää API-kutsussa annetun parametrin dbSpecific.ts tiedostossa olevaan
 * funktioon, joka muodostaa SQL-kyselyn ja suorittaa sen. 
 */
const queryFunctions: Record<string, any> = {
    "get_players_in_team": getPlayersInTeam,
    "get_match_info": getMatchInfo,
    "get_matches_to_report": getMatchesToReport,
    "get_results_teams": getResultsTeams,
    "get_results_players": getResultsPlayers,
    "get_scores": getScores,
    "submit_match_result": submitMatchResult,
    "add_player": AddPlayer,
};

/**
 * Tätä reittiä käytetään tarjoamaan tietokannan spesifien kyselyiden 
 * (src/server/db/dbSpecific.ts) tuloksia.
 */
router.post('/specific_query', async (req, res) => {
    const queryName = req.body.queryName;
    const params = req.body.params || {};
    params._current_kausi = KULUVA_KAUSI;

    const queryFunction = queryFunctions[queryName];
    if (!queryName || !queryFunction)
        return res.status(400).send("Invalid or missing queryName.");
    try {
        const rows = await queryFunction(pool, params);
        res.json({ rows });
        console.log(`databaseRoutes: /specific_query (queryName=${queryName}) done`);
    } catch (error) {
        console.error('databaseRoutes: Error in /specific_query:', error);
        res.status(500).send(`Error: ${error}`);
    }
});

export default router;