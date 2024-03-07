/**
 * RoundResultsTable on tuloslomakkeen komponentti, joka sisältää erien tulokset.
 */

import { Box, IconButton, Paper, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import GameDialog from "./GameDialog";
import { useState } from "react";
import { GameRunningStatRow, gameIndexToPlayerIndexes, playerName } from "../../utils/matchTools";
import { BasicNameTypography, BasicTable, BasicTableCellLow, BasicTableHeadCell, BasicTypography } from "../tables/TableStyles";
import EditIcon from '@mui/icons-material/Edit';
import { ScoresheetFields, ScoresheetMode } from "./scoresheetTypes";
import './Scoresheet.css';

const PARITY = Array.from({ length: 9 }, (_, k) => (k%2 == 0 ? "even" : "odd"));

type RoundResultsTableProps = {
    mode: ScoresheetMode;
    formFields: ScoresheetFields;
    onGameDialogSubmit: (gameIndex: number, results: string[][]) => void;
    gameRunningStats: GameRunningStatRow[];
}

const RoundResultsTable: React.FC<RoundResultsTableProps> = ({ mode, formFields, onGameDialogSubmit, gameRunningStats }) => {
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
    <TableContainer component={Paper} sx={{px: 1, py: 2, width: "100%"}} elevation={4}>
    <Typography variant="h5" sx={{py: 1}} textAlign="center">Erätulokset</Typography>
    <BasicTable sx={{tableLayout: "fixed"}}>
    <TableHead sx={{borderBottom: "2px solid black"}}>
    <TableRow>
        <BasicTableHeadCell width="12%">
            <BasicTypography variant="body2">
                Peli
            </BasicTypography>
        </BasicTableHeadCell>

        <BasicTableHeadCell width="25%">
            <BasicTypography variant="body2">
                Pelaaja
            </BasicTypography>
        </BasicTableHeadCell>

        <BasicTableHeadCell width="8%">
            <BasicTypography variant="body2">E1</BasicTypography>
        </BasicTableHeadCell>
        <BasicTableHeadCell width="8%">
            <BasicTypography variant="body2">E2</BasicTypography>
        </BasicTableHeadCell>
        <BasicTableHeadCell width="8%">
            <BasicTypography variant="body2">E3</BasicTypography>
        </BasicTableHeadCell>
        <BasicTableHeadCell width="8%">
            <BasicTypography variant="body2">E4</BasicTypography>
        </BasicTableHeadCell>
        <BasicTableHeadCell width="8%">
            <BasicTypography variant="body2">E5</BasicTypography>
        </BasicTableHeadCell>
        
        <BasicTableHeadCell width="8%">
            <BasicTypography variant="body2">
                V.
            </BasicTypography>
        </BasicTableHeadCell>

        <BasicTableHeadCell width="12%">
            <BasicTypography variant="body2"> 
                Tilanne<br />K - V
            </BasicTypography>
        </BasicTableHeadCell>

        {mode == "modify" &&
        <BasicTableHeadCell width="15%">
            <BasicTypography variant="body2">
                Muokkaa
            </BasicTypography>
        </BasicTableHeadCell>
        }
        </TableRow>
    </TableHead>
    <TableBody>
        {formFields.scores.map((_game, gameIndex) => (
        Array.from({ length: 2 }, (_, playerIndex) => (
            <TableRow key={`row-${gameIndex}-${playerIndex}`} sx={{borderBottom: playerIndex == 1 ? "2px solid black" : ""}}>
            {/* Peli */}
            {playerIndex == 0 &&
                <BasicTableCellLow className={`${PARITY[gameIndex]}`} rowSpan={2}>
                    <Typography variant="body1" textAlign="center">
                        {/* {`${gameIndex+1}. ${gameIndex%2 == 0 ? "K" : "V"}`} */}
                        {`${gameIndexToPlayerIndexes(gameIndex)[0]+1} - ${gameIndexToPlayerIndexes(gameIndex)[0]+1}`}
                    </Typography>
                </BasicTableCellLow>
            }

            {/* Pelaaja */}
            <BasicTableCellLow className={`${PARITY[gameIndex]}`} key={`player-${gameIndex}-${playerIndex}`}>
                {playerIndex == 0 ? 
                    <BasicNameTypography>
                        {playerName(formFields.teamHome.selectedPlayers, gameIndexToPlayerIndexes(gameIndex)[0], "Koti")}
                    </BasicNameTypography>
                    : 
                    <>
                    <BasicNameTypography>
                        {playerName(formFields.teamAway.selectedPlayers, gameIndexToPlayerIndexes(gameIndex)[1], "Vieras")}
                    </BasicNameTypography>
                    </>}
            </BasicTableCellLow>

            {/* Erätulokset */}
            {Array.from({ length: 5 }, (_, roundIndex) => (
                <BasicTableCellLow className={`${PARITY[gameIndex]}`} key={`cell2-${gameIndex}-${playerIndex}-${roundIndex}`} sx={{borderLeft: roundIndex == 0 ? "3px solid black" : "1px solid black", borderRight: roundIndex == 4 ? "3px solid black" : "1px solid black"}}>
                    <BasicTypography>
                        {formFields.scores[gameIndex][playerIndex][roundIndex]}
                    </BasicTypography>
                </BasicTableCellLow>
            ))}

            {/* Voitot */}
            <BasicTableCellLow className={`${gameRunningStats[gameIndex].roundWins[playerIndex] >= 3 ? "winner" : ""} ${PARITY[gameIndex]} table-col-4`} key={`voitot-${gameIndex}-${playerIndex}`}>
                <BasicTypography>
                    {gameRunningStats[gameIndex].roundWins[playerIndex]}
                </BasicTypography>
            </BasicTableCellLow>

            {/* Tilanne */}
            {playerIndex == 0 &&
            <BasicTableCellLow rowSpan={2} className={`${PARITY[gameIndex]}`} key={`running-score-${gameIndex}`}>
                <Typography variant="body1" textAlign="center">
                    {gameRunningStats[gameIndex].isAllGamesValid ? 
                        `${gameRunningStats[gameIndex].runningMatchScore[0]} - ${gameRunningStats[gameIndex].runningMatchScore[1]}`
                        : "-"}
                </Typography>
            </BasicTableCellLow>
            }

            {(mode == "modify" && playerIndex == 0) &&
            <TableCell 
                sx={{p: 0, width: "40px", border: "1px solid black"}} 
                rowSpan={2} 
                className={`${PARITY[gameIndex]}`} 
                key={`edit-${gameIndex}`}
                onClick={() => setGameDialogState({isOpen: true, gameIndex, roundIndex: 0})}
            >
                <Box display="flex" justifyContent="center" sx={{p: 0}}>
                <IconButton 
                    aria-label="Muokkaa" 
                    color={gameRunningStats[gameIndex].isValidGame ? "primary" : "error"}
                    sx={{
                        p: 0,
                        '&:hover': {
                            backgroundColor: '#aaa',
                        },
                    }}
                >
                    <EditIcon fontSize="large"/>
                </IconButton>
                </Box>
            </TableCell>
            }

            </TableRow>))
        ))}
    </TableBody>
    </BasicTable>
    </TableContainer>

    <GameDialog state={gameDialogState} formFields={formFields} onClose={handleGameDialogClose} onSubmit={handleGameDialogSubmit} />
    </>
)};

export { RoundResultsTable };