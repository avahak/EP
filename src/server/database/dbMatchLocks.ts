/**
 * Apufunktioita lukitsemaan ottelupöytäkirjan lähettäminen hetkeksi sillä
 * aikaa kun toinen saman ottelun lähetys on kesken.
 * 
 * HUOM! Tällaisen lukituksen käyttäminen ei ole loppupeleissä oikea ratkaisu!
 * Tietokanta ja rutiinit tulisi kirjoittaa niin, että yhtäaikaiset lähetykset eivät ole
 * ongelma, mutta nyt näin ei ole. Ratkaisua tulee pitää siis väliaikaisena.
 * 
 * Käyttää talletukseen SQLiteä.
 */

import { logger } from "../logger";
import { sqliteDB, sqliteDelete, sqliteExec, sqliteGet, sqliteGetAll } from "../sqliteWrapper";

/**
 * Taulu yhdistämään ottelun id sen lähetyksen aloitusaikaan niille
 * otteluille, joiden pöytäkirjaa ollaan parhaillaan lähettämässä.
 * Tämän tarkoitus on estää saman ottelun lähetäminen useaan kertaan
 * yhtäaikaisesti.
 * 
 * Vastaa tässä käytössä kuvausta `matchSubmissionLocks: Map<number, number>`.
 */
const TABLE_NAME = "match_locks";

sqliteExec(`
    -- DROP TABLE IF EXISTS ${TABLE_NAME};
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        key INTEGER PRIMARY KEY,
        value INTEGER
    );
    `);

const MINUTE_ms = 60*1000;

/**
 * Aika ennen kuin ottelun lähettämisen lukko vanhenee itsestään.
 */
const MAX_LOCK_DURATION_ms = 3*MINUTE_ms;

/**
 * Poistaa lukon jos se on vanhentunut.
 */
function handleExpiration(matchId: number): void {
    const now = Date.now();
    const value = sqliteGet(TABLE_NAME, `${matchId}`);
    if (!value)
        return;
    const time = Number(value);
    if (Number.isNaN(time) || (now-time > MAX_LOCK_DURATION_ms)) {
        logger.warn("Expiration in getMatchLock", { matchId });
        sqliteDelete(TABLE_NAME, `${matchId}`);
    }
}

/**
 * Lukitsee ottelun mikäli lukkoa ei ole jo olemassa. 
 * Palauttaa true joss lukkoa ei vielä ollut ja lukitseminen onnistui.
 * HUOM! Toimii atomisesti!
 */
function tryLockMatch(matchId: number): boolean {
    const now = Date.now();
    handleExpiration(matchId);
    try {
        const stmt = `INSERT INTO ${TABLE_NAME} (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING;`;
        const result = sqliteDB.prepare(stmt).run(matchId, now);
        return result.changes > 0;
    } catch (error) {
        logger.error("Error in tryLock", error);
        return false;
    }
}

/**
 * Apufunktio SQLite arvon poistamiseen.
 */
function releaseMatchLock(matchId: number): void {
    sqliteDelete(TABLE_NAME, `${matchId}`);
}

/**
 * Apufunktio kaikkien otteluiden hakemiseen käyttäen SQLite.
 */
function getAllMatchLocks(): Map<number, number> {
    try {
        const locks = new Map<number, number>();
        const pairs = sqliteGetAll(TABLE_NAME);
        for (const [key, value] of pairs) {
            const matchId = Number(key);
            const time = Number(value);
            if (!key || !value || Number.isNaN(matchId) || Number.isNaN(time))
                logger.error(`Invalid lock`, { matchId, time });
            locks.set(matchId, time);
        }
        return locks;
    } catch (error) {
        logger.error("Error in getAllMatchLocks", error);
        throw error;
    }
}

/**
 * Palauttaa lukitut ottelut merkkijonona.
 */
function getMatchSubmissionLocksString(): string {
    const locks = getAllMatchLocks();
    return JSON.stringify(Array.from(locks));
}

export { tryLockMatch, releaseMatchLock, getAllMatchLocks, 
    getMatchSubmissionLocksString}