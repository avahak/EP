/**
 * Scoresheet form.
 * NOTE: ottelu=match, peli=game, erä=round
 */
import { useForm, SubmitHandler } from "react-hook-form";
// import { useEffect /*, useState*/ } from 'react';
import './Scoresheet.css';
import { useEffect } from "react";

// Possible outcomes of rounds
const OUTCOMES = ["1", "A", "C", "K", "V", "9", " "];

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

const Scoresheet: React.FC = () => {
    const { register, setValue, handleSubmit, watch } = useForm<FormFields>({
        defaultValues: {
            teamHome: '',
            teamAway: '',
            date: undefined,
            playersHome: ['', '', ''],
            playersAway: ['', '', ''],
            scores: Array.from({ length: 9 }, () => Array.from({ length: 2 }, () => Array.from({ length: 5 }, () => ' '))),
        },
    });

    useEffect(() => {
        console.log("useEffect");
    }, []);

    const onSubmit: SubmitHandler<FormFields> = (data) => {
        console.log(data);
    }

    const scores = watch('scores');
    const playersHome = watch('playersHome');
    const playersAway = watch('playersAway');

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

    return (
        <form className="scoresheet" onSubmit={handleSubmit(onSubmit)}>
            <label className="team-label">
                Kotijoukkue:
                <input {...register("teamHome")} type="text" placeholder="kotijoukkue" />
            </label>
            <label className="team-label">
                Vierasjoukkue:
                <input {...register("teamAway")} type="text" placeholder="vierasjoukkue" />
            </label>

            <div className="player-div">
            {playersHome.map((_player, playerIndex) => (
                <div key={playerIndex}>
                    Pelaaja {playerIndex + 1}
                    <input {...register(`playersHome.${playerIndex}` as const)} />
                </div>
            ))}
            </div>

            <div className="player-div">
            {playersAway.map((_player, playerIndex) => (
                <div key={playerIndex}>
                    Pelaaja {playerIndex + 1}
                    <input {...register(`playersAway.${playerIndex}` as const)} />
                </div>
            ))}
            </div>

            {/* Map through game scores dynamically */}
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
                <th>Tilanne<br></br>(K - V)</th>
                </tr>
            </thead>
            <tbody>
                {scores.map((_game, gameIndex) => (
                Array.from({ length: 2 }, (_, playerIndex) => (
                    <tr key={`row-${gameIndex}-${playerIndex}`}>
                    {/* Peli */}
                    {playerIndex == 0 ? 
                        <td className="table-col-1" rowSpan={2} style={{ fontSize: '16px', fontWeight: 'bold' }}>
                            {gameIndex % 3 + 1} - {(gameIndex+Math.floor(gameIndex/3)) % 3 + 1}
                        </td>
                        : <></>
                    }

                    {/* Pelaaja */}
                    <td className="table-col-2" key={`player-${gameIndex}-${playerIndex}`}>
                        {playerIndex == 0 ? 
                            playerName(playersHome, gameIndex % 3, "Kotipelaaja")
                            : playerName(playersAway, (gameIndex+Math.floor(gameIndex/3)) % 3, "Vieraspelaaja")}
                    </td>

                    {/* Erätulokset */}
                    {Array.from({ length: 5 }, (_, roundIndex) => (
                        <td className="table-col-3" key={`cell-${gameIndex}-${playerIndex}-${roundIndex + 500}`}>
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
                    <td className={`${roundWins[gameIndex][playerIndex] >= 3 ? "winner" : ""} table-col-4`} key={`voitot-${gameIndex}-${playerIndex}`}>
                        {roundWins[gameIndex][playerIndex]}
                    </td>

                    {/* Tilanne */}
                    {playerIndex == 0 ? 
                    <td rowSpan={2} className="table-col-5" key={`running-score-${gameIndex}-${playerIndex}`}>
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

            <button type="submit">Lähetä</button>
        </form>
    );
}

export { Scoresheet };