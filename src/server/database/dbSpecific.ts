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
        ORDER BY o.paiva;
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
        ORDER BY o.paiva;
        `;
    return myQuery(pool, query);
}

export { getAllMatches, getMatchesToReport, getPlayersInTeam, getScores };