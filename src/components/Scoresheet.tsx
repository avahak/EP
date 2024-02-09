/**
 * Scoresheet form.
 * NOTE: ottelu=match, peli=game, erä=round
 */
import { Link, useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from "react-hook-form";
import React, { useEffect, useState } from "react";
import { ScoreTable } from "./ScoreTable";
import './Scoresheet.css';
import AddPlayerModal from './AddPlayerModal';

// Possible outcomes of rounds
const OUTCOMES = ["1", "A", "C", "K", "V", "9", " "];
const PARITY = Array.from({ length: 9 }, (_, k) => (k%2 == 0 ? "even" : "odd"));

type FormFields = {
    teamHome: string;
    teamAway: string;
    date: Date | undefined;
    playersHome: string[];
    playersAway: string[];
    scores: string[][][];   // indexing: scores[game][player][round]
}

/**
 * Counts and returns the running score and number of rounds won for each game.
 */
const computeDerivedStats = (scores: string[][][]): { runningScore: number[][], roundWins: number[][] } => {
    const runningScore = Array.from({ length: 9 }, () => [0, 0]);
    const roundWins = Array.from({ length: 9 }, () => Array.from({ length: 2 }, () => 0));
    for (let gameIndex = 0; gameIndex < 9; gameIndex++) {
        for (let k = 0; k < 2; k++)
            runningScore[gameIndex][k] = gameIndex == 0 ? 0 : runningScore[gameIndex-1][k];
        for (let playerIndex = 0; playerIndex < 2; playerIndex++) {
            let playerRoundWins = 0;
            for (let roundIndex = 0; roundIndex < 5; roundIndex++) {
                if (scores[gameIndex][playerIndex][roundIndex] != " ")
                    playerRoundWins += 1;
            }
            roundWins[gameIndex][playerIndex] = playerRoundWins;
        }
        // Check if games up to this point have been fully completed, 
        // otherwise do try to compute running score.
        const gamesCompleteUpToThis = (runningScore[gameIndex][0] >= 0) && (Math.max(...roundWins[gameIndex]) >= 3);
        if (gamesCompleteUpToThis) {
            if (roundWins[gameIndex][0] > roundWins[gameIndex][1])
                runningScore[gameIndex][0] += 1;
            else if (roundWins[gameIndex][1] > roundWins[gameIndex][0])
                runningScore[gameIndex][1] += 1;
        } else {
            runningScore[gameIndex] = [-1, -1];
        }
    }
    return { runningScore, roundWins };
}

/**
 * Returns player name playerNames[index] if not empty and defaultName othwise.
 */
const playerName = (playerNames: string[], index: number, defaultName: string) => {
    const name = playerNames[index];
    if (!!name)
        return name;
    return `${defaultName} ${index+1}`;
}

/**
 * Helper function to get today's date in the format YYYY-MM-DD.
 */
// const getTodayDateString = () => {
//     const today = new Date();
//     const year = today.getFullYear();
//     const month = String(today.getMonth() + 1).padStart(2, '0');
//     const day = String(today.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
// };

const Scoresheet: React.FC = () => {
    // isAddPlayerModalOpen tracks if the player add modal is open on top of the form:
    const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
    const scoresDefaultValue = Array.from({ length: 9 }, () => Array.from({ length: 2 }, () => Array.from({ length: 5 }, () => ' ')));
    const { register, setValue, handleSubmit, watch } = useForm<FormFields>({
        defaultValues: {
            teamHome: '',
            teamAway: '',
            date: undefined,
            playersHome: ['', '', ''],
            playersAway: ['', '', ''],
            scores: [...scoresDefaultValue],
        },
    });
    // List of all players (including ones not currently playing) in Home team:
    const [allPlayersHome, setAllPlayersHome] = useState<string[]>([]);
    // List of all players (including ones not currently playing) in Away team:
    const [allPlayersAway, setAllPlayersAway] = useState<string[]>([]);

    const scores = watch('scores');
    // const date = watch('date');
    const playersHome = watch('playersHome');
    const playersAway = watch('playersAway');
    const allFormValues = watch();
    // console.log(date);

    const navigate = useNavigate();

    useEffect(() => {
        console.log("useEffect called");
    }, []);

    // for AddPlayerModal
    const handleOpenAddPlayerModal = () => {
        setIsAddPlayerModalOpen(true);
    }

    // for AddPlayerModal
    const handleCloseAddPlayerModal = () => {
        setIsAddPlayerModalOpen(false);
    }

    // function for AddPlayerModal
    const handleAddPlayer = () => {
        console.log("handleAddPlayer");
    } 

    // This function is called on submit:
    const onSubmit: SubmitHandler<FormFields> = (_data) => {
        navigate("/");
    }

    const { runningScore, roundWins } = computeDerivedStats(scores);

    /**
     * Updates the scores when a selection is made.
     */
    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>, gameIndex: number, playerIndex: number, roundIndex: number) => {
        const selectValue = event.target.value;
        const updatedScores = [...scores];
        updatedScores[gameIndex][playerIndex][roundIndex] = selectValue;
        // If we selected a win, then the opponent win is reset:
        if (selectValue !== " ")
            updatedScores[gameIndex][1-playerIndex][roundIndex] = " ";
        setValue('scores', updatedScores);
    };

    /**
     * Updates the teams in the match.
     */
    const handleSelectMatch = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectValue = event.target.value;
        const parts = selectValue.split("-", 2);
        // parts should always have 2 elements:
        if (parts.length != 2)
            return;
        setValue('teamHome', parts[0]);
        setValue('teamAway', parts[1]);
        // Using placeholder values until we get SQL connection working:
        if (parts[0] == "TH3") {
            setAllPlayersHome(["Matti", "Ville", "Joonas", "Jesse", "Aleksi"]);
            setAllPlayersAway(["Kaisa", "Emmi", "Anne", "Päivi", "Leena"]);
        } else {
            setAllPlayersHome(["Pekka", "Rauno", "Pöde", "Tuomas", "Pete S."]);
            setAllPlayersAway(["Erika", "Kati", "Sanna T", "Tytti", "Ulla"]);
        }
        setValue('playersHome', ['', '', '']);
        setValue('playersAway', ['', '', '']);
    };

    const handleSelectPlayer = (event: React.ChangeEvent<HTMLSelectElement>) => {
        console.log(event);
        if (event.target.value == "newPlayer") {
            console.log("newPlayer selected");
            handleOpenAddPlayerModal();
            event.target.value = "";
        }
    };

    /**
     * creates modal to add new players to a team
     */
    const createAddPlayerModal = () => {
        return (<>
            {/* Render the AddPlayerModal */}
            <AddPlayerModal
                isOpen={isAddPlayerModalOpen}
                onClose={handleCloseAddPlayerModal}
                onAddPlayer={handleAddPlayer}
            />
        </>);
    }

    /**
     * Creates a team selection label and select box.
     */
    const teamSelection = (team: "home" | "away") => {
        const teamName = (team == "home") ? allFormValues.teamHome! : allFormValues.teamAway!;
        const allTeamPlayers = (team == "home") ? allPlayersHome : allPlayersAway;
        const playersText = (team == "home") ? "playersHome" : "playersAway";
        const players = (team == "home") ? playersHome : playersAway;
        const teamText = (team == "home") ? "Kotijoukkue" : "Vierasjoukkue";
        const defaultOptionText = (team == "home") ? "Valitse kotipelaaja" : "Valitse vieraspelaaja";
        console.log("players", players);
        return (<>
        {/* Joukkueen nimi ja pelaajat */}
        <div className="team-select-container">
            {/* Joukkuen nimi */}
            <label className="team-label">{teamText}&nbsp;
            {!!teamName ? teamName : "-"}
            </label>

            {/* Joukkueen pelaajat */}
            {[0, 1, 2].map((playerIndex) => (
                <React.Fragment key={`player-${playerIndex}`}>
                <select disabled={!teamName} defaultValue="" 
                        {...register(`${playersText}.${playerIndex}` as const)}
                        onChange={(event) => {
                            // if React Hook Form implements onChange, run it first: 
                            if (register(`${playersText}.${playerIndex}`).onChange)
                                register(`${playersText}.${playerIndex}`).onChange(event);
                            handleSelectPlayer(event);
                        }}>
                    <option value="" disabled hidden>
                        {`${defaultOptionText} ${playerIndex+1}`}
                    </option>
                    {players}
                    {allTeamPlayers.map((playerOption, playerOptionIndex) => (
                        <option disabled={players.includes(playerOption)} key={`player-option-${playerOptionIndex}`}>
                            {playerOption}
                        </option>
                    ))}
                    <option value="newPlayer">
                        Lisää uusi pelaaja
                    </option>
                </select>
                </React.Fragment>))}
        </div>
        </>)
    };

    /**
     * Creates a table for selecting results.
     */
    const makeTable = () => {
        return (
        <div id="table-box">
        <table className="game-table">
        <thead>
            <tr>
            <th>Peli</th>
            <th className="table-head-2">Pelaajan nimi</th>
            <th>1.</th>
            <th>2.</th>
            <th>3.</th>
            <th>4.</th>
            <th>5.</th>
            <th>Voitot</th>
            <th>Tilanne<br />K - V</th>
            </tr>
        </thead>
        <tbody>
            {scores.map((_game, gameIndex) => (
            Array.from({ length: 2 }, (_, playerIndex) => (
                <tr key={`row-${gameIndex}-${playerIndex}`}>
                {/* Peli */}
                {playerIndex == 0 &&
                    <td className={`${PARITY[gameIndex]} table-col-1`} rowSpan={2} style={{ fontSize: '1.25em', fontWeight: 'bold' }}>
                        {gameIndex % 3 + 1} - {(gameIndex+Math.floor(gameIndex/3)) % 3 + 1}
                    </td>
                }

                {/* Pelaaja */}
                <td className={`${PARITY[gameIndex]} table-col-2`} key={`player-${gameIndex}-${playerIndex}`}>
                    {playerIndex == 0 ? 
                        playerName(playersHome, gameIndex % 3, "Kotipelaaja")
                        : playerName(playersAway, (gameIndex+Math.floor(gameIndex/3)) % 3, "Vieraspelaaja")}
                </td>

                {/* Erätulokset */}
                {Array.from({ length: 5 }, (_, roundIndex) => (
                    <td className={`${PARITY[gameIndex]} table-col-3`} key={`cell-${gameIndex}-${playerIndex}-${roundIndex}`}>
                    <select className={scores[gameIndex][playerIndex][roundIndex] == " " ? "" : "winner"}
                        {...register(
                        `scores.${gameIndex}.${playerIndex}.${roundIndex}` as const
                        )}
                        onChange={(event) => handleSelectChange(event, gameIndex, playerIndex, roundIndex)}
                    >
                        {OUTCOMES.map((outcome, outcomeIndex) => (
                        <option key={outcomeIndex} value={outcome}>
                            {outcome}
                        </option>
                        ))}
                    </select>
                    </td>
                ))}

                {/* Voitot */}
                <td className={`${roundWins[gameIndex][playerIndex] >= 3 ? "winner" : ""} ${PARITY[gameIndex]} table-col-4`} key={`voitot-${gameIndex}-${playerIndex}`}>
                    {roundWins[gameIndex][playerIndex]}
                </td>

                {/* Tilanne */}
                {playerIndex == 0 ? 
                <td rowSpan={2} className={`${PARITY[gameIndex]} table-col-5`} key={`running-score-${gameIndex}-${playerIndex}`}>
                    {runningScore[gameIndex][0] >= 0 ? 
                    `${runningScore[gameIndex][0]} - ${runningScore[gameIndex][1]}`
                    : " - "}
                </td>
                : <></>}

                </tr>
            ))
            ))}
        </tbody>
        </table>
        </div>);
    };

    return (
        <>
        <Link to="/">Back</Link>
        {createAddPlayerModal()}
        <div id="container">
        <div id="scoresheet">
        <form onSubmit={handleSubmit(onSubmit)}>
            {/* Ottelun valinta (TODO) */}
            <label>
            Ottelu (TODO):
            <select onChange={handleSelectMatch} defaultValue="">
                <option value="" disabled hidden>
                    Valitse ottelu
                </option>
                {["TH3-RT4", "OT2-JI3"].map((match, matchIndex) => (
                    <option key={matchIndex} value={match}>
                    {match}
                </option>
                ))}
            </select>
            </label>

            <br />

            {/* Päivämäärä */}
            <label>
            Ottelun päivämäärä:
            <input type="date" {...register('date')} />
            </label>

            <br />

            <div id="table-box-outer">
                <div id="table-box-outer-top">
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        {/* Kotijoukkueen nimi ja pelaajat */}
                        {teamSelection("home")}

                        {/* Vierasjoukkueen nimi ja pelaajat */}
                        {teamSelection("away")}
                    </div>

                    {/* Tuloslaatikko */}
                    <div className="score-table">
                        <ScoreTable roundWins={roundWins} playersHome={playersHome} playersAway={playersAway}></ScoreTable>
                    </div>
                </div>

                {/* Taulukko tulosten kirjaamiseksi */}
                {makeTable()}
            </div>

            <button type="submit">Lähetä</button>
        </form>
        </div>
        </div>
        </>
    );
}

export { Scoresheet };