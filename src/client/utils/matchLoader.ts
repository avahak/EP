import { serverFetch } from "./apiUtils";

type Player = {
    id: number;
    name: string;
};

type Team = {
    id: number;
    teamName: string;
    teamRole: "home" | "away";
    allPlayers: (Player | null)[];
    selectedPlayers: (Player | null)[];
};

type MatchData = {
    id: number;
    oldStatus: string;
    teamHome: Team;
    teamAway: Team;
    date: string;
    scores: string[][][];   // scores[peli][0(koti)/1(vieras)][erä]
};

const scoresDefaultValue = Array.from({ length: 9 }, () => Array.from({ length: 2 }, () => Array.from({ length: 5 }, () => ' ')));

/**
 * Muuttaa tietokannasta saadut erien tulosrivit lomakkeella käytettyyn muotoon.
 */
function parseScores(rawScores: any, teamHome: (Player | null)[], teamAway: (Player | null)[]) {
    const results = JSON.parse(JSON.stringify(scoresDefaultValue)); // "deep copy" trikki
    for (const row of rawScores) {
        let indexHome = teamHome.findIndex((player) => player?.id == row.kp);
        let indexAway = teamAway.findIndex((player) => player?.id == row.vp);
        if (indexHome == -1 || indexAway == -1)
            continue;
        for (let k = 0; k < 5; k++) {
            const result = row[`era${k+1}`];
            results[(9-indexHome*2+indexAway*3) % 9][result[0] == 'K' ? 0 : 1][k] =
                [' ', '1', 'A', '9', 'K', 'C', 'V'][parseInt(result[1])];
        }
    }
    return results;
}

/**
 * Hakee pelaajat joukkueeseen sen id:n perusteella.
 */
const fetchPlayers = async (teamId: number) => {
    console.log("ID", teamId);
    try {
        const response = await serverFetch("/db/specific_query", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ queryName: "get_players_in_team", params: { teamId: teamId } }),
        });
        if (!response.ok) 
            throw new Error(`HTTP error! Status: ${response.status}`);
        const jsonData = await response.json();
        return jsonData.rows;
    } catch(error) {
        console.error('Error:', error);
    }
};

/**
 * Hakee erien tulokset käytyyn otteluun.
 */
const fetchScores = async (matchId: number) => {
    try {
        const response = await serverFetch("/db/specific_query", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ queryName: "get_scores", params: { matchId: matchId } }),
        });
        if (!response.ok) 
            throw new Error(`HTTP error! Status: ${response.status}`);
        const jsonData = await response.json();
        return jsonData.rows;
    } catch(error) {
        console.error('Error:', error);
    }
};

/**
 * Hakee ottelun tiedot taulusta ep_ottelu.
 */
const fetchMatchInfo = async (matchId: number) => {
    try {
        const response = await serverFetch("/db/specific_query", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ queryName: "get_match_info", params: { matchId: matchId } }),
        });
        if (!response.ok) 
            throw new Error(`HTTP error! Status: ${response.status}`);
        const jsonData = await response.json();
        return jsonData.rows[0];
    } catch(error) {
        console.error('Error:', error);
    }
};

/**
 * Hakee joukkueiden pelaajat ja erien tulokset.
 */
const fetchMatchData = async (matchId: number) => {
    const matchInfo = await fetchMatchInfo(matchId) 
    const playersHome = await fetchPlayers(matchInfo.homeId);
    const playersAway = await fetchPlayers(matchInfo.awayId);
    const rawScores = await fetchScores(matchInfo.id);

    console.log("matchInfo", matchInfo);
    console.log("playersHome fetch: ", playersHome);
    console.log("playersAway fetch: ", playersAway);
    console.log("rawScores fetch: ", rawScores);

    const idToName: (id: number, players: Player[]) => string = (id, players) => {
        const index = players.findIndex((player) => player.id == id);
        return (index == -1) ? "" : players[index].name;
    }

    const playingHome: Player[] = [];
    const playingAway: Player[] = [];
    for (const row of rawScores) {
        const playerHome = { id: row.kp, name: idToName(row.kp, playersHome) };
        const playerAway = { id: row.vp, name: idToName(row.vp, playersAway) };
        let indexHome = playingHome.findIndex((player) => player.id == row.kp);
        let indexAway = playingAway.findIndex((player) => player.id == row.vp);
        if (indexHome == -1) {
            indexHome = playingHome.length;
            playingHome.push(playerHome);
        }
        if (indexAway == -1) {
            indexAway = playingAway.length;
            playingAway.push(playerAway);
        }
    }

    console.log("playingHome", playingHome);
    console.log("playingAway", playingAway);

    return {
        id: matchId,
        oldStatus: matchInfo.status,
        teamHome: {
            id: matchInfo.homeId,
            teamName: matchInfo.home,
            teamRole: "home",
            allPlayers: playersHome,
            selectedPlayers: playingHome
        }, teamAway: {
            id: matchInfo.awayId,
            teamName: matchInfo.away,
            teamRole: "away",
            allPlayers: playersAway,
            selectedPlayers: playingAway
        }, 
        date: matchInfo.date,
        scores: parseScores(rawScores, playingHome, playingAway)
    } as MatchData;
};


export { fetchMatchData };