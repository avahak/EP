/**
 * RoundResultsTable on tuloslomakkeen komponentti, joka sisältää erien tulokset
 * taulukkona.
 */

import { Box, IconButton, Paper, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import GameDialog, { GameDialogState } from "./GameDialog";
import { Fragment, useState } from "react";
import { GameRunningStatRow, gameHasEmptyPlayer, gameIndexToPlayerIndexes, getSelectedPlayerName } from "../../utils/matchTools";
import { BasicGameOnLeftTypography, BasicNameTypography, BasicTable, BasicTableCellLow, BasicTableHeadCell, BasicTypography } from "../general_tables/BasicTableStyles";
import EditIcon from '@mui/icons-material/Edit';
import { ScoresheetFields } from "../../../shared/scoresheetTypes";
import './RoundResultsTable.css';

const PARITY = Array.from({ length: 9 }, (_, k) => (k%2 == 0 ? "even" : "odd"));

type RoundResultsTableProps = {
    isModifiable: boolean;
    displayErrors: boolean;
    formFields: ScoresheetFields;
    onGameDialogSubmit: (gameIndex: number, results: string[][]) => void;
    gameRunningStats: GameRunningStatRow[];
}

/**
 * RoundResultsTable on tuloslomakkeen komponentti, joka sisältää erien tulokset
 * taulukkona.
 */
const RoundResultsTable: React.FC<RoundResultsTableProps> = ({ 
    isModifiable, 
    displayErrors, 
    formFields, 
    onGameDialogSubmit, 
    gameRunningStats 
}) => {
    const [gameDialogState, setGameDialogState] = useState<GameDialogState>({ isOpen: false, gameIndex: 0 });

    /**
     * Kutsutaan, kun GameDialog suljetaan tuloksia kirjaamatta.
     */
    const handleGameDialogClose = () => {
        setGameDialogState({ isOpen: false, gameIndex: 0 });
    };

    /**
     * Kutsutaan, kun GameDialog tulokset halutaan kirjataan.
     */
    const handleGameDialogSubmit = (gameIndex: number, results: string[][]) => {
        // console.log("RoundResultsTable: handleGameDialogSubmit: results", results);
        onGameDialogSubmit(gameIndex, results);
        // setGameDialogState({ isOpen: false });
    };

    /**
     * Returns className string for the row.
     */
    const rowBaseClassName = (gameIndex: number) => {
        return `${(displayErrors && !gameRunningStats[gameIndex].isValidGame) && "error"} ${PARITY[gameIndex]}`;
    }

    return (
    <>
    <TableContainer component={Paper} sx={{px: 0, py: 2, width: "100%"}} elevation={5}>
    <Typography variant="h5" sx={{py: 1}} textAlign="center">Erätulokset</Typography>
    <BasicTable sx={{tableLayout: "fixed"}}>
    <TableHead sx={{borderBottom: "2px solid black"}}>
    <TableRow>
        {/* <BasicTableHeadCell width="12%">
            <BasicTypography variant="body2">
                Peli
            </BasicTypography>
        </BasicTableHeadCell> */}

        <BasicTableHeadCell width="30%">
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

        <BasicTableHeadCell width="15%">
            <BasicTypography variant="body2"> 
                Tilanne<br />K - V
            </BasicTypography>
        </BasicTableHeadCell>

        {isModifiable &&
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
        <Fragment key={`rounds-${gameIndex}`}>
        {Array.from({ length: 2 }, (_, playerIndex) => (
            <TableRow key={`rounds-row-${gameIndex}-${playerIndex}`} sx={{borderBottom: playerIndex == 1 ? "2px solid black" : "", borderTop: playerIndex == 0 ? "2px solid black" : ""}}>
            {/* Peli */}
            {/* {playerIndex == 0 &&
                <BasicTableCellLow className={rowBaseClassName(gameIndex)} rowSpan={2}>
                    <Typography variant="body1" textAlign="center">
                        {`${gameIndexToPlayerIndexes(gameIndex)[0]+1} - ${gameIndexToPlayerIndexes(gameIndex)[1]+1}`}
                    </Typography>
                </BasicTableCellLow>
            } */}

            {/* Pelaaja */}
            <BasicTableCellLow className={rowBaseClassName(gameIndex)} key={`player-${gameIndex}-${playerIndex}`}>
                <Box display="flex" alignItems="center">
                    <BasicGameOnLeftTypography>
                        {`${playerIndex === 0 ? 'K' : 'V'}${gameIndexToPlayerIndexes(gameIndex)[playerIndex]+1}`}
                    </BasicGameOnLeftTypography>
                    <BasicNameTypography>
                        {getSelectedPlayerName(formFields, gameIndex, playerIndex) || "-"}
                    </BasicNameTypography>
                </Box>
            </BasicTableCellLow>

            {/* Erätulokset */}
            {Array.from({ length: 5 }, (_, roundIndex) => (
                <BasicTableCellLow className={rowBaseClassName(gameIndex)} key={`cell2-${gameIndex}-${playerIndex}-${roundIndex}`} sx={{borderLeft: roundIndex == 0 ? "3px solid black" : "1px solid black", borderRight: roundIndex == 4 ? "3px solid black" : "1px solid black"}}>
                    <BasicTypography>
                        {formFields.scores[gameIndex][playerIndex][roundIndex]}
                    </BasicTypography>
                </BasicTableCellLow>
            ))}

            {/* Voitot */}
            <BasicTableCellLow className={`${rowBaseClassName(gameIndex)} ${gameRunningStats[gameIndex].roundWins[playerIndex] >= 3 ? "winner" : ""}`} key={`voitot-${gameIndex}-${playerIndex}`}>
                <BasicTypography>
                    {gameRunningStats[gameIndex].roundWins[playerIndex]}
                </BasicTypography>
            </BasicTableCellLow>

            {/* Tilanne */}
            {playerIndex == 0 &&
            <BasicTableCellLow rowSpan={2} className={rowBaseClassName(gameIndex)} key={`running-score-${gameIndex}`}>
                <Typography variant="body1" textAlign="center">
                    {gameRunningStats[gameIndex].isAllGamesValid ? 
                        `${gameRunningStats[gameIndex].runningMatchScore[0]} - ${gameRunningStats[gameIndex].runningMatchScore[1]}`
                        : "-"}
                </Typography>
            </BasicTableCellLow>
            }

            {/* Muokkaa ikoni: */}
            {(isModifiable && playerIndex == 0) &&
            (!gameHasEmptyPlayer(formFields, gameIndex) ? 
            <TableCell 
                sx={{p: 0, width: "40px", border: "1px solid black"}} 
                rowSpan={2} 
                className={rowBaseClassName(gameIndex)} 
                key={`edit-${gameIndex}`}
                onClick={() => setGameDialogState({isOpen: true, gameIndex})}
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
            : <TableCell key={`edit-${gameIndex}`} className={rowBaseClassName(gameIndex)} rowSpan={2}/>)
            }
            </TableRow>
            ))
        }
        {(displayErrors && !gameRunningStats[gameIndex].isValidGame) &&
        <TableRow key={`error-rounds-row-${gameIndex}`}>
            <TableCell colSpan={isModifiable ? 10 : 9} sx={{pt: 0, pb: 2}}>
                <Typography textAlign="center" fontWeight="bold" color="error">
                    {gameRunningStats[gameIndex].gameErrorMessage}
                </Typography>
            </TableCell>
        </TableRow>
        }
        </Fragment>
        ))}
    </TableBody>
    </BasicTable>
    </TableContainer>

    <GameDialog state={gameDialogState} formFields={formFields} onClose={handleGameDialogClose} onSubmit={handleGameDialogSubmit} />
    </>
)};

export { RoundResultsTable };