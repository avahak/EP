/**
 * Apufunktioita lukitsemaan ottelupöytäkirjan lähettäminen hetkeksi sillä
 * aikaa kun toinen saman ottelun lähetys on kesken.
 * 
 * HUOM! Tällaisen lukituksen käyttäminen ei ole loppupeleissä oikea ratkaisu!
 * Tietokanta ja rutiinit tulisi kirjoittaa niin, että yhtäaikaiset lähetykset eivät ole
 * ongelma, mutta nyt näin ei ole. Ratkaisua tulee pitää siis väliaikaisena.
 * 
 * HUOM. Tässä tulisi käyttää SQLite tietokantaa, jotta lukkoja voisi jakaa
 * prosessien välillä. Atomisesti lukituksen voi silloin tehdä käyttäen
 * `INSERT INTO ${TABLE_NAME} (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING;`;
 * ja lukemalla muutettujen rivien määrä.
 */

import { logger } from "../logger";

const MINUTE_ms = 60*1000;

/**
 * Aika ennen kuin ottelun lähettämisen lukko vanhenee itsestään.
 */
const MAX_LOCK_DURATION_ms = 3*MINUTE_ms;

/**
 * Kuvaus, joka yhdistää ottelun id sen lähetyksen aloitusajan niille
 * otteluille, joiden pöytäkirjaa ollaan parhaillaan lähettämässä.
 * Tämän tarkoitus on estää saman ottelun lähetäminen useaan kertaan
 * yhtäaikaisesti.
 */
const matchLocks = new Map<number, number>();

/**
 * Poistaa lukon jos se on vanhentunut.
 */
function handleExpiration(matchId: number): void {
    const now = Date.now();
    const time = matchLocks.get(matchId);
    if (!time)
        return;
    if (Number.isNaN(time) || (now-time > MAX_LOCK_DURATION_ms)) {
        logger.warn("Expiration in getMatchLock", { matchId });
        matchLocks.delete(matchId);
    }
}

/**
 * Lukitsee ottelun mikäli lukkoa ei ole jo olemassa. 
 * Palauttaa true joss lukkoa ei vielä ollut ja lukitseminen onnistui.
 */
function tryLockMatch(matchId: number): boolean {
    const now = Date.now();
    handleExpiration(matchId);
    try {
        const lock = matchLocks.get(matchId);
        if (!lock) {
            matchLocks.set(matchId, now);
            return true;
        }
        return false;
    } catch (error) {
        logger.error("Error in tryLock", error);
        return false;
    }
}

/**
 * Apufunktio arvon poistamiseen.
 */
function releaseMatchLock(matchId: number): void {
    matchLocks.delete(matchId);
}

/**
 * Palauttaa lukitut ottelut merkkijonona.
 */
function getMatchSubmissionLocksString(): string {
    return JSON.stringify(Array.from(matchLocks));
}

export { tryLockMatch, releaseMatchLock, getMatchSubmissionLocksString };