/**
 * Kokoelma ottelupöytäkirjoja käsitteleviä apufunktioita, missä ottelupöytäkirja
 * on ScoresheetFields muodossa. Sisältää funktioita ottelupöytäkirjan tarkistamiseen,
 * pisteiden laskuun, ja funktioita API-kutsuille pelaajien ja tulosten hakemiseen.
 * 
 * HUOM! TODO Tämä tulisi refaktoroida ja yhdistää shared/parseMatch.ts kanssa, jotta
 * pöytäkirjadatan käsittely olisi yhtenäisempää. Lisäksi API-kutsut voisi erottaa
 * omaksi kokonaisuudeksi.
 */

import { ScoresheetFields, ScoresheetPlayer, createEmptyScores } from "../../shared/scoresheetTypes";
import { serverFetch } from "./apiUtils";

// Odotetut tulokset kun yksi tai molemmat pelaajat ovat tyhjiä:
const PLAYER_1_EMPTY_SCORES = JSON.stringify([[' ',' ',' ',' ',' '], ['1','1','1',' ',' ']]);
const PLAYER_2_EMPTY_SCORES = JSON.stringify([['1','1','1',' ',' '], [' ',' ',' ',' ',' ']]);
const BOTH_PLAYERS_EMPTY_SCORES = JSON.stringify([[' ',' ',' ',' ',' '], [' ',' ',' ',' ',' ']]);

/**
 * Tyyppi väliaikatulosten tallennukseen, sisältää tuloksen jos kaikki on ok
 * ja muutoin tietoa virheistä.
 */
type GameRunningStatRow = {
    isValidGame: boolean;           // onko kyseinen peli validi?
    isAllGamesValid: boolean;       // onko kaikki pelit tähän asti valideja? 
    roundWins: number[];            // voitettujen erien lkm kummallekin pelaajalle
    runningMatchScore: number[];    // ottelun tilanne pelin jälkeen
    gameErrorMessage: string;       // virheilmoitus ei-validille pelille
};

/**
 * Palauttaa tekstin, joka kuvaa ottelun statusta.
 */
function statusDescription(status: string): string {
    if (status === "T") 
        return "Tuleva ottelu";
    if (status === "K") 
        return "Kotijoukkueen ilmoittama";
    if (status === "W") 
        return "Vierasjoukkueen ilmoittama";
    if (status === "V") 
        return "Vierasjoukkueen korjaama";
    if (status === "L") 
        return "Kotijoukkueen korjaama";
    if (status === "M") 
        return "Molempien joukkueiden vahvistama";
    if (status === "H") 
        return "Tulosvastaavan vahvistama";
    return "Tuntematon status";
}

/**
 * Palauttaa pelaajan players[index] nimen jos ei tyhjä ja defaultName muutoin.
 */
const getPlayerName = (players: (ScoresheetPlayer | null)[], index: number, defaultName: string) => {
    const player = players[index];
    if (!!player)
        return player.name;
    return `${defaultName} ${index+1}`;
}

/**
 * Palauttaa tekstin pelaajan nimelle.
 */
const getSelectedPlayerName = (results: ScoresheetFields, gameIndex: number, playerIndex: number) => {
    const selectedPlayers = playerIndex == 0 ? results.teamHome.selectedPlayers : results.teamAway.selectedPlayers;
    const defaultText = playerIndex == 0 ? "Koti" : "Vieras";
    return getPlayerName(selectedPlayers, gameIndexToPlayerIndexes(gameIndex)[playerIndex], defaultText);
};

/** 
 * Palauttaa true joss pelaaja on tyhjä.
 */
const isEmptyPlayer = (formFields: ScoresheetFields, gameIndex: number, playerIndex: number) => {
    const name = getSelectedPlayerName(formFields, gameIndex, playerIndex);
    return (!name || name === "-");
};

/** 
 * Palauttaa true joss jompikumpi pelaajista on tyhjä.
 */
const gameHasEmptyPlayer = (results: ScoresheetFields, gameIndex: number) => {
    return (isEmptyPlayer(results, gameIndex, 0)) || (isEmptyPlayer(results, gameIndex, 1));
};

/**
 * Muuttaa pelin indeksin (0-8) koti- ja vieraspelaajan indekseiksi (0-2) samassa
 * järjestyksessä kuin ottelupöytäkirjassa.
 * @returns Taulukko [playerHomeIndex, playerAwayIndex].
 */
function gameIndexToPlayerIndexes(gameIndex: number) {
    return [gameIndex % 3, (gameIndex+Math.floor(gameIndex/3)) % 3];
};

/**
 * Muuttaa pelin koti- ja vieraspelaajan indeksit (0-2) pelin indeksiksi (0-8) samassa
 * järjestyksessä kuin ottelupöytäkirjassa.
 */
function playerIndexesToGameIndex(playerHomeIndex: number, playerAwayIndex: number) {
    return (9-playerHomeIndex*2+playerAwayIndex*3) % 9;
};

/**
 * Palauttaa yhden pelin lopputuloksen muodossa [koti erävoitot, vieras erävoitot].
 */
function computeGameScore(results: string[][]) {
    let gameScore = [0, 0];
    for (let playerIndex = 0; playerIndex < 2; playerIndex++) {
        let playerRoundWins = 0;
        for (let roundIndex = 0; roundIndex < 5; roundIndex++) {
            if (results[playerIndex][roundIndex] != " ")
                playerRoundWins += 1;
        }
        gameScore[playerIndex] = playerRoundWins;
    }
    return gameScore;
}

/**
 * Tarkistaa, että erien tulokset ovat oikein ja peli päättyy kolmeen voittoon.
 * Palauttaa tekstimuotoisen kuvauksen ongelmasta, jos jokin on pielessä.
 */
function checkGameResults(gameResult: string[][], playerId1: number, playerId2: number) {
    if (playerId1 == -1 && playerId2 == -1) 
        return (JSON.stringify(gameResult) != BOTH_PLAYERS_EMPTY_SCORES) ? 
            "Virheellinen tulos." : "";
    if (playerId1 == -1)
        return (JSON.stringify(gameResult) != PLAYER_1_EMPTY_SCORES) ? 
            "Virheellinen tulos." : "";
    if (playerId2 == -1)
        return (JSON.stringify(gameResult) != PLAYER_2_EMPTY_SCORES) ?
            "Virheellinen tulos." : "";

    let firstEmptyRound = 5;
    let gameFinishedRound = 5;
    let score = [0, 0];
    for (let k = 0; k < 5; k++) {
        for (let playerIndex = 0; playerIndex < 2; playerIndex++)
            if (gameResult[playerIndex][k] != " ")
                score[playerIndex] += 1;
        if (score[0] >= 3 || score[1] >= 3)
            gameFinishedRound = Math.min(k, gameFinishedRound);

        if (gameResult[0][k] == " " && gameResult[1][k] == " ")
            firstEmptyRound = Math.min(k, firstEmptyRound);
        else {
            if (k > firstEmptyRound)
                return "Pelissä on tyhjä erä.";
            if (k > gameFinishedRound)
                return "Pelissä on liikaa eriä.";
        }
    }
    if (score[0] == 0 && score[1] == 0)
        return "Erätulokset ovat tyhjiä.";
    if (score[0] < 3 && score[1] < 3)
        return "Kumpikaan pelaaja ei yltänyt kolmeen voittoon.";
    return "";
}

/**
 * Palauttaa taulukon, missä kutakin pelin indeksiä (0-8) vastaa GameRunningStatRow.
 * Kukin GameRunningStatRow sisältää väliaikatilanteen ja tietoa validointivirheistä.
 */
function computeGameRunningStats(data: ScoresheetFields): GameRunningStatRow[] {
    const stats: GameRunningStatRow[] = [];
    let runningMatchScore = [0, 0];
    let isAllGamesValid = true;
    for (let gameIndex = 0; gameIndex < 9; gameIndex++) {
        const playerIndexes = gameIndexToPlayerIndexes(gameIndex);
        const gameErrorMessage = checkGameResults(data.scores[gameIndex], data.teamHome.selectedPlayers[playerIndexes[0]]?.id ?? -1, data.teamAway.selectedPlayers[playerIndexes[1]]?.id ?? -1);
        const isValidGame = !gameErrorMessage;
        isAllGamesValid = isAllGamesValid && isValidGame;

        let roundWins = [0, 0];
        for (let playerIndex = 0; playerIndex < 2; playerIndex++) {
            let playerRoundWins = 0;
            for (let roundIndex = 0; roundIndex < 5; roundIndex++) {
                if (data.scores[gameIndex][playerIndex][roundIndex] != " ")
                    playerRoundWins += 1;
            }
            roundWins[playerIndex] = playerRoundWins;
        }

        // Jos yksikään peli tähän asti on virheellinen, 
        // niin runningMatchScore arvoksi asetetaan [-1, -1].
        if (!isValidGame || runningMatchScore[0] == -1)
            runningMatchScore = [-1, -1];
        else {
            if (roundWins[0] > roundWins[1])
                runningMatchScore[0] += 1;
            else if (roundWins[1] > roundWins[0])
                runningMatchScore[1] += 1;
        }

        stats.push({ isValidGame, roundWins, runningMatchScore: [...runningMatchScore], isAllGamesValid, gameErrorMessage });
    }
    return stats;
}

/**
 * Palauttaa viimeisimmän kirjatun tilanteen, missä kaikki pelit siihen asti 
 * on valideja.
 */
function currentScore(data: ScoresheetFields) {
    const runningStats = computeGameRunningStats(data);
    let score = [0, 0];
    for (let k = 0; k < 9; k++) {
        if (runningStats[k].runningMatchScore[0] != -1)
            score = runningStats[k].runningMatchScore;
    }
    return score;
}

/**
 * Muuttaa tietokannasta saadut erien tulosrivit lomakkeella käytettyyn muotoon.
 */
function parseScores(rawScores: any, teamHome: (ScoresheetPlayer | null)[], teamAway: (ScoresheetPlayer | null)[]) {
    const results = createEmptyScores();
    for (const row of rawScores) {
        let indexHome = teamHome.findIndex((player) => player?.id === row.kp);
        let indexAway = teamAway.findIndex((player) => player?.id === row.vp);
        if (indexHome === -1 || indexAway === -1)
            continue;
        const gameIndex = playerIndexesToGameIndex(indexHome, indexAway);
        for (let k = 0; k < 5; k++) {
            const result = row[`era${k+1}`];
            if ((typeof result === "string" || result instanceof String) 
                    && (result.length === 2) && (result[0] === 'K' || result[0] === 'V')) {
                const playerIndex = (result[0] === 'K') ? 0 : 1;
                let num = parseInt(result[1]);
                if (num >= 1 && num <= 6)
                    results[gameIndex][playerIndex][k] = [' ', '1', 'A', '9', 'K', 'C', 'V'][num];
            }
        }
    }
    return results;
}

/**
 * Hakee tietokannasta pelaajat joukkueeseen sen id:n perusteella.
 */
const fetchPlayers = async (teamId: number) => {
    try {
        const response = await serverFetch("/api/db/specific_query", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ queryName: "get_players_in_team", params: { teamId: teamId } }),
        }, null);
        if (!response.ok) 
            throw new Error(`HTTP error! Status: ${response.status}`);
        const jsonData = await response.json();
        return jsonData.rows;
    } catch(error) {
        console.error('Error:', error);
    }
};

/**
 * Hakee tietokannasta erien tulokset käytyyn otteluun.
 */
const fetchScores = async (matchId: number) => {
    try {
        const response = await serverFetch("/api/db/specific_query", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ queryName: "get_scores", params: { matchId: matchId } }),
        }, null);
        if (!response.ok) 
            throw new Error(`HTTP error! Status: ${response.status}`);
        const jsonData = await response.json();
        // console.log("scores", jsonData.rows);
        return jsonData.rows;
    } catch(error) {
        console.error('Error:', error);
    }
};

/**
 * Hakee ottelun tiedot tietokannan taulusta ep_ottelu.
 */
const fetchMatchInfo = async (matchId: number) => {
    try {
        const response = await serverFetch("/api/db/specific_query", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ queryName: "get_match_info", params: { matchId: matchId } }),
        }, null);
        if (!response.ok) 
            throw new Error(`HTTP error! Status: ${response.status}`);
        const jsonData = await response.json();
        return jsonData.rows[0];
    } catch(error) {
        console.error('Error:', error);
    }
};

/**
 * Hakee live-ottelun jos sellainen on olemassa.
 */
// const fetchLiveMatch = async (matchId: number): Promise<ScoresheetFields|null> => {
//     try {
//         const response = await serverFetch(`/api/live/get_match/${matchId}`, {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         }, null);
//         if (!response.ok) 
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         const jsonData = await response.json();
//         return jsonData.data;
//     } catch(error) {
//         console.info('No matching live match found.');
//     }
//     return null;
// };

/**
 * Hakee tietokannasta koko ottelun ScoresheetFields muodossa.
 */
const fetchMatchData = async (matchId: number): Promise<ScoresheetFields> => {
    const matchInfo = await fetchMatchInfo(matchId);
    if (!matchInfo)
        throw Error("Match not found.");
    const playersHome = await fetchPlayers(matchInfo.homeId);
    const playersAway = await fetchPlayers(matchInfo.awayId);
    const rawScores = await fetchScores(matchInfo.id);
    
    console.log("matchInfo", matchInfo);
    console.log("playersHome fetch: ", playersHome);
    console.log("playersAway fetch: ", playersAway);
    console.log("rawScores fetch: ", rawScores);

    const idToName: (id: number, players: ScoresheetPlayer[]) => string = (id, players) => {
        const index = players.findIndex((player) => player.id === id);
        return (index === -1) ? "" : players[index].name;
    }

    const playingHome: ScoresheetPlayer[] = [];
    const playingAway: ScoresheetPlayer[] = [];
    for (const row of rawScores) {
        const playerHome = { id: row.kp, name: idToName(row.kp, playersHome) };
        const playerAway = { id: row.vp, name: idToName(row.vp, playersAway) };
        let indexHome = playingHome.findIndex((player) => player.id === row.kp);
        let indexAway = playingAway.findIndex((player) => player.id === row.vp);
        if (indexHome === -1) {
            indexHome = playingHome.length;
            playingHome.push(playerHome);
        }
        if (indexAway === -1) {
            indexAway = playingAway.length;
            playingAway.push(playerAway);
        }
    }

    console.log("playingHome", playingHome);
    console.log("playingAway", playingAway);

    return {
        id: matchId,
        status: matchInfo.status,
        laji: matchInfo.laji,
        teamHome: {
            id: matchInfo.homeId,
            name: matchInfo.home,
            nameFull: matchInfo.homeFull,
            role: "home",
            allPlayers: playersHome,
            selectedPlayers: playingHome
        }, teamAway: {
            id: matchInfo.awayId,
            name: matchInfo.away,
            nameFull: matchInfo.awayFull,
            role: "away",
            allPlayers: playersAway,
            selectedPlayers: playingAway
        }, 
        date: matchInfo.date,
        scores: parseScores(rawScores, playingHome, playingAway),
    } as ScoresheetFields;
};


export type { GameRunningStatRow };
export { statusDescription, getPlayerName, getSelectedPlayerName, computeGameRunningStats, 
    fetchMatchData, gameIndexToPlayerIndexes, playerIndexesToGameIndex, 
    computeGameScore, checkGameResults, currentScore,
    isEmptyPlayer, gameHasEmptyPlayer };