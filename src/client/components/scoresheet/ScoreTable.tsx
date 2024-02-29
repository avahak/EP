/**
 * ScoreTable on tuloslomakkeen komponentti, joka sisältää erien tulokset.
 */

import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material"
import GameDialog from "./GameDialog";
import { useState } from "react";
import { gameIndexToPlayerIndexes } from "../../utils/matchLoader";
// import './Scoresheet.css';

const PARITY = Array.from({ length: 9 }, (_, k) => (k%2 == 0 ? "even" : "odd"));
// Erän mahdolliset lopputulokset pelaajalle:
const POSSIBLE_OUTCOMES = ["1", "A", "C", "K", "V", "9", " "];

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

type FormFields = {
    id: number;
    oldStatus: string;
    teamHome: Team;
    teamAway: Team;
    date: string;
    scores: string[][][];   // scores[peli][0(koti)/1(vieras)][erä]
};

type ScoresheetMode = "modify" | "verify" | "display";

type ScoreTableProps = {
    mode: ScoresheetMode;
    formFields: FormFields;
    handleSelectOutcome: (event: React.ChangeEvent<HTMLSelectElement>, gameIndex: number, playerIndex: number, roundIndex: number) => void;
    runningScore: number[][];
    roundWins: number[][];
}

/**
 * Palauttaa pelaajan players[index] nimen jos ei tyhjä ja defaultName muutoin.
 */
const playerName = (players: (Player | null)[], index: number, defaultName: string) => {
    const player = players[index];
    if (!!player)
        return player.name;
    return `${defaultName} ${index+1}`;
}

const ScoreTable: React.FC<ScoreTableProps> = ({ mode, formFields, handleSelectOutcome, roundWins, runningScore }) => {
    const [gameDialogState, setGameDialogState] = useState<{ isOpen: boolean, gameIndex?: number, roundIndex?: number }>({ isOpen: false });

    // Kutsutaan, kun GameDialog muutokset hyväksytään
    const gameDialogCallback = () => {
        setGameDialogState({ isOpen: false });
    };

    return (
    // <div id="table-box">
    <>
    <Box>
    <Table className="game-table">
    <TableHead>
        <TableRow>
        {/* <th>Peli</th> */}
        <TableCell className="table-head-2">Pelaajan nimi</TableCell>
        <TableCell>1.</TableCell>
        <TableCell>2.</TableCell>
        <TableCell>3.</TableCell>
        <TableCell>4.</TableCell>
        <TableCell>5.</TableCell>
        <TableCell>Voitot</TableCell>
        <TableCell>Tilanne<br />K - V</TableCell>
        </TableRow>
    </TableHead>
    <TableBody>
        {formFields.scores.map((_game, gameIndex) => (
        Array.from({ length: 2 }, (_, playerIndex) => (
            <TableRow key={`row-${gameIndex}-${playerIndex}`} onClick={() => setGameDialogState({isOpen: true, gameIndex, roundIndex: 0})}>
            {/* Peli */}
            {/* {playerIndex == 0 &&
                <td className={`${PARITY[gameIndex]} table-col-1`} rowSpan={2} style={{ fontSize: '1.25em', fontWeight: 'bold' }}>
                    {gameIndex % 3 + 1} - {(gameIndex+Math.floor(gameIndex/3)) % 3 + 1}
                </td>} */}

            {/* Pelaaja */}
            <TableCell className={`${PARITY[gameIndex]} table-col-2`} key={`player-${gameIndex}-${playerIndex}`}>
                {playerIndex == 0 ? 
                    <Box display="flex">
                        {/* <Typography paddingX="5px" variant="body1">{gameIndex % 3 + 1}.</Typography> */}
                        <Box flexGrow="1" display="flex" justifyContent="center">
                            <Typography variant="body1">{playerName(formFields.teamHome.selectedPlayers, gameIndexToPlayerIndexes(gameIndex)[0], "Kotipelaaja")}</Typography>
                        </Box>
                    </Box>
                    : 
                    <>
                    <Box display="flex">
                        {/* <Typography paddingX="5px" variant="body1">{(gameIndex+Math.floor(gameIndex/3)) % 3 + 1}.</Typography> */}
                        <Box flexGrow="1" display="flex" justifyContent="center">
                            <Typography variant="body1">{playerName(formFields.teamAway.selectedPlayers, gameIndexToPlayerIndexes(gameIndex)[1], "Vieraspelaaja")}</Typography>
                        </Box>
                    </Box>
                    </>}
            </TableCell>

            {/* Erätulokset */}
            {mode == "modify" ? Array.from({ length: 5 }, (_, roundIndex) => (
                <TableCell className={`${PARITY[gameIndex]} table-col-3`} key={`cell-${gameIndex}-${playerIndex}-${roundIndex}`}>
                <select className={formFields.scores[gameIndex][playerIndex][roundIndex] == " " ? "" : "winner"}
                    value={formFields.scores[gameIndex][playerIndex][roundIndex]}
                    onChange={(event) => handleSelectOutcome(event, gameIndex, playerIndex, roundIndex)}
                >
                    {POSSIBLE_OUTCOMES.map((outcome, outcomeIndex) => (
                    <option key={outcomeIndex} value={outcome}>
                        {outcome}
                    </option>
                    ))}
                </select>
                </TableCell>
            )) : Array.from({ length: 5 }, (_, roundIndex) => (
                <TableCell className={`${PARITY[gameIndex]} table-col-3`} key={`cell2-${gameIndex}-${playerIndex}-${roundIndex}`}>
                <div style={{width: '25px', textAlign: 'center'}}>{formFields.scores[gameIndex][playerIndex][roundIndex]}</div>
                </TableCell>
            ))}

            {/* Voitot */}
            <TableCell className={`${roundWins[gameIndex][playerIndex] >= 3 ? "winner" : ""} ${PARITY[gameIndex]} table-col-4`} key={`voitot-${gameIndex}-${playerIndex}`}>
                {roundWins[gameIndex][playerIndex]}
            </TableCell>

            {/* Tilanne */}
            {playerIndex == 0 ? 
            <TableCell rowSpan={2} className={`${PARITY[gameIndex]} table-col-5`} key={`running-score-${gameIndex}-${playerIndex}`}>
                {runningScore[gameIndex][0] >= 0 ? 
                `${runningScore[gameIndex][0]} - ${runningScore[gameIndex][1]}`
                : " - "}
            </TableCell>
            : <></>}

            </TableRow>))
        ))}
    </TableBody>
    </Table>
    </Box>

    <GameDialog state={gameDialogState} formFields={formFields} onClose={gameDialogCallback} />
    </>
)};

export { ScoreTable };