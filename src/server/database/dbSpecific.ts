import mysql from 'mysql2/promise';
import { myQuery } from './dbGeneral.js';

/**
 * Palauttaa joukkueen kaikki pelaajat.
 */
async function getPlayersInTeam(pool: mysql.Pool, teamAbbr: string) {
    // Valitaan pelaajat, joiden joukkueen lyhenne on teamAbbr:
    const query = `
        SELECT p.id, p.nimi
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
        SELECT o.id, o.paiva AS paiva, j1.lyhenne AS koti, j2.lyhenne AS vieras, o.status
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
        SELECT o.paiva AS paiva, j1.lyhenne AS koti, j2.lyhenne AS vieras, o.status AS status
        FROM ep_ottelu o
        JOIN ep_joukkue j1 ON o.koti = j1.id
        JOIN ep_joukkue j2 ON o.vieras = j2.id
        ORDER BY o.paiva;
        `;
    return myQuery(pool, query);
}

export { getAllMatches, getMatchesToReport, getPlayersInTeam };