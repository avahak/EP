/**
 * RoundResultsTable on tuloslomakkeen komponentti, joka sisältää erien tulokset.
 */

import { Box, Table, TableBody, TableHead, TableRow, TableCell, Typography, styled } from "@mui/material"
import GameDialog from "./GameDialog";
import { useState } from "react";
import { gameIndexToPlayerIndexes } from "../../utils/matchLoader";

const CustomTableCell = styled(TableCell)({
    padding: 0,
});

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

type RoundResultsTableProps = {
    mode: ScoresheetMode;
    formFields: FormFields;
    onGameDialogSubmit: (gameIndex: number, results: string[][]) => void;
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

const RoundResultsTable: React.FC<RoundResultsTableProps> = ({ mode, formFields, onGameDialogSubmit, roundWins, runningScore }) => {
    const [gameDialogState, setGameDialogState] = useState<{ isOpen: boolean, gameIndex?: number, roundIndex?: number }>({ isOpen: false });

    /**
     * Kutsutaan, kun GameDialog suljetaan tuloksia kirjaamatta.
     */
    const handleGameDialogClose = () => {
        setGameDialogState({ isOpen: false });
    };

    /**
     * Kutsutaan, kun GameDialog tulokset halutaan kirjataan.
     */
    const handleGameDialogSubmit = (gameIndex: number, results: string[][]) => {
        // console.log("RoundResultsTable: handleGameDialogSubmit: results", results);
        onGameDialogSubmit(gameIndex, results);
        setGameDialogState({ isOpen: false });
    };

    return (
    // <div id="table-box">
    <>
    <Box>
    <Table className="game-table" size="small">
    <TableHead>
        <TableRow>
        {/* <th>Peli</th> */}
        <CustomTableCell className="table-head-2">Pelaajan nimi</CustomTableCell>
        <CustomTableCell>1.</CustomTableCell>
        <CustomTableCell>2.</CustomTableCell>
        <CustomTableCell>3.</CustomTableCell>
        <CustomTableCell>4.</CustomTableCell>
        <CustomTableCell>5.</CustomTableCell>
        <CustomTableCell>Voitot</CustomTableCell>
        <CustomTableCell>Tilanne<br />K - V</CustomTableCell>
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
            <CustomTableCell className={`${PARITY[gameIndex]} table-col-2`} key={`player-${gameIndex}-${playerIndex}`}>
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
            </CustomTableCell>

            {/* Erätulokset */}
            {mode == "modify" ? Array.from({ length: 5 }, (_, roundIndex) => (
                <CustomTableCell className={`${PARITY[gameIndex]} table-col-3`} key={`cell-${gameIndex}-${playerIndex}-${roundIndex}`}>
                <select className={formFields.scores[gameIndex][playerIndex][roundIndex] == " " ? "" : "winner"}
                    value={formFields.scores[gameIndex][playerIndex][roundIndex]}
                    onChange={() => console.log("REMOVE THIS")}
                >
                    {POSSIBLE_OUTCOMES.map((outcome, outcomeIndex) => (
                    <option key={outcomeIndex} value={outcome}>
                        {outcome}
                    </option>
                    ))}
                </select>
                </CustomTableCell>
            )) : Array.from({ length: 5 }, (_, roundIndex) => (
                <CustomTableCell className={`${PARITY[gameIndex]} table-col-3`} key={`cell2-${gameIndex}-${playerIndex}-${roundIndex}`}>
                <div style={{width: '25px', textAlign: 'center'}}>{formFields.scores[gameIndex][playerIndex][roundIndex]}</div>
                </CustomTableCell>
            ))}

            {/* Voitot */}
            <CustomTableCell className={`${roundWins[gameIndex][playerIndex] >= 3 ? "winner" : ""} ${PARITY[gameIndex]} table-col-4`} key={`voitot-${gameIndex}-${playerIndex}`}>
                {roundWins[gameIndex][playerIndex]}
            </CustomTableCell>

            {/* Tilanne */}
            {playerIndex == 0 ? 
            <CustomTableCell rowSpan={2} className={`${PARITY[gameIndex]} table-col-5`} key={`running-score-${gameIndex}-${playerIndex}`}>
                {runningScore[gameIndex][0] >= 0 ? 
                `${runningScore[gameIndex][0]} - ${runningScore[gameIndex][1]}`
                : " - "}
            </CustomTableCell>
            : <></>}

            </TableRow>))
        ))}
    </TableBody>
    </Table>
    </Box>

    <GameDialog state={gameDialogState} formFields={formFields} onClose={handleGameDialogClose} onSubmit={handleGameDialogSubmit} />
    </>
)};

export { RoundResultsTable };