/**
 * Wrapperi tallettamaan key-value pareja SQLite tietokannassa.
 * Tässä kaikki käsitellään merkkijonoina.
 * 
 * * Tätä käytetään 
 * - live-otteluiden tallettamiseen
 * - ottelupöytäkirjan lähettämisen lukituksien tallettamiseen.
 */

import DatabaseConstructor, { Database } from "better-sqlite3";
import { logger } from "./logger";

const sqliteDB: Database = new DatabaseConstructor('./temp_data.db');

function sqliteExec(statement: string) {
    try {
        sqliteDB.exec(statement);
    } catch (error) {
        logger.error("SQLite error", error);
        throw error;
    }
}

function sqliteGet(table: string, key: string): string|null {
    try {
        const row = sqliteDB.prepare(`SELECT * FROM ${table} WHERE key = ?`).get(key) as any;
        if (!row || !row.value)
            return null;
        return row.value;
    } catch (error) {
        logger.error("SQLite error", error);
        throw error;
    }
}

function sqliteSet(table: string, key: string, value: string): void {
    try {
        const query = `INSERT INTO ${table} (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`;
        sqliteDB.prepare(query).run(key, value);
    } catch (error) {
        logger.error("SQLite error", error);
        throw error;
    }
}

function sqliteDelete(table: string, key: string): boolean {
    try {
        const result = sqliteDB.prepare(`DELETE FROM ${table} WHERE key = ?`).run(key);
        return result.changes > 0;
    } catch (error) {
        logger.error("SQLite error", error);
        throw error;
    }
}

function sqliteGetAll(table: string): Map<string, string> {
    try {
        const rows = sqliteDB.prepare(`SELECT * FROM ${table}`).all() as any;
        const map = new Map<string, string>();
        for (const row of rows)
            map.set(row.key, row.value);
        return map;
    } catch (error) {
        logger.error("SQLite error", error);
        throw error;
    }
}

function sqliteGetAllKeys(table: string): string[] {
    try {
        const rows = sqliteDB.prepare(`SELECT key FROM ${table}`).all() as any;
        const keys = [];
        for (const row of rows)
            keys.push(row.key);
        return keys;
    } catch (error) {
        logger.error("SQLite error", error);
        throw error;
    }
}

function sqliteClose(): void {
    try {
        sqliteDB.close();
    } catch (error) {
        logger.error("SQLite error", error);
        throw error;
    }
}

export { sqliteDB, sqliteExec, sqliteGet, sqliteSet, sqliteDelete, 
    sqliteGetAll, sqliteGetAllKeys, sqliteClose };
