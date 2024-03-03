/**
 * Kokoelma tietokantaan kohdistuvia kyselyitä, joita React app tarvitsee.
 * Näitä kutsuu src/server/server.ts funktio specificQuery.
 */

import mysql from 'mysql2/promise';
import { myQuery } from './dbGeneral.js';
import { dateToISOString, deepCopy } from '../../shared/generalUtils.js';
// import { parseMatch } from '../../shared/parseMatch.js';

/**
 * Palauttaa ottelun pelaajat ja erien tulokset.
 * @param params - Sisältää ep_ottelu.id tiedon kentässä matchId.
 */
async function getScores(pool: mysql.Pool, params: Record<string, any>) {
    // Valitaan pelaajat ja erätulokset annetulle ottelulle:
    const query = `
        SELECT p.kp, p.vp, e.era1, e.era2, e.era3, e.era4, e.era5
        FROM ep_ottelu o
        JOIN ep_peli p ON p.ottelu=o.id
        JOIN ep_erat e ON e.peli=p.id
        WHERE o.id=?
    `;
    return myQuery(pool, query, [params.matchId]);
}

/**
 * Palauttaa joukkueen kaikki pelaajat.
 * @param params - Sisältää ep_joukkue.id tiedon kentässä teamId.
 */
async function getPlayersInTeam(pool: mysql.Pool, params: Record<string, any>) {
    // Valitaan kaikki pelaajat, joiden joukkueen id on teamId:
    const query = `
        SELECT p.id AS id, p.nimi AS name
        FROM ep_joukkue j
        JOIN ep_pelaaja p ON p.joukkue = j.id
        WHERE j.id = ?
    `;
    return myQuery(pool, query, [params.teamId]);
}

/**
 * Hakee taulun ep_ottelu perustiedot sen id:n perusteella.
 * @param params - Sisältää ep_ottelu.id tiedon kentässä matchId.
 */
async function getMatchInfo(pool: mysql.Pool, params: Record<string, any>) {
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
 * Palauttaa menneet ilmoittamattomat (T) tai vierasjoukkueen hyväksymättömät (K) ottelut.
 */
async function getMatchesToReport(pool: mysql.Pool, params: Record<string, any>) {
    // Valitaan ottelut, missä päivä on ennen nykyhetkeä ja status on 'T' tai 'K':
    const dateNow = dateToISOString(new Date());
    const query = `
        SELECT o.id, o.paiva AS date, j1.id AS homeId, j2.id AS awayId, j1.lyhenne AS home, j2.lyhenne AS away, o.status AS status
        FROM ep_ottelu o
        JOIN ep_joukkue j1 ON o.koti = j1.id
        JOIN ep_joukkue j2 ON o.vieras = j2.id
        WHERE (o.status='T' OR o.status='K') AND (j1.kausi = ?) AND (o.paiva <= ?)
        ORDER BY o.paiva
    `;
    return myQuery(pool, query, [params._current_kausi, dateNow]);
}

/**
 * Palauttaa taulukon kaikista otteluista, yleistä testausta varten.
 */
async function getAllMatches(pool: mysql.Pool, _params: Record<string, any>) {
    const query = `
        SELECT o.paiva AS date, j1.lyhenne AS home, j2.lyhenne AS away, o.status AS status
        FROM ep_ottelu o
        JOIN ep_joukkue j1 ON o.koti = j1.id
        JOIN ep_joukkue j2 ON o.vieras = j2.id
        ORDER BY o.paiva
    `;
    return myQuery(pool, query);
}

/**
 * Tuloskysely joukkueiden tilanteesta (ep_sarjat taulu).
 * @param params - Sisältää kentän _current_kausi.
 */
async function getResultsTeams(pool: mysql.Pool, params: Record<string, any>) {
    const query = `
        SELECT ep_sarjat.id, ep_sarjat.joukkue, ep_sarjat.nimi, ep_sarjat.lyhenne, 
            ep_sarjat.ottelu, ep_sarjat.voitto, ep_sarjat.tappio, ep_sarjat.v_era, 
            ep_sarjat.h_era, ep_sarjat.v_peli, ep_sarjat.h_peli
        FROM ep_sarjat
        JOIN ep_lohko ON ep_lohko.id = ep_sarjat.lohko
        WHERE ep_lohko.kausi = ?
    `;
    return myQuery(pool, query, [params._current_kausi]);
}

/**
 * Tuloskysely pelaajien tilanteesta.
 * @param params Sisältää kentän _current_kausi.
 */
async function getResultsPlayers(pool: mysql.Pool, params: Record<string, any>) {
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
            CAST(SUM((e.era1 = 'K6') + (e.era2 = 'K6') + (e.era3 = 'K6') + (e.era4 = 'K6') + (e.era5 = 'K6')) AS SIGNED) AS K6
        FROM
            ep_erat AS e
            JOIN ep_peli AS p ON p.id = e.peli
            JOIN ep_ottelu ON ep_ottelu.id = p.ottelu
            JOIN ep_lohko ON ep_lohko.id = ep_ottelu.lohko
        WHERE
            ep_lohko.kausi = ?
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
            CAST(SUM((e.era1 = 'V6') + (e.era2 = 'V6') + (e.era3 = 'V6') + (e.era4 = 'V6') + (e.era5 = 'V6')) AS SIGNED) AS V6
        FROM
            ep_erat AS e
            JOIN ep_peli AS p ON p.id = e.peli
            JOIN ep_ottelu ON ep_ottelu.id = p.ottelu
            JOIN ep_lohko ON ep_lohko.id = ep_ottelu.lohko
        WHERE
            ep_lohko.kausi = ?
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
async function submitMatchResult(pool: mysql.Pool, params: Record<string, any>) {
    const match = params.result;    // HUOM! Tämä tulisi tarkistaa vielä tässä!
    const rounds = deepCopy(match.rounds);
    
    console.log("match", JSON.stringify(match));
    await new Promise(r => setTimeout(r, 2000));    // poista tämä (tässä vain testausta varten)

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        try {
            // Poistetaan kaikki otteluun liittyvät rivit taulusta ep_erat:
            // const query1 = `
            //     DELETE e 
            //     FROM ep_erat e
            //     JOIN ep_peli p ON e.peli = p.id
            //     JOIN ep_ottelu o ON p.ottelu = o.id
            //     WHERE o.id = ?
            // `;
            // await connection.query(query1, [match.id]);

            // Herättimen "trigger_modify_peli_on_erat_delete" takia 
            // ei voida poistaa rivejä taulusta ep_erat kyselyllä, jossa esiintyy ep_peli.
            // Tämän takia käytetään väliaikaista taulua apuna:
            const query1_1 = `CREATE TEMPORARY TABLE temp_ids (id INT)`;
            const query1_2 = `
                INSERT INTO temp_ids (id)
                SELECT e.id
                FROM ep_erat e
                JOIN ep_peli p ON e.peli = p.id
                JOIN ep_ottelu o ON p.ottelu = o.id
                WHERE o.id = ?
            `;
            const query1_3 = `DELETE FROM ep_erat WHERE id IN (SELECT * FROM temp_ids)`;
            const query1_4 = `DROP TEMPORARY TABLE temp_ids`;
            await connection.query(query1_1);
            await connection.query(query1_2, [match.id]);
            await connection.query(query1_3);
            await connection.query(query1_4);

            // Poistetaan kaikki otteluun liittyvät rivit taulusta ep_peli:
            const query2 = `
                DELETE FROM ep_peli 
                WHERE ottelu = ?
            `;
            await connection.query(query2, [match.id]);

            // Lisätään uudet rivit tauluun ep_peli:
            for (let k = 0; k < 9; k++) {
                const query3 = `INSERT INTO ep_peli (ottelu, kp, vp) VALUES (?, ?, ?)`;
                const [insertedRow] = await connection.query(query3, match.games[k]);
                // Liitetään rounds taulukkoon lisätyn rivin id:
                if ('insertId' in insertedRow)
                    rounds[k][0] = insertedRow.insertId;
                else 
                    throw Error("Error during ep_peli INSERT.")
            }

            // Lisätään uudet rivit tauluun ep_erat:
            const query4 = `INSERT INTO ep_erat (peli, era1, era2, era3, era4, era5) VALUES ?`;
            await connection.query(query4, [rounds]);

            // Muutetaan ottelun päivämäärä:
            const query5 = `UPDATE ep_ottelu SET paiva = ? WHERE id = ?`;
            await connection.query(query5, [match.date, match.id]);

            // Muutetaan ottelun status:
            const query6 = `UPDATE ep_ottelu SET status = ? WHERE id = ?`;
            await connection.query(query6, [match.newStatus, match.id]);

            await connection.commit();
            // await connection.rollback();
        } catch (error) {
            await connection.rollback();
            console.error("Error during submitMatchResult:", error);
            throw error;
        } finally {
            connection.destroy();       // TEHOTONTA! Käytetään vain Azure SQL ongelmien takia
            // connection.release();
        }
    } catch (error) {
        console.error("Error during submitMatchResult:", error);
        throw error;
    }
}

/**
 * Lisää uuden pelaajan joukkueeseen.
 * @param params - Sisältää kentät teamId (ep_joukkue.id), name, sex.
 */
async function AddPlayer(pool: mysql.Pool, params: Record<string, any>) {
    if (!params.teamId || !params.name)
        throw Error('Missing player info.');
    const name = params.name.slice(0, 15);
    const sex = (params.sex == 'M' || params.sex == 'N') ? params.sex : '-';
    const query = `INSERT INTO ep_pelaaja (nimi, joukkue, sukupuoli) VALUES (?, ?, ?)`;
    return myQuery(pool, query, [name, params.teamId, sex]);
}

export { getAllMatches, getMatchInfo, getMatchesToReport, getPlayersInTeam, getScores, 
    getResultsTeams, getResultsPlayers, submitMatchResult, AddPlayer }