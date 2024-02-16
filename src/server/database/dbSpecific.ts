import mysql from 'mysql2/promise';
import { myQuery } from './dbGeneral.js';

/**
 * Palauttaa taulukon otteluista, yleistä testausta varten.
 */
async function getMatches(pool: mysql.Pool) {
    const query = `
        SELECT o.paiva AS paiva, j1.lyhenne AS kotijoukkue, j2.lyhenne AS vierasjoukkue, o.status AS status
        FROM ep_ottelu o
        JOIN ep_joukkue j1 ON o.koti = j1.id
        JOIN ep_joukkue j2 ON o.vieras = j2.id
        ORDER BY o.paiva;
        `;
    return myQuery(pool, query);
}

export { getMatches };