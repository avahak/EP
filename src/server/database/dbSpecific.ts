/**
 * Kokoelma tietokantaan kohdistuvia kyselyitä, joita React app tarvitsee.
 * Näitä kutsuu src/server/database/dbRoutes.ts funktio specificQuery.
 * 
 * TODO harkitse `await connection.query('SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE');`
 */

import { myQuery } from './dbGeneral.js';
import { dateToYYYYMMDD, delay, removeSpecialChars } from '../../shared/generalUtils.js';
import { enforceValidSymbolsInRounds, isValidParsedMatch } from '../../shared/parseMatch.js';
import { AuthTokenPayload, roleIsAtLeast } from '../../shared/commonTypes.js';
import { pool } from './dbConnections.js';
import { RowDataPacket } from 'mysql2';
import { endLiveMatch } from '../live/liveScoreRoutes.js';
import { releaseMatchLock, tryLockMatch } from './dbMatchLocks.js';
import { logger } from '../logger.js';
import { CustomError } from '../../shared/customErrors.js';

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
 * Laji on 'r' tai 'p' ja kertoo tarvitseeko ottelun kohdalla laskea sarjatilannetuloksia.
 * @param params - Sisältää ep_ottelu.id tiedon kentässä matchId.
 */
async function getMatchInfo(params: Record<string, any>, _auth: AuthTokenPayload | null) {
    const query = `
        SELECT o.id, o.paiva AS date, j1.id AS homeId, j2.id AS awayId, j1.lyhenne AS home, 
            j2.lyhenne AS away, j1.nimi AS homeFull, j2.nimi AS awayFull, o.status AS status, 
            k.Laji as laji
        FROM ep_ottelu o
            JOIN ep_joukkue j1 ON o.koti = j1.id
            JOIN ep_joukkue j2 ON o.vieras = j2.id
            JOIN ep_lohko l ON o.lohko = l.id
            JOIN ep_kausi k ON l.kausi = k.id
        WHERE o.id = ?
    `;
    return myQuery(pool, query, [params.matchId]);
}

/**
 * Palauttaa menneet käyttäjän ilmoittamattomat (T) ja vain yhden joukkueen 
 * ilmoittamat (K, W) ottelut.
 */
async function getMatchesToReport(params: Record<string, any>, auth: AuthTokenPayload | null) {
    if (!auth)
        throw new CustomError("UNAUTHORIZED");
    // Valitaan ottelut, missä päivä on ennen nykyhetkeä ja status on 'T' tai 'K' tai 'W'
    // ja toinen joukkueista on käyttäjän joukkue:
    const dateNow = dateToYYYYMMDD(new Date());
    const query = `
        SELECT o.id, o.paiva AS date, j1.id AS homeId, j2.id AS awayId, j1.lyhenne AS home, j2.lyhenne AS away, o.status AS status
        FROM ep_ottelu o
            JOIN ep_joukkue j1 ON o.koti = j1.id
            JOIN ep_joukkue j2 ON o.vieras = j2.id
        WHERE (o.status IN ('T', 'K', 'W')) AND (j1.kausi = ?) AND (o.paiva <= ?) 
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
        throw new CustomError("UNAUTHORIZED");
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
    // Huom. Jos päivä o.paiva on NULL niin (o.paiva <= ?) evaluoituu NULL arvoiseksi 
    //      ja rivi ei tule mukaan.
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
async function getResultsTeams(params: Record<string, any>, _auth: AuthTokenPayload | null) {
    if (!params.lohko)
        throw Error(`Missing parameter "lohko".`);
    const query = `
        SELECT ep_sarjat.joukkue, ep_sarjat.nimi, ep_sarjat.lyhenne, 
            ep_sarjat.voitto, ep_sarjat.tappio, ep_sarjat.v_era, 
            ep_sarjat.h_era, ep_sarjat.v_peli, ep_sarjat.h_peli
        FROM ep_sarjat
            JOIN ep_lohko ON ep_lohko.id = ep_sarjat.lohko
        WHERE ep_lohko.id = ?
    `;
    return myQuery(pool, query, [params.lohko]);
}

/**
 * Tuloskysely pelaajien tilanteesta.
 * @param params Sisältää kentän _current_kausi.
 */
async function getResultsPlayers(params: Record<string, any>, _auth: AuthTokenPayload | null) {
    if (!params.lohko)
        throw Error(`Missing parameter "lohko".`);
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
            ep_joukkue.lohko = ?
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
        WHERE
            ep_ottelu.lohko = ? AND ep_ottelu.status <> 'T'
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
        WHERE
            ep_ottelu.lohko = ? AND ep_ottelu.status <> 'T'
        GROUP BY
            p.vp
    `;
    const resultGeneral = await myQuery(pool, queryGeneral, [params.lohko]);
    const resultHome = await myQuery(pool, queryHome, [params.lohko]);
    const resultAway = await myQuery(pool, queryAway, [params.lohko]);
    return [resultGeneral, resultHome, resultAway];
}


/**
 * Ottelun tulosten kirjaaminen.
 * @param params - Sisältää kentän result.
 */
async function submitMatchResult(params: Record<string, any>, auth: AuthTokenPayload | null) {
    if (!auth)
        throw new CustomError("UNAUTHORIZED");

    const match = params.result;
    // console.log("match", JSON.stringify(match));

    if (!match.ok || !isValidParsedMatch(match) || match.newStatus === 'T')
        throw new CustomError("INVALID_INPUT", { matchId: match.id });
    // Vain admin voi muuttaa jo hyväksytyn ottelun tulosta:
    if (match.status === 'H' && !roleIsAtLeast(auth.role, "admin"))
        throw new CustomError("UNAUTHORIZED", { matchId: match.id });

    // Tavalliset käyttäjät voivat ilmoittaa ainoastaan otteluita, 
    // missä toinen joukkueista on heidän:
    if (!roleIsAtLeast(auth.role, "mod")) {
        if (!['T', 'K', 'W'].includes(match.status))
            throw new CustomError("UNAUTHORIZED", { matchId: match.id });
        if (match.status === 'T')
            if (!(auth.team === match.homeTeamName && match.newStatus === 'K') &&
                    !(auth.team === match.awayTeamName && match.newStatus === 'W'))
                throw new CustomError("UNAUTHORIZED", { matchId: match.id });
        if (match.status === 'K')
            if (auth.team !== match.awayTeamName || (match.newStatus !== 'V' && match.newStatus !== 'M'))
                throw new CustomError("UNAUTHORIZED", { matchId: match.id });
        if (match.status === 'W')
            if (auth.team !== match.homeTeamName || (match.newStatus !== 'L' && match.newStatus !== 'M'))
                throw new CustomError("UNAUTHORIZED", { matchId: match.id });
    }

    // Pakotetaan erätulossymbolit hyväksyttäviksi arvoiksi (K1-K6, V0-V6):
    // TODO Tämä pitäisi tehdä ennen isValidParsedMatch testiä.
    const rounds = enforceValidSymbolsInRounds(match.rounds);

    let lockAcquired = false;
    try {
        // Yritetään lukita ottelu. Palautusarvo on true joss yritys onnistui.
        lockAcquired = tryLockMatch(match.id);
        if (!lockAcquired) 
            throw new CustomError("MATCH_SUBMIT_LOCKED", { matchId: match.id });

        // Tarkistetaan, että ottelun tiedot ovat samat kuin tietokannassa:
        const dbRows = await getMatchInfo({ matchId: match.id }, null);
        if (!Array.isArray(dbRows) || dbRows.length !== 1)
            throw new CustomError("DATA_MISMATCH", { matchId: match.id });
        const dbMatch = dbRows[0] as RowDataPacket;
        if (dbMatch.home !== match.homeTeamName || dbMatch.away !== match.awayTeamName 
                || dbMatch.status !== match.status || dbMatch.laji !== match.laji)
            throw new CustomError("DATA_MISMATCH", { dbMatchStatus: dbMatch.status, matchId: match.id });

        // Päivitetään ep_pelaaja, ep_sarjat tuloskenttiä ainoastaan runkosarjan peleissä
        const updateRankingStats = dbMatch.laji.toLowerCase() === 'r';

        const connection = await pool.getConnection();
        await connection.beginTransaction(); 
        try {
            // Kumotaan vanhat tulokset varsinaisissa tauluissa:
            const query0_1 = `
                SELECT p.id FROM ep_peli p 
                WHERE p.ottelu = ?
            `;
            let [rows] = await connection.query(query0_1, [match.id]) as any;
            if (rows && typeof rows[Symbol.iterator] === 'function') {
                for (let row of (rows as any)) {
                    const query0_2 = `CALL procedure_update_all_old_from_peli(?, ?, ?, ?)`;
                    await connection.query(query0_2, [row.id, 0, 0, updateRankingStats]);
                    // console.log("handling id:", row.id);
                }
            }

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

            // Lisätään uudet rivit tauluun ep_erat, ep_peli:
            for (let k = 0; k < 9; k++) {
                await delay(500);  // TODO remove, only for testing!
                // if (1 == 1 || Math.random() < 0.1)
                //     throw new CustomError("DEBUG_ERROR");

                // Ei talleteta kahden tyhjän pelaajan peliä:
                if (match.games[k][1] === -1 && match.games[k][2] === -1)
                    continue;

                const query3 = `INSERT INTO ep_peli (ottelu, kp, vp) VALUES (?, ?, ?)`;
                let [insertedRow] = await connection.query(query3, match.games[k]);
                // Liitetään rounds taulukkoon lisätyn rivin id:
                if ('insertId' in insertedRow)
                    rounds[k][0] = insertedRow.insertId;
                else 
                    throw new CustomError("INTERNAL_SERVER_ERROR", { info: "Pelin lisäys epäonnistui.", matchId: match.id });

                console.log("ep_peli insertId", match.id, insertedRow.insertId);

                // Lisätään uusi rivi tauluun ep_erat:
                const query4_1 = `INSERT INTO ep_erat (peli, era1, era2, era3, era4, era5) VALUES (?, ?, ?, ?, ?, ?)`;
                await connection.query(query4_1, rounds[k]);

                const query4_2 = `CALL procedure_update_all_old_from_erat(?, ?)`;
                await connection.query(query4_2, [rounds[k][0], updateRankingStats]);
            }

            // Muutetaan ottelun päivämäärä ja status:
            const query5 = `UPDATE ep_ottelu SET paiva = ?, status = ? WHERE id = ?`;
            await connection.query(query5, [match.date, match.newStatus, match.id]);

            await connection.commit();
            endLiveMatch(match.id, match.newStatus, match.originalData);
            logger.info("commit in submitMatchResult", { matchId: match.id });
        } catch (error) {
            await connection.rollback();
            logger.warn("rollback in submitMatchResult", { matchId: match.id });
            throw error;
        } finally {
            connection.destroy();       // TEHOTONTA! Käytetään vain Azure SQL ongelmien takia
            // connection.release();
        }
    } catch (error) {
        // Tässä ei tarvitse log, GEH hoitaa sen.
        // TODO Poista tarpeettomana
        throw error;
    } finally {
        // Poistetaan lukko jos se saatiin
        if (lockAcquired)
            releaseMatchLock(match.id);
    }
}

/**
 * Lisää uuden pelaajan joukkueeseen.
 * TODO Tässä tulisi tarkistaa että kyseessä on runkosarja, mutta ei tarkisteta.
 * @param params - Sisältää kentät teamId (ep_joukkue.id), name, sex.
 */
async function addPlayer(params: Record<string, any>, auth: AuthTokenPayload | null) {
    // Miten autentikaatio tulisi tarkistaa tässä? Käyttäjän tulee pystyä lisäämään
    // tarvittaessa pelaaja vierasjoukkueeseenkin pöytäkirjan ilmoituksen yhteydessä.
    if (!auth)
        throw new CustomError("UNAUTHORIZED");
    if (!params.teamId || !params.name || typeof params.name !== "string")
        throw Error('Missing player info.');
    const name = removeSpecialChars(params.name.trim()).slice(0, 15);
    if (!name)
        throw Error('Invalid player name.');

    // Tämä testataan myös React-puolella, mutta varmuuden vuoksi tarkistetaan ettei nimeä vielä ole
    const query1 = `SELECT * FROM ep_pelaaja WHERE UPPER(TRIM(nimi))=UPPER(TRIM(?)) AND joukkue=?`;
    const namesakes = await myQuery(pool, query1, [name, params.teamId]);
    if (!Array.isArray(namesakes) || namesakes.length > 0)
        throw Error('Player name already exists.');

    const sex = (params.sex === 'M' || params.sex === 'N') ? params.sex : '-';
    const query2 = `INSERT INTO ep_pelaaja (nimi, joukkue, sukupuoli) VALUES (?, ?, ?)`;
    return myQuery(pool, query2, [name, params.teamId, sex]);
}

/**
 * Hakee listan käyttäjistä userpw taulusta.
 * HUOM! Tämä on vain testikäyttöön, poista production vaiheessa.
 */
async function getUsers(_params: Record<string, any>, _auth: AuthTokenPayload | null) {
    const query = `SELECT Nimi, Joukkue FROM userpw`;
    return myQuery(pool, query);
}

/**
 * Hakee listan lohkoista, joilla Laji='r'.
 */
async function getGroups(_params: Record<string, any>, _auth: AuthTokenPayload | null) {
    const query = `
        SELECT l.id, k.vuosi, k.kausi, k.Laji, l.tunnus, l.selite
        FROM 
            ep_kausi AS k
            JOIN ep_lohko AS l ON l.kausi = k.id
        WHERE 
            k.Laji = 'r'
        ORDER BY
            l.id ASC
    `;
    const data = await myQuery(pool, query);
    return data;
}

/**
 * Pudotuspelien apufunktio. Hakee kaikki pudotuspelien ottelut.
 * 
 * TODO lohko tulisi jotenkin tarkistaa pudotuspelilohkoksi.
 */
async function getPlayoffMatches(params: Record<string, any>) {
    if (!params.lohko)
        throw Error(`Missing parameter "lohko".`);
    const query = `
        SELECT o.id AS id, o.koti, o.vieras, j1.lyhenne AS k_nimi, j2.lyhenne AS v_nimi, 
            o.ktulos, o.vtulos, o.paiva,
            COALESCE(CAST(SUM(p.ktulos) AS SIGNED), 0) AS k_erat, 
            COALESCE(CAST(SUM(p.vtulos) AS SIGNED), 0) AS v_erat
        FROM 
            ep_ottelu AS o
            LEFT JOIN ep_peli AS p ON p.ottelu = o.id
            JOIN ep_joukkue AS j1 ON o.koti = j1.id
            JOIN ep_joukkue AS j2 ON o.vieras = j2.id
        WHERE
            o.lohko = ?
        GROUP BY 
            o.id
        LIMIT 64
    `;
    return myQuery(pool, query, [params.lohko]);
}

/**
 * Pudotuspelien apufunktio. Hakee tiedot ep_cup taulusta.
 * 
 * TODO lohko tulisi jotenkin tarkistaa pudotuspelilohkoksi.
 */
async function getPlayoffBracket(params: Record<string, any>) {
    if (!params.lohko)
        throw Error(`Missing parameter "lohko".`);
    const query = `
        SELECT koti, vier AS vieras
        FROM 
            ep_cup25
        WHERE
            puoli = 'A'
        ORDER BY
            id
    `;
    return myQuery(pool, query, [params.lohko]);
}

export { getMatchInfo, getMatchesToReport, getMatchesToReportModerator,
    getPlayersInTeam, getScores, getResultsTeams, 
    getResultsPlayers, submitMatchResult, addPlayer, 
    getUsers, getGroups, getPlayoffMatches, getPlayoffBracket };