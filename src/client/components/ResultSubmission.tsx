/**
 * Sivu tulosten ilmoittamiseksi. Ensin valitaan ottelu käyttäen 
 * MatchChooser komponenttia. Jos kyseessä on kotiottelu niin esitetään
 * Scoresheet (mode='modify') täytettäväksi ja vierasottelun tapauksessa
 * esitetään Scoresheet (mode='verify') hyväksyttäväksi.
 */

// import { Scoresheet } from "./Scoresheet";
import { useState } from "react";
import { MatchChooser } from "./MatchChooser";
import { Scoresheet } from "./Scoresheet";
import { getApiUrl } from "../utils/apiUtils";
import { useNavigate } from "react-router-dom";

type Player = {
    id: number;
    name: string;
};

type MatchChooserSubmitFields = {
    match: any;
    date: string;
};

type Team = {
    teamName: string;
    teamRole: "home" | "away";
    allPlayers: (Player | null)[];
    selectedPlayers: (Player | null)[];
};

type ResultFields = {
    teamHome: Team;
    teamAway: Team;
    date: string;
    scores: string[][][];   // scores[peli][0(koti)/1(vieras)][erä]
};

const emptyTeam: Team = {
    teamName: '',
    teamRole: "home",
    allPlayers: [],
    selectedPlayers: [],
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
 * Tulosten ilmoitussivu.
 */
const ResultSubmission: React.FC = () => {
    const [result, setResult] = useState<ResultFields>({
        teamHome: {...emptyTeam, teamRole: "home"},
        teamAway: {...emptyTeam, teamRole: "away"},
        date: '',
        scores: [...scoresDefaultValue],
    });
    const [pageState, setPageState] = useState<string>("choose_match");

    const navigate = useNavigate();

    /**
     * Tätä funktiota kutsutaan kun käyttäjä lähettää täytetyn/muokatun Scoresheet lomakkeen.
     */
    const handleSubmit = (_data: ResultFields) => {
        // Tässä tulisi tehdä INSERT/UPDATE tietokantakyselyitä
        navigate("/");
    }

    /**
     * Tämä kutsutaan kun vierasjoukkueen edustaja hylkää kotijoukkueen antamat tulokset ja
     * haluaa tehdä niihin muutoksia.
     */
    const handleReject = () => {
        setPageState("scoresheet_modify");
    }

    /**
     * Hakee pelaajat joukkueeseen sen lyhenteen perusteella.
     */
    const fetchPlayers = async (teamAbbr: string) => {
        try {
            const apiUrl = `${getApiUrl()}/db/get_players_in_team`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ teamAbbr }),
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
            const apiUrl = `${getApiUrl()}/db/get_scores`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ matchId }),
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
     * Hakee joukkueiden pelaajat ja erien tulokset ja asettaa ne result tilamuuttujaan.
     */
    const fetchTeamData = async (match: any, date: string) => {
        const playersHome = await fetchPlayers(match.home);
        const playersAway = await fetchPlayers(match.away);
        const rawScores = await fetchScores(match.id);

        const idToName: (id: number, players: Player[]) => string = (id, players) => {
            const index = players.findIndex((player) => player.id == id);
            return (index == -1) ? "" : players[index].name;
        }

        console.log("playersHome fetch: ", playersHome);
        console.log("playersAway fetch: ", playersAway);
        console.log("rawScores fetch: ", rawScores);

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

        setResult({ ...result, teamHome: {
                teamName: match.home,
                teamRole: "home",
                allPlayers: playersHome,
                selectedPlayers: playingHome
            }, teamAway: {
                teamName: match.away,
                teamRole: "away",
                allPlayers: playersAway,
                selectedPlayers: playingAway
            }, 
            date: date,
            scores: parseScores(rawScores, playingHome, playingAway)
        });
        console.log("result set");
    };

    /**
     * Tämä funktio kutsutaan kun MatchChooser valinta tehdään.
     */
    const matchChooserCallback = async ({match, date}: MatchChooserSubmitFields) => {
        await fetchTeamData(match, date);
        console.log("result", result);
        if (match.status == 'T')
            setPageState("scoresheet_fresh");
        else 
            setPageState("scoresheet_verify");
        console.log("callback", match, date);
    };
    
    console.log("pageState", pageState);
    console.log("result", result);

    return (
        <div>
        {/* Valitaan ottelu: */}
        {pageState == "choose_match" && 
            <MatchChooser userTeam={"FX1"} submitCallback={matchChooserCallback} />}
        {/* Kotijoukkue kirjaa tulokset: */}
        {pageState == "scoresheet_fresh" && 
            <Scoresheet initialValues={result} mode="modify" 
                submitCallback={(data) => handleSubmit(data)} rejectCallback={() => {}}/>}
        {/* Vierasjoukkue tarkistaa tulokset: */}
        {pageState == "scoresheet_verify" && 
            <Scoresheet initialValues={result} mode="verify" 
                submitCallback={(data) => handleSubmit(data)} rejectCallback={() => {handleReject()}}/>}
        {/* Vierasjoukkue haluaa tehdä muutoksia tuloksiin: */}
        {pageState == "scoresheet_modify" && 
            <Scoresheet initialValues={result} mode="modify" 
                submitCallback={(data) => handleSubmit(data)} rejectCallback={() => {}}/>}
        </div>
    );
}

export { ResultSubmission };