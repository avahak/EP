/**
 * Kokoelma tietokantaan kohdistuvia kyselyitä, joita React app tarvitsee.
 * Näitä kutsuu src/server/database/dbRoutes.ts funktio specificQuery.
 */

import { myQuery } from './dbGeneral.js';
import { dateToYYYYMMDD, deepCopy, removeSpecialChars } from '../../shared/generalUtils.js';
import { isValidParsedMatch } from '../../shared/parseMatch.js';
import { AuthError, AuthTokenPayload, roleIsAtLeast } from '../../shared/commonTypes.js';
import { pool } from './dbConnections.js';
import { logger } from '../serverErrorHandler.js';
import { RowDataPacket } from 'mysql2';

/**
 * Palauttaa ottelun pelaajat ja erien tulokset.
 * @param params - Sisältää ep_ottelu.id tiedon kentässä matchId.
 */
async function getScores(params: Record<string, any>, _auth: AuthTokenPayload | null) {
    // Valitaan pelaajat ja erätulokset annetulle ottelulle:
    const query = `
        SELECT p.kp, p.vp, e.era1, e.era2, e.era3, e.era4, e.era5
        FROM ep_peli p
        JOIN ep_erat e ON e.peli=p.id
        WHERE p.ottelu=?
        ORDER BY p.id ASC
    `;
    return myQuery(pool, query, [params.matchId]);
}

/**
 * Palauttaa joukkueen kaikki pelaajat.
 * @param params - Sisältää ep_joukkue.id tiedon kentässä teamId.
 */
async function getPlayersInTeam(params: Record<string, any>, _auth: AuthTokenPayload | null) {
    // Valitaan kaikki pelaajat, joiden joukkueen id on teamId:
    const query = `
        SELECT p.id AS id, p.nimi AS name
        FROM ep_pelaaja p
        WHERE p.joukkue = ?
    `;
    return myQuery(pool, query, [params.teamId]);
}

/**
 * Hakee taulun ep_ottelu perustiedot sen id:n perusteella.
 * @param params - Sisältää ep_ottelu.id tiedon kentässä matchId.
 */
async function getMatchInfo(params: Record<string, any>, _auth: AuthTokenPayload | null) {
    const query = `
        SELECT o.id, o.paiva AS date, j1.id AS homeId, j2.id AS awayId, j1.lyhenne AS home, j2.lyhenne AS away, o.status AS status
        FROM ep_ottelu o
        JOIN ep_joukkue j1 ON o.koti = j1.id
        JOIN ep_joukkue j2 ON o.vieras = j2.id
        WHERE o.id = ?
    `;
    return myQuery(pool, query, [params.matchId]);
}

/**
 * Palauttaa menneet käyttäjän ilmoittamattomat (T) tai 
 * kotijoukkueen ilmoittamat (K) ottelut.
 */
async function getMatchesToReport(params: Record<string, any>, auth: AuthTokenPayload | null) {
    if (!auth)
        throw new AuthError();
    // Valitaan ottelut, missä päivä on ennen nykyhetkeä ja status on 'T' tai 'K'
    // ja toinen joukkueista on käyttäjän joukkue:
    const dateNow = dateToYYYYMMDD(new Date());
    const query = `
        SELECT o.id, o.paiva AS date, j1.id AS homeId, j2.id AS awayId, j1.lyhenne AS home, j2.lyhenne AS away, o.status AS status
        FROM ep_ottelu o
        JOIN ep_joukkue j1 ON o.koti = j1.id
        JOIN ep_joukkue j2 ON o.vieras = j2.id
        WHERE (o.status = 'T' OR o.status = 'K') AND (j1.kausi = ?) AND (o.paiva <= ?) 
            AND ((j1.lyhenne = ?) OR (j2.lyhenne = ?))
        ORDER BY o.paiva
    `;
    return myQuery(pool, query, [params._current_kausi, dateNow, auth.team, auth.team]);
}

/**
 * Palauttaa kaikki hyväksymättömät (status != 'H') menneet ottelut moderaattorin
 * käsiteltäväksi.
 */
async function getMatchesToReportModerator(params: Record<string, any>, auth: AuthTokenPayload | null) {
    if (!auth || !roleIsAtLeast(auth.role, "mod"))
        throw new AuthError();
    // Valitaan ottelut, missä päivä on ennen nykyhetkeä ja status ei ole 'H':
    const dateNow = dateToYYYYMMDD(new Date());
    const query = `
        SELECT o.id, o.paiva AS date, j1.id AS homeId, j2.id AS awayId, j1.lyhenne AS home, j2.lyhenne AS away, o.status AS status
        FROM ep_ottelu o
        JOIN ep_joukkue j1 ON o.koti = j1.id
        JOIN ep_joukkue j2 ON o.vieras = j2.id
        WHERE ((o.status != 'H') AND (j1.kausi = ?) AND (o.paiva <= ?))
        ORDER BY o.paiva
    `;
    return myQuery(pool, query, [params._current_kausi, dateNow]);
}

/**
 * Palauttaa taulukon kaikista otteluista, yleistä testausta varten.
 * Ei käytössä.
 */
// async function getAllMatches(_params: Record<string, any>, _auth: AuthTokenPayload | null) {
//     const query = `
//         SELECT o.paiva AS date, j1.lyhenne AS home, j2.lyhenne AS away, o.status AS status
//         FROM ep_ottelu o
//         JOIN ep_joukkue j1 ON o.koti = j1.id
//         JOIN ep_joukkue j2 ON o.vieras = j2.id
//         ORDER BY o.paiva
//     `;
//     return myQuery(pool, query);
// }

/**
 * Tuloskysely joukkueiden tilanteesta, käyttää ep_sarjat taulua.
 * @param params - Sisältää kentän _current_kausi.
 */
async function getResultsTeamsOld(params: Record<string, any>, _auth: AuthTokenPayload | null) {
    const query = `
        SELECT ep_sarjat.nimi, ep_sarjat.lyhenne, 
            ep_sarjat.voitto, ep_sarjat.tappio, ep_sarjat.v_era, 
            ep_sarjat.h_era, ep_sarjat.v_peli, ep_sarjat.h_peli
        FROM ep_sarjat
        JOIN ep_lohko ON ep_lohko.id = ep_sarjat.lohko
        WHERE ep_lohko.kausi = ?
    `;
    return myQuery(pool, query, [params._current_kausi]);
}

/**
 * Tuloskysely joukkueiden tilanteesta, käyttää ep_joukkue_tulokset taulua.
 * @param params - Sisältää kentän _current_kausi.
 */
async function getResultsTeams(params: Record<string, any>, _auth: AuthTokenPayload | null) {
    const query = `
        SELECT ep_joukkue.nimi, ep_joukkue.lyhenne, 
            ep_joukkue_tulokset.voitto, ep_joukkue_tulokset.tappio, 
            ep_joukkue_tulokset.v_era, ep_joukkue_tulokset.h_era, 
            ep_joukkue_tulokset.v_peli, ep_joukkue_tulokset.h_peli
        FROM ep_joukkue_tulokset
        JOIN ep_joukkue ON ep_joukkue.id = ep_joukkue_tulokset.joukkue
        WHERE ep_joukkue.kausi = ?
    `;
    return myQuery(pool, query, [params._current_kausi]);
}

/**
 * Tuloskysely pelaajien tilanteesta, käyttää suoraan tauluissa kirjattuja tuloksia,
 * eli ei käytä x_tulokset tauluja.
 * @param params Sisältää kentän _current_kausi.
 */
async function getResultsPlayersOld(params: Record<string, any>, _auth: AuthTokenPayload | null) {
    const queryGeneral = `
        SELECT 
            ep_pelaaja.id,
            ep_pelaaja.nimi,
            lyhenne,
            pelit,
            v_era,
            h_era,
            v_peli,
            h_peli
        FROM
            ep_pelaaja
            JOIN ep_joukkue ON ep_joukkue.id = ep_pelaaja.joukkue
        WHERE 
            ep_joukkue.kausi = ?
    `;
    const queryHome = `
        SELECT
            p.kp AS id,
            CAST(SUM((e.era1 = 'K1') + (e.era2 = 'K1') + (e.era3 = 'K1') + (e.era4 = 'K1') + (e.era5 = 'K1')) AS SIGNED) AS K1,
            CAST(SUM((e.era1 = 'K2') + (e.era2 = 'K2') + (e.era3 = 'K2') + (e.era4 = 'K2') + (e.era5 = 'K2')) AS SIGNED) AS K2,
            CAST(SUM((e.era1 = 'K3') + (e.era2 = 'K3') + (e.era3 = 'K3') + (e.era4 = 'K3') + (e.era5 = 'K3')) AS SIGNED) AS K3,
            CAST(SUM((e.era1 = 'K4') + (e.era2 = 'K4') + (e.era3 = 'K4') + (e.era4 = 'K4') + (e.era5 = 'K4')) AS SIGNED) AS K4,
            CAST(SUM((e.era1 = 'K5') + (e.era2 = 'K5') + (e.era3 = 'K5') + (e.era4 = 'K5') + (e.era5 = 'K5')) AS SIGNED) AS K5,
            CAST(SUM((e.era1 = 'K6') + (e.era2 = 'K6') + (e.era3 = 'K6') + (e.era4 = 'K6') + (e.era5 = 'K6')) AS SIGNED) AS K6,
            CAST(SUM(COALESCE(p.ktulos, 0)) AS SIGNED) AS v_era_koti,
            CAST(SUM(COALESCE(p.vtulos, 0)) AS SIGNED) AS h_era_koti,
            CAST(SUM(IF(COALESCE(p.ktulos, 0) > COALESCE(p.vtulos, 0), 1, 0)) AS SIGNED) AS v_peli_koti,
            CAST(SUM(IF(COALESCE(p.vtulos, 0) > COALESCE(p.ktulos, 0), 1, 0)) AS SIGNED) AS h_peli_koti
        FROM
            ep_erat AS e
            JOIN ep_peli AS p ON p.id = e.peli
            JOIN ep_ottelu ON ep_ottelu.id = p.ottelu
            JOIN ep_lohko ON ep_lohko.id = ep_ottelu.lohko
        WHERE
            ep_lohko.kausi = ? AND ep_ottelu.status = 'H'
        GROUP BY
            p.kp
    `;
    const queryAway = `
        SELECT
            p.vp AS id,
            CAST(SUM((e.era1 = 'V1') + (e.era2 = 'V1') + (e.era3 = 'V1') + (e.era4 = 'V1') + (e.era5 = 'V1')) AS SIGNED) AS V1,
            CAST(SUM((e.era1 = 'V2') + (e.era2 = 'V2') + (e.era3 = 'V2') + (e.era4 = 'V2') + (e.era5 = 'V2')) AS SIGNED) AS V2,
            CAST(SUM((e.era1 = 'V3') + (e.era2 = 'V3') + (e.era3 = 'V3') + (e.era4 = 'V3') + (e.era5 = 'V3')) AS SIGNED) AS V3,
            CAST(SUM((e.era1 = 'V4') + (e.era2 = 'V4') + (e.era3 = 'V4') + (e.era4 = 'V4') + (e.era5 = 'V4')) AS SIGNED) AS V4,
            CAST(SUM((e.era1 = 'V5') + (e.era2 = 'V5') + (e.era3 = 'V5') + (e.era4 = 'V5') + (e.era5 = 'V5')) AS SIGNED) AS V5,
            CAST(SUM((e.era1 = 'V6') + (e.era2 = 'V6') + (e.era3 = 'V6') + (e.era4 = 'V6') + (e.era5 = 'V6')) AS SIGNED) AS V6,
            CAST(SUM(COALESCE(p.vtulos, 0)) AS SIGNED) AS v_era_vieras,
            CAST(SUM(COALESCE(p.ktulos, 0)) AS SIGNED) AS h_era_vieras,
            CAST(SUM(IF(COALESCE(p.vtulos, 0) > COALESCE(p.ktulos, 0), 1, 0)) AS SIGNED) AS v_peli_vieras,
            CAST(SUM(IF(COALESCE(p.ktulos, 0) > COALESCE(p.vtulos, 0), 1, 0)) AS SIGNED) AS h_peli_vieras
        FROM
            ep_erat AS e
            JOIN ep_peli AS p ON p.id = e.peli
            JOIN ep_ottelu ON ep_ottelu.id = p.ottelu
            JOIN ep_lohko ON ep_lohko.id = ep_ottelu.lohko
        WHERE
            ep_lohko.kausi = ? AND ep_ottelu.status = 'H'
        GROUP BY
            p.vp
    `;
    const resultGeneral = await myQuery(pool, queryGeneral, [params._current_kausi]);
    const resultHome = await myQuery(pool, queryHome, [params._current_kausi]);
    const resultAway = await myQuery(pool, queryAway, [params._current_kausi]);
    return [resultGeneral, resultHome, resultAway];
}

/**
 * Tuloskysely pelaajien tilanteesta, käyttäen _tulokset tauluja.
 * @param params Sisältää kentän _current_kausi.
 */
async function getResultsPlayers(params: Record<string, any>, _auth: AuthTokenPayload | null) {
    const queryGeneral = `
        SELECT 
            ep_pelaaja.id,
            ep_pelaaja.nimi,
            ep_joukkue.lyhenne,
            ep_pelaaja_tulokset.v_peli + ep_pelaaja_tulokset.h_peli AS pelit,
            ep_pelaaja_tulokset.v_era,
            ep_pelaaja_tulokset.h_era,
            ep_pelaaja_tulokset.v_peli,
            ep_pelaaja_tulokset.h_peli
        FROM
            ep_pelaaja
            JOIN ep_pelaaja_tulokset ON ep_pelaaja_tulokset.pelaaja = ep_pelaaja.id
            JOIN ep_joukkue ON ep_joukkue.id = ep_pelaaja.joukkue
        WHERE 
            ep_joukkue.kausi = ?
    `;
    const queryHome = `
        SELECT
            p.kp AS id,
            CAST(SUM((e.era1 = 'K1') + (e.era2 = 'K1') + (e.era3 = 'K1') + (e.era4 = 'K1') + (e.era5 = 'K1')) AS SIGNED) AS K1,
            CAST(SUM((e.era1 = 'K2') + (e.era2 = 'K2') + (e.era3 = 'K2') + (e.era4 = 'K2') + (e.era5 = 'K2')) AS SIGNED) AS K2,
            CAST(SUM((e.era1 = 'K3') + (e.era2 = 'K3') + (e.era3 = 'K3') + (e.era4 = 'K3') + (e.era5 = 'K3')) AS SIGNED) AS K3,
            CAST(SUM((e.era1 = 'K4') + (e.era2 = 'K4') + (e.era3 = 'K4') + (e.era4 = 'K4') + (e.era5 = 'K4')) AS SIGNED) AS K4,
            CAST(SUM((e.era1 = 'K5') + (e.era2 = 'K5') + (e.era3 = 'K5') + (e.era4 = 'K5') + (e.era5 = 'K5')) AS SIGNED) AS K5,
            CAST(SUM((e.era1 = 'K6') + (e.era2 = 'K6') + (e.era3 = 'K6') + (e.era4 = 'K6') + (e.era5 = 'K6')) AS SIGNED) AS K6,
            CAST(SUM(pt.ktulos) AS SIGNED) AS v_era_koti,
            CAST(SUM(pt.vtulos) AS SIGNED) AS h_era_koti,
            CAST(SUM(IF(pt.ktulos > pt.vtulos, 1, 0)) AS SIGNED) AS v_peli_koti,
            CAST(SUM(IF(pt.vtulos > pt.ktulos, 1, 0)) AS SIGNED) AS h_peli_koti
        FROM
            ep_erat AS e
            JOIN ep_peli AS p ON p.id = e.peli
            JOIN ep_peli_tulokset AS pt ON pt.peli = p.id
            JOIN ep_ottelu ON ep_ottelu.id = p.ottelu
            JOIN ep_lohko ON ep_lohko.id = ep_ottelu.lohko
        WHERE
            ep_lohko.kausi = ? AND ep_ottelu.status = 'H'
        GROUP BY
            p.kp
    `;
    const queryAway = `
        SELECT
            p.vp AS id,
            CAST(SUM((e.era1 = 'V1') + (e.era2 = 'V1') + (e.era3 = 'V1') + (e.era4 = 'V1') + (e.era5 = 'V1')) AS SIGNED) AS V1,
            CAST(SUM((e.era1 = 'V2') + (e.era2 = 'V2') + (e.era3 = 'V2') + (e.era4 = 'V2') + (e.era5 = 'V2')) AS SIGNED) AS V2,
            CAST(SUM((e.era1 = 'V3') + (e.era2 = 'V3') + (e.era3 = 'V3') + (e.era4 = 'V3') + (e.era5 = 'V3')) AS SIGNED) AS V3,
            CAST(SUM((e.era1 = 'V4') + (e.era2 = 'V4') + (e.era3 = 'V4') + (e.era4 = 'V4') + (e.era5 = 'V4')) AS SIGNED) AS V4,
            CAST(SUM((e.era1 = 'V5') + (e.era2 = 'V5') + (e.era3 = 'V5') + (e.era4 = 'V5') + (e.era5 = 'V5')) AS SIGNED) AS V5,
            CAST(SUM((e.era1 = 'V6') + (e.era2 = 'V6') + (e.era3 = 'V6') + (e.era4 = 'V6') + (e.era5 = 'V6')) AS SIGNED) AS V6,
            CAST(SUM(pt.vtulos) AS SIGNED) AS v_era_vieras,
            CAST(SUM(pt.ktulos) AS SIGNED) AS h_era_vieras,
            CAST(SUM(IF(pt.vtulos > pt.ktulos, 1, 0)) AS SIGNED) AS v_peli_vieras,
            CAST(SUM(IF(pt.ktulos > pt.vtulos, 1, 0)) AS SIGNED) AS h_peli_vieras
        FROM
            ep_erat AS e
            JOIN ep_peli AS p ON p.id = e.peli
            JOIN ep_peli_tulokset AS pt ON pt.peli = p.id
            JOIN ep_ottelu ON ep_ottelu.id = p.ottelu
            JOIN ep_lohko ON ep_lohko.id = ep_ottelu.lohko
        WHERE
            ep_lohko.kausi = ? AND ep_ottelu.status = 'H'
        GROUP BY
            p.vp
    `;
    const resultGeneral = await myQuery(pool, queryGeneral, [params._current_kausi]);
    const resultHome = await myQuery(pool, queryHome, [params._current_kausi]);
    const resultAway = await myQuery(pool, queryAway, [params._current_kausi]);
    return [resultGeneral, resultHome, resultAway];
}

/**
 * Ottelun tulosten kirjaaminen.
 * @param params - Sisältää kentän result.
 */
async function submitMatchResult(params: Record<string, any>, auth: AuthTokenPayload | null) {
    if (!auth)
        throw new AuthError();

    const match = params.result;
    if (!match.ok || !isValidParsedMatch(match) || match.status === 'H')
        throw Error("Invalid match.");

    // Tarkistetaan, että ottelun tiedot ovat samat kuin tietokannassa:
    const dbRows = await getMatchInfo({ matchId: match.id }, null);
    if (!Array.isArray(dbRows) || dbRows.length !== 1)
        throw Error("Invalid match.");
    const dbMatch = dbRows[0] as RowDataPacket;
    if (dbMatch.home !== match.homeTeamName || dbMatch.away !== match.awayTeamName || dbMatch.status !== match.status)
        throw Error("Invalid match.");

    // Tavalliset käyttäjät voivat ilmoittaa ainoastaan otteluita, 
    // missä toinen joukkueista on heidän:
    if (!roleIsAtLeast(auth.role, "mod")) {
        if (match.status === 'T')
            if (auth.team !== match.homeTeamName)
                throw new AuthError();
        if (match.status === 'K')
            if (auth.team !== match.awayTeamName)
                throw new AuthError();
    }

    const rounds = deepCopy(match.rounds);
    
    console.log("match", JSON.stringify(match));

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();  // MyISAM ei tue transaktioita
        try {
            // Haetaan seuraavat vapaat id:t ep_peli, ep_erat tauluissa.
            // HUOM! Tämä on ongelmallinen lähestymistapa: 
            // kaksi yhtäaikaista lisäystä voivat sekoittaa tauluja.
            // const queryId1 = `SELECT MAX(id)+1 AS nextId FROM ep_peli`;
            // const [idRow1] = await connection.query(queryId1) as any;
            // const queryId2 = `SELECT MAX(id)+1 AS nextId FROM ep_erat`;
            // const [idRow2] = await connection.query(queryId2) as any;
            // const nextId_peli = idRow1[0].nextId;
            // const nextId_erat = idRow2[0].nextId;
            // if (typeof nextId_peli !== "number" || typeof nextId_peli !== "number" || nextId_peli <= 0 || nextId_erat <= 0)
            //     throw Error(`Error executing ${queryId1}`);

            // Poistetaan kaikki otteluun liittyvät rivit taulusta ep_erat:
            const query1 = `
                DELETE e 
                FROM ep_erat e
                JOIN ep_peli p ON e.peli = p.id
                WHERE p.ottelu = ?
            `;
            await connection.query(query1, [match.id]);

            // Poistetaan kaikki otteluun liittyvät rivit taulusta ep_peli:
            const query2 = `
                DELETE FROM ep_peli 
                WHERE ottelu = ?
            `;
            await connection.query(query2, [match.id]);

            // Lisätään uudet rivit tauluun ep_peli, ep_peli:
            for (let k = 0; k < 9; k++) {
                // Ei talleteta kahden tyhjän pelaajan peliä:
                if (match.games[k][1] === -1 && match.games[k][2] === -1)
                    continue;

                const query3 = `INSERT INTO ep_peli (ottelu, kp, vp) VALUES (?, ?, ?)`;
                // HUOM! Seuraava on AUTO_INCREMENT käyttäen:
                // Liitetään rounds taulukkoon lisätyn rivin id:
                let [insertedRow] = await connection.query(query3, match.games[k]);
                if ('insertId' in insertedRow)
                    rounds[k][0] = insertedRow.insertId;
                else 
                    throw Error("Error during ep_peli INSERT.");
                // HUOM! Seuraava on ilman AUTO_INCREMENT:
                // await connection.query(query3, [nextId_peli+k, ...match.games[k]]);
                // rounds[k][0] = nextId_peli+k;

                // Lisätään uusi rivi tauluun ep_erat:
                const query4_1 = `INSERT INTO ep_erat (peli, era1, era2, era3, era4, era5) VALUES (?, ?, ?, ?, ?, ?)`;
                await connection.query(query4_1, rounds[k]);
                
                // Jos uusi status on 'H', niin päivitetään varsinaisten taulujen
                // tulosmuuttujat:
                if (match.newStatus == 'H') {
                    const query4_2 = `CALL procedure_update_all_old_from_erat(?)`;
                    await connection.query(query4_2, [insertedRow.insertId]);
                    // await connection.query(query4_2, [nextId_peli+k]);
                }
            }

            // Muutetaan ottelun päivämäärä ja status:
            const query5 = `UPDATE ep_ottelu SET paiva = ?, status = ? WHERE id = ?`;
            await connection.query(query5, [match.date, match.newStatus, match.id]);

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.destroy();       // TEHOTONTA! Käytetään vain Azure SQL ongelmien takia
            // connection.release();
        }
    } catch (error) {
        logger.error("Error during submitMatchResult:", error);
        throw error;
    }
}

/**
 * Lisää uuden pelaajan joukkueeseen.
 * @param params - Sisältää kentät teamId (ep_joukkue.id), name, sex.
 */
async function addPlayer(params: Record<string, any>, auth: AuthTokenPayload | null) {
    // Miten autentikaatio tulisi tarkistaa tässä? Käyttäjän tulee pystyä lisäämään
    // tarvittaessa pelaaja vierasjoukkueeseenkin pöytäkirjan ilmoituksen yhteydessä.
    if (!auth)
        throw new AuthError();
    if (!params.teamId || !params.name || typeof params.name !== "string")
        throw Error('Missing player info.');
    const name = removeSpecialChars(params.name.trim()).slice(0, 15);
    if (!name)
        throw Error('Invalid name.');
    const sex = (params.sex === 'M' || params.sex === 'N') ? params.sex : '-';
    const query = `INSERT INTO ep_pelaaja (nimi, joukkue, sukupuoli) VALUES (?, ?, ?)`;
    return myQuery(pool, query, [name, params.teamId, sex]);
}

/**
 * Hakee listan käyttäjistä userpw taulusta.
 * HUOM! Tämä on vain testikäyttöön, poista production vaiheessa.
 */
async function getUsers(_auth: AuthTokenPayload | null) {
    const query = `SELECT Nimi, Joukkue FROM userpw`;
    return myQuery(pool, query);
}

export { getMatchInfo, getMatchesToReport, getMatchesToReportModerator,
    getPlayersInTeam, getScores, getResultsTeams, getResultsTeamsOld, 
    getResultsPlayersOld, getResultsPlayers, submitMatchResult, addPlayer, 
    getUsers };