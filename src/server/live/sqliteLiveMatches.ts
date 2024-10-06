/**
 * Wrapperi tallettamaan live-ottelut levylle käyttämällä SQLiteä.
 * Tässä lisätään lähinnä tyyppi- ja merkkijonomuunnoksia sqliteWrapper funktioihin.
 * 
 * Vastaa suunnilleen kuvausta `liveMatches: Map<number, LiveMatch>`.
 */

import { LiveMatch } from "./liveTypes";
import { logger } from "../logger";
import { sqliteDelete, sqliteExec, sqliteGet, sqliteGetAll, sqliteGetAllKeys, sqliteSet } from "../sqliteWrapper";

const TABLE_NAME = "live_matches";
sqliteExec(`
    -- DROP TABLE IF EXISTS ${TABLE_NAME};
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        key INTEGER PRIMARY KEY,
        value TEXT
    );
    `);

/**
 * Apufunktio SQLite arvon hakemiseen.
 */
function sqliteGetMatch(matchId: number): LiveMatch|null {
    try {
        const value = sqliteGet(TABLE_NAME, `${matchId}`);
        if (!value)
            return null;
        return JSON.parse(value);
    } catch (error: any) {
        logger.error("Error in sqliteGetMatch", error);
        throw error;
    }
}

/**
 * Apufunktio SQLite arvon asettamiseen.
 */
function sqliteSetMatch(matchId: number, liveMatch: LiveMatch): void {
    sqliteSet(TABLE_NAME, `${matchId}`, JSON.stringify(liveMatch));
}

/**
 * Apufunktio SQLite arvon poistamiseen.
 */
function sqliteDeleteMatch(matchId: number): boolean {
    return sqliteDelete(TABLE_NAME, `${matchId}`);
}

/**
 * Apufunktio kaikkien otteluiden hakemiseen käyttäen SQLite.
 */
function sqliteGetAllMatches(): Map<number,LiveMatch> {
    const matches = new Map<number, LiveMatch>();
    const rawMap = sqliteGetAll(TABLE_NAME);

    for (const [key, value] of rawMap) {
        const matchId = Number(key);
        if (key && !Number.isNaN(matchId)) {
            try {
                matches.set(matchId, JSON.parse(value));
            } catch (parseError) {
                logger.error(`JSON parsing error`, parseError, { matchId });
            }
        }
    }
    return matches;
}

/**
 * Apufunktio SQLite avainten hakemiseen.
 */
function sqliteGetMatchIds(): string[] {
    const keys = sqliteGetAllKeys(TABLE_NAME);
    return keys;
}

export { sqliteGetMatch, sqliteSetMatch, sqliteGetAllMatches, sqliteGetMatchIds, 
    sqliteDeleteMatch };