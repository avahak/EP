/**
 * Reittejä SQL-kyselyille.
 */

import express, { Router } from 'express';
import fs from 'fs';
import { getMatchesToReport, getPlayersInTeam, getScores, submitMatchResult, getMatchInfo, addPlayer, getResultsTeams, getResultsPlayers, getUsers, getMatchesToReportModerator, getGroups, getPlayoffMatches, getPlayoffBracket } from './dbSpecific.js';
import { parseSqlFileContent, recreateDatabase } from './dbGeneral.js';
import { RequestWithAuth, injectAuth } from '../auth/auth.js';
import { pool, poolNoDatabase } from './dbConnections.js';
import { loadSQLFiles, replicateDB } from './dbReplicate.js';
import { logger } from '../logger.js';
import { CustomError } from '../../shared/customErrors.js';

const router: Router = express.Router();

// Tämänhetkinen kausi, käytetään tietokantakyselyissä:
const KULUVA_KAUSI = process.env.KULUVA_KAUSI;

/**
 * SQL-tietokannan testausta, palauttaa tietokannan kaavion ja sen perustamiskomennot.
 */
router.get('/schema', async (_req, res, next) => {
    console.log(new Date(), "databaseRoutes: /schema requested");
    try {
        const sqlFile1 = fs.readFileSync(`src/server/database/sql_tables.sql`, 'utf-8');
        const sqlFile2 = fs.readFileSync(`src/server/database/sql_tulokset_1.sql`, 'utf-8');
        const sqlFile3 = fs.readFileSync(`src/server/database/sql_tulokset_2.sql`, 'utf-8');
        const sqlFile4 = fs.readFileSync(`src/server/database/sql_procedures.sql`, 'utf-8');
        const commands1 = parseSqlFileContent(sqlFile1);
        const commands2 = parseSqlFileContent(sqlFile2);
        const commands3 = parseSqlFileContent(sqlFile3);
        const commands4 = parseSqlFileContent(sqlFile4);

        // Poistetaan \r merkit ja muutetaan rivinvaihdot <br>:
        const sanitizedSchema1 = sqlFile1.replace(/\r/g, '').replace(/\n/g, '<br>');
        const sanitizedSchema2 = sqlFile2.replace(/\r/g, '').replace(/\n/g, '<br>');
        const sanitizedSchema3 = sqlFile3.replace(/\r/g, '').replace(/\n/g, '<br>');
        const sanitizedSchema4 = sqlFile4.replace(/\r/g, '').replace(/\n/g, '<br>');
        
        res.json({ 
            DB_NAME: process.env.DB_NAME,
            commands1: commands1,
            commands2: commands2,
            commands3: commands3,
            commands4: commands4,
            schema1: sanitizedSchema1,
            schema2: sanitizedSchema2,
            schema3: sanitizedSchema3,
            schema4: sanitizedSchema4,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Poistaa DB_NAME ympäristömuuttujassa määritellyn tietokannan ja luo 
 * sen uudelleen kaavion perusteella (stage=1). Lisää triggerit ja proseduurit (stage=2).
 * Sitten generoi ja lisää testidataa sen tauluihin (stage=3).
 * HUOM! Vain testausta varten, poistaa kaiken olemassaolevan tiedon tietokannasta.
 */
router.get('/recreate/:stage', async (req, res) => {
    if (process.env.ENVIRONMENT != 'LOCALHOST')
        return res.status(403).send("Database creation forbidden in this environment.");
    if (!process.env.DB_NAME)
        return res.status(400).send("Missing environment variable DB_NAME.");
    const stage = parseInt(req.params.stage);
    if (isNaN(stage) || stage < 1 || stage > 3)
        return res.status(400).send("Invalid stage.");
    try {
        await recreateDatabase(pool, poolNoDatabase, process.env.DB_NAME, stage);
        // const filePath = path.join(miscDirectory, `db_data.json`);
        // fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
        console.log(`databaseRoutes: /recreate/${stage} done`);
        res.send("success!");
    } catch (error) {
        logger.error(`databaseRoutes: Error in /recreate/${stage}:`, error);
        res.status(500).send('Internal Server Error.');
    }
});

router.get('/replicate', async (_req, res) => {
    if (process.env.ENVIRONMENT != 'LOCALHOST')
        return res.status(403).send("Database creation forbidden in this environment.");
    if (!process.env.DB_NAME)
        return res.status(400).send("Missing environment variable DB_NAME.");
    if (process.env.ENVIRONMENT != 'LOCALHOST')
        return res.status(403).send("Database creation forbidden in this environment.");
    if (!process.env.DB_NAME)
        return res.status(400).send("Missing environment variable DB_NAME.");

    const sqlFiles = loadSQLFiles('C:/Users/mavak/Desktop/ep_sql_backup_13_09_2024');
    replicateDB(sqlFiles, pool);
    

    // try {
    //     await recreateDatabase(pool, poolNoDatabase, process.env.DB_NAME, stage);
    //     console.log(`databaseRoutes: /recreate/${stage} done`);
    //     res.send("success!");
    // } catch (error) {
    //     logger.error(`databaseRoutes: Error in /recreate/${stage}:`, error);
    //     res.status(500).send('Internal Server Error.');
    // }
    res.send('Ok');
});

/**
 * Yhdistää /specific_query API-kutsussa annetun parametrin dbSpecific.ts 
 * tiedostossa olevaan funktioon, joka muodostaa SQL-kyselyn ja suorittaa sen. 
 */
const queryFunctions: Record<string, any> = {
    "get_players_in_team": getPlayersInTeam,
    "get_match_info": getMatchInfo,
    "get_matches_to_report": getMatchesToReport,
    "get_matches_to_report_moderator": getMatchesToReportModerator,
    "get_results_teams": getResultsTeams,
    "get_results_players": getResultsPlayers,
    "get_scores": getScores,
    "submit_match_result": submitMatchResult,
    "add_player": addPlayer,
    "get_users": getUsers,
    "get_groups": getGroups,
    "get_playoff_matches": getPlayoffMatches,
    "get_playoff_bracket": getPlayoffBracket,
};

/**
 * Tätä reittiä käytetään tarjoamaan tietokannan spesifien kyselyiden 
 * (src/server/database/dbSpecific.ts) funktioita. Oikeuksia
 * funktioihin tarkistetaan funktiossa itsessään jos tarpeen, tässä vain 
 * liitetään pyyntöön mukaan käyttäjän tiedot (injectAuth).
 * 
 * NOTE Tämä voisi olla parempi jakaa erillisiksi reiteiksi. Kaikkien
 * tietokantafunktioiden laittaminen tämän reitin alle ei taida tuottaa etua.
 */
router.post('/specific_query', injectAuth, async (req: RequestWithAuth, res, next) => {
    try {
        // console.log("auth", req.auth);
        const queryName = req.body.queryName;
        const params = req.body.params || {};
        params._current_kausi = KULUVA_KAUSI;

        logger.info("/specific_query", { queryName, ip: req.ip });

        const queryFunction = queryFunctions[queryName];
        if (!queryName || !queryFunction) {
            const extra = { field: "queryName", queryName, queryFunction: queryFunction?.name };
            throw new CustomError("INVALID_INPUT", extra);
        }

        const rows = await queryFunction(params, req.auth);
        if (!res.headersSent && !res.writableEnded)
            res.json({ rows });
        // console.log(`databaseRoutes: /specific_query (queryName=${queryName}) done`);
    } catch (error) {
        next(error);
    }
});

export default router;