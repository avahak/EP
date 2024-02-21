import mysql from 'mysql2/promise';
import { myQuery } from './dbGeneral.js';

/**
 * Palauttaa erien tuloksia.
 */
async function getScores(pool: mysql.Pool, matchId: number) {
    // Valitaan pelaajat, joiden joukkueen lyhenne on teamAbbr:
    const query = `
        SELECT p.kp, p.vp, e.era1, e.era2, e.era3, e.era4, e.era5
        FROM ep_ottelu o
        JOIN ep_peli p ON p.ottelu=o.id
        JOIN ep_erat e ON e.peli=p.id
        WHERE o.id=?
        `;
    return myQuery(pool, query, [matchId]);
}

/**
 * Palauttaa joukkueen kaikki pelaajat.
 */
async function getPlayersInTeam(pool: mysql.Pool, teamAbbr: string) {
    // Valitaan pelaajat, joiden joukkueen lyhenne on teamAbbr:
    const query = `
        SELECT p.id AS id, p.nimi AS name
        FROM ep_joukkue j
        JOIN ep_pelaaja p ON p.joukkue = j.id
        WHERE j.lyhenne=?
        `;
    return myQuery(pool, query, [teamAbbr]);
}

/**
 * Palauttaa ilmoittamattomat (T) tai vahvistamattomat (K) menneet ottelut.
 */
async function getMatchesToReport(pool: mysql.Pool) {
    // Valitaan ottelut, missä päivä on ennen nykyhetkeä ja status on 'T' tai 'K':
    const dateNow = new Date().toISOString().split('T')[0];
    const query = `
        SELECT o.id, o.paiva AS date, j1.lyhenne AS home, j2.lyhenne AS away, o.status AS status
        FROM ep_ottelu o
        JOIN ep_joukkue j1 ON o.koti = j1.id
        JOIN ep_joukkue j2 ON o.vieras = j2.id
        WHERE (o.status='T' OR o.status='K') AND (o.paiva <= ?)
        ORDER BY o.paiva
        `;
    return myQuery(pool, query, [dateNow]);
}

/**
 * Palauttaa taulukon otteluista, yleistä testausta varten.
 */
async function getAllMatches(pool: mysql.Pool) {
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
 * Tuloskysely sarjat
 */
async function getResultsTeams(pool: mysql.Pool) {
    const query = `
        SELECT *
        FROM ep_sarjat
        WHERE lohko = 3
        `;
    return myQuery(pool, query);
}

/**
 * Tuloskysely pelaajille
 */
async function getResultsPlayers(pool: mysql.Pool) {
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
            ep_joukkue.kausi = 3
        `;
    const queryHome = `
        SELECT
            p.kp,
            SUM((e.era1 = 'K1') + (e.era2 = 'K1') + (e.era3 = 'K1') + (e.era4 = 'K1') + (e.era5 = 'K1')) AS K1,
            SUM((e.era1 = 'K2') + (e.era2 = 'K2') + (e.era3 = 'K2') + (e.era4 = 'K2') + (e.era5 = 'K2')) AS K2,
            SUM((e.era1 = 'K3') + (e.era2 = 'K3') + (e.era3 = 'K3') + (e.era4 = 'K3') + (e.era5 = 'K3')) AS K3,
            SUM((e.era1 = 'K4') + (e.era2 = 'K4') + (e.era3 = 'K4') + (e.era4 = 'K4') + (e.era5 = 'K4')) AS K4,
            SUM((e.era1 = 'K5') + (e.era2 = 'K5') + (e.era3 = 'K5') + (e.era4 = 'K5') + (e.era5 = 'K5')) AS K5,
            SUM((e.era1 = 'K6') + (e.era2 = 'K6') + (e.era3 = 'K6') + (e.era4 = 'K6') + (e.era5 = 'K6')) AS K6
        FROM
            ep_erat AS e
            JOIN ep_peli AS p ON p.id = e.peli
            JOIN ep_ottelu ON ep_ottelu.id = p.ottelu
            JOIN ep_lohko ON ep_lohko.id = ep_ottelu.lohko
        WHERE
            ep_lohko.kausi = 3
        GROUP BY
            p.kp
        `;
    const queryAway = `
        SELECT
            p.vp,
            SUM((e.era1 = 'V1') + (e.era2 = 'V1') + (e.era3 = 'V1') + (e.era4 = 'V1') + (e.era5 = 'V1')) AS V1,
            SUM((e.era1 = 'V2') + (e.era2 = 'V2') + (e.era3 = 'V2') + (e.era4 = 'V2') + (e.era5 = 'V2')) AS V2,
            SUM((e.era1 = 'V3') + (e.era2 = 'V3') + (e.era3 = 'V3') + (e.era4 = 'V3') + (e.era5 = 'V3')) AS V3,
            SUM((e.era1 = 'V4') + (e.era2 = 'V4') + (e.era3 = 'V4') + (e.era4 = 'V4') + (e.era5 = 'V4')) AS V4,
            SUM((e.era1 = 'V5') + (e.era2 = 'V5') + (e.era3 = 'V5') + (e.era4 = 'V5') + (e.era5 = 'V5')) AS V5,
            SUM((e.era1 = 'V6') + (e.era2 = 'V6') + (e.era3 = 'V6') + (e.era4 = 'V6') + (e.era5 = 'V6')) AS V6
        FROM
            ep_erat AS e
            JOIN ep_peli AS p ON p.id = e.peli
            JOIN ep_ottelu ON ep_ottelu.id = p.ottelu
            JOIN ep_lohko ON ep_lohko.id = ep_ottelu.lohko
        WHERE
            ep_lohko.kausi = 3
        GROUP BY
            p.vp
        `;
    const resultGeneral = await myQuery(pool, queryGeneral);
    const resultHome = await myQuery(pool, queryHome);
    const resultAway = await myQuery(pool, queryAway);
    return [resultGeneral, resultHome, resultAway];
}

export { getAllMatches, getMatchesToReport, getPlayersInTeam, getScores, 
    getResultsTeams, getResultsPlayers }