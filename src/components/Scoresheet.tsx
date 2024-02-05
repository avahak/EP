import { useForm, SubmitHandler } from "react-hook-form";
import './Scoresheet.css';

/**
 * NOTE: ottelu=match, peli=game, erä=round
 */

const OUTCOMES = ["1", "A", "C", "K", "V", "9"];

type FormFields = {
    teamHome: string;
    teamAway: string;
    date: Date | undefined;
    playersHome: string[];
    playersAway: string[];
    scores: string[][][];   // indexing: scores[game][player][round
}

const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectElement = event.target;
    const hasSelection = selectElement.value !== ' ';
    if (hasSelection)
        selectElement.classList.add('modified');
    else
        selectElement.classList.remove('modified');
};

// function validateScore(score: string) {
//     const allowedChars = ["A", "C", "K", "V", "1", "9"];
//     return (allowedChars.includes(score) && (score.length === 1));
// }

const Scoresheet: React.FC = () => {
    const { register, handleSubmit, watch } = useForm<FormFields>({
        defaultValues: {
            teamHome: '',
            teamAway: '',
            date: undefined,
            playersHome: ['', '', ''],
            playersAway: ['', '', ''],
            scores: Array.from({ length: 9 }, () => Array.from({ length: 2 }, () => Array.from({ length: 5 }, () => ''))),
        },
    });

    const onSubmit: SubmitHandler<FormFields> = (data) => {
        console.log(data);
    }

    const scores = watch('scores');
    const playersHome = watch('playersHome');
    const playersAway = watch('playersAway');

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
            <tbody>
                {scores.map((_game, gameIndex) => (
                Array.from({ length: 2 }, (_, playerIndex) => (
                    <tr key={`row-${gameIndex}-${playerIndex}`}>
                    {/* Peli */}
                    {playerIndex == 0 ? 
                        <td className="cell1" rowSpan={2} style={{ fontSize: '16px', fontWeight: 'bold' }}>
                            {gameIndex % 3 + 1} - {(gameIndex+Math.floor(gameIndex/3)) % 3 + 1}
                        </td>
                        : <></>
                    }

                    {/* Pelaaja */}
                    <td className="cell2 player-name" key={`player-${gameIndex}-${playerIndex}`}>
                        {playerIndex == 0 ? playersHome[gameIndex % 3] : playersAway[(gameIndex+Math.floor(gameIndex/3)) % 3]}
                    </td>

                    {/* Erätulokset */}
                    {Array.from({ length: 5 }, (_, roundIndex) => (
                        <td className="cell3" key={`cell-${gameIndex}-${playerIndex}-${roundIndex + 500}`}>
                        <select
                            {...register(
                            `scores.${gameIndex}.${playerIndex}.${roundIndex}` as const
                            )}
                            onChange={handleSelectChange}
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
                    <td className="cell4" key={`voitot-${gameIndex}-${playerIndex}`}>
                        1
                    </td>

                    {/* Tilanne */}
                    <td className="cell5" key={`tilanne-${gameIndex}-${playerIndex}`}>
                        x - x
                    </td>

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