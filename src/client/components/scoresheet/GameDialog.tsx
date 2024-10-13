/**
 * Tämä komponentti vastaa yhden pelin kirjaamisesta ottelun ilmoittamisen yhteydessä.
 * Komponentti on dialog ikkuna, jossa erätulokset voi kirjata nappeja painamalla.
 */

import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery } from '@mui/material';
import { checkGameResults, computeGameScore, gameIndexToPlayerIndexes } from '../../utils/matchTools';
import { BasicNameTypography, BasicTable, BasicTableCell, BasicTableHeadCell, BasicTypography } from '../general_tables/BasicTableStyles';
import { deepCopy } from '../../../shared/generalUtils';
import { ScoresheetFields } from '../../../shared/scoresheetTypes';
import './GameDialog.css';

type GameDialogState = {
    isOpen: boolean;
    gameIndex: number;
};

type GameDialogProps = {
    state: GameDialogState;
    formFields: ScoresheetFields;
    onClose: () => void;
    onSubmit: (gameIndex: number, gameResults: string[][]) => void;
};

/**
 * Tämä komponentti vastaa yhden pelin kirjaamisesta ottelun ilmoittamisen yhteydessä.
 * Komponentti on dialog ikkuna, jossa erätulokset voi kirjata nappeja painamalla.
 */
const GameDialog: React.FC<GameDialogProps> = ({ state, formFields, onClose, onSubmit }) => {
    const isMinimumM = useMediaQuery('(min-width: 768px)');
    const [currentRound, setCurrentRound] = useState<number>(0);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [isFinished, setIsFinished] = useState<boolean>(false);

    const [homePlayerIndex, awayPlayerIndex] = gameIndexToPlayerIndexes(state.gameIndex);
    const results = formFields.scores[state.gameIndex];
    const playerHome = formFields.teamHome.selectedPlayers[homePlayerIndex]?.name ?? `Koti ${homePlayerIndex+1}`;
    const playerAway = formFields.teamAway.selectedPlayers[awayPlayerIndex]?.name ?? `Vieras ${awayPlayerIndex+1}`

    const gameScore = computeGameScore(results);
    const invalidResult = checkGameResults(results, formFields.teamHome.selectedPlayers[homePlayerIndex]?.id ?? -1, formFields.teamAway.selectedPlayers[awayPlayerIndex]?.id ?? -1);

    /**
     * Asettaa kursorin ensimmäisen tyhjän erän kohdalle.
     */
    const setCurrentRoundAuto = () => {
        let newResults = formFields.scores[state.gameIndex];
        let firstEmptyIndex = 0;
        for (let k = 0; k < 5; k++)
            if ((newResults[0][k] === " ") && (newResults[1][k] === " ")) {
                firstEmptyIndex = k;
                break;
            }
        setCurrentRound(firstEmptyIndex);
    };

    /**
     * Päivittää isFinished ja errorMessage tilat.
     */
    const update = () => {
        const showErrors = (gameScore[0] >= 3 || gameScore[1] >= 3);
        setIsFinished(showErrors && (invalidResult == ""));
        if (!showErrors && errorMessage != "")
            setErrorMessage("");
        if (showErrors && invalidResult != errorMessage)
            setErrorMessage(invalidResult);
    };
    // console.log("currentRound", currentRound);
    // console.log("results", results);
    // console.log("gameScore", gameScore);
    // console.log("homePlayerIndex", homePlayerIndex);
    // console.log("awayPlayerIndex", awayPlayerIndex);
    // console.log("invalidResult", invalidResult);
    // console.log("isFinished", isFinished);
    // console.log("errorMessage", errorMessage);

    /**
     * Asettaa yhden erän tuloksen.
     */
    const setRoundResult = (playerIndex: number, result: string) => {
        if (currentRound < 0 || currentRound >= 5)
            return;
        const newResults = deepCopy(results);
        newResults[playerIndex][currentRound] = result;
        newResults[1-playerIndex][currentRound] = " ";
        // Sen sijaan, että odotettaisiin "kirjaa"-painikkeen klikkausta, välitetään uudet tulokset heti:
        onSubmit(state.gameIndex, newResults);
        if (result !== " ")
            setCurrentRound(round => Math.min(round+1, 4));
        update();
    }

    useEffect(() => {
        console.log("useEffect1");
        setCurrentRoundAuto();
        update();
    }, [state]);

    useEffect(() => {
        console.log("useEffect2");
        update();
    }, [formFields]);

    // console.log("GameDialog: formFields", formFields);
    // console.log("GameDialog: results", results);
    // console.log("GameDialog: state", state);

    return (
        <>
        <Dialog open={state.isOpen} onClose={onClose}>
            <DialogTitle>{`${formFields.teamHome.name} - ${formFields.teamAway.name}, peli ${state.gameIndex+1}`}</DialogTitle>
            <DialogContent>
                {false && 
                <Box sx={{mt: 2}}>
                    <Typography variant="body1">
                        Pelaajat
                    </Typography>
                    <Typography variant="body2">
                        {playerHome}
                    </Typography>
                    <Typography variant="body2">
                        {playerAway}
                    </Typography>
                </Box>
                }
                {!isFinished && <>
                <Box display="flex" justifyContent="space-between">
                    <Typography variant="body1">
                        {`Syötä pelin ${state.gameIndex+1} erän ${currentRound+1} tulos.`}
                    </Typography>
                    <Button variant="contained" size="small" onClick={() => setRoundResult(0, " ")}>
                        {`Tyhjää erä ${currentRound+1}`}
                    </Button>
                </Box>

                {/* Nimi ja nappulat kotipelaajalle: */}
                <Box display="flex" justifyContent="end">
                <Paper component="fieldset" sx={{marginTop: 2, width: "fit-content"}}>
                    <legend>
                        <Typography variant="body2">Kotipelaaja</Typography>
                    </legend>
                    <Typography fontWeight="bold">
                        {playerHome}, {formFields.teamHome.name}
                    </Typography>
                    <Box display="flex" sx={{mt: 1}}>
                        {/* Kotipelaajan nappulat tässä: */}
                        <Box display="flex" flexDirection="column" gap="10px">
                            {/* <Box width="100%">
                                <Typography maxWidth="200px">
                                    {`Erän ${currentRound+1} kotivoitto:`}
                                </Typography>
                            </Box> */}
                            <Box display="flex" gap="15px" justifyContent="center">
                                <Button variant="contained" onClick={() => setRoundResult(0, "A")}>A</Button>
                                <Button variant="contained" onClick={() => setRoundResult(0, "C")}>C</Button>
                                <Button variant="contained" onClick={() => setRoundResult(0, "V")}>V</Button>
                            </Box>
                            <Box display="flex" gap="15px" justifyContent="center">
                                <Button variant="contained" onClick={() => setRoundResult(0, "K")}>K</Button>
                                <Button variant="contained" onClick={() => setRoundResult(0, "9")}>9</Button>
                                <Button variant="contained" onClick={() => setRoundResult(0, "1")}>1</Button>
                            </Box>
                        </Box>
                    </Box>
                </Paper>
                </Box>
                </>}

                {/* Taulu tuloksille */}
                <TableContainer sx={{display: "flex", justifyContent: "center"}}>
                <BasicTable sx={{mt: 2, tableLayout: "fixed", maxWidth: "400px"}}>
                    <TableHead>
                        <TableRow>
                            <BasicTableHeadCell width="40%">
                                <BasicNameTypography variant="body2">
                                    Pelaaja
                                </BasicNameTypography>
                            </BasicTableHeadCell>
                            {[0, 1, 2, 3, 4].map((index) => 
                                <BasicTableHeadCell width="15%" key={index} className={(index == currentRound && !isFinished) ? "active" : ""} onClick={() => setCurrentRound(index)}>
                                    <BasicTypography variant="body2">
                                        {isMinimumM ? `Erä ${index+1}` : `E${index+1}`}
                                    </BasicTypography>
                                </BasicTableHeadCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow sx={{height: "50px"}}>
                            <BasicTableCell>
                                <BasicNameTypography variant="body2" fontWeight="bold">
                                    {playerHome}
                                </BasicNameTypography>
                            </BasicTableCell>
                            {[0, 1, 2, 3, 4].map((index) => 
                                <BasicTableCell key={index} className={(index == currentRound && !isFinished) ? "active" : ""} onClick={() => setCurrentRound(index)}>
                                    <BasicTypography variant="body1" fontWeight="bold">
                                        {`${results[0][index] ?? -1}`}
                                    </BasicTypography>
                                </BasicTableCell>
                            )}
                        </TableRow>
                        <TableRow sx={{height: "50px"}}>
                            <BasicTableCell>
                                <BasicNameTypography variant="body2" fontWeight="bold">
                                    {playerAway}
                                </BasicNameTypography>
                            </BasicTableCell>
                            {[0, 1, 2, 3, 4].map((index) => 
                                <BasicTableCell key={index} className={(index == currentRound && !isFinished) ? "active" : ""} onClick={() => setCurrentRound(index)}>
                                    <BasicTypography variant="body1" fontWeight="bold">
                                        {`${results[1][index] ?? -1}`}
                                    </BasicTypography>
                                </BasicTableCell>
                            )}
                        </TableRow>
                    </TableBody>
                </BasicTable>
                </TableContainer>
                {errorMessage &&
                <Box sx={{mt: 2}}>
                    <Typography variant="body1" color="error">
                        Virhe! {`${errorMessage}`}
                    </Typography>
                </Box>
                }

                {/* Nimi ja nappulat vieraspelaajalle */}
                {!isFinished &&
                <Box display="flex" justifyContent="end">
                <Paper component="fieldset" sx={{marginTop: 2, width: "fit-content"}}>
                    <legend>
                        <Typography variant="body2">Vieraspelaaja</Typography>
                    </legend>
                    <Typography fontWeight="bold">
                        {playerAway}, {formFields.teamAway.name}
                    </Typography>
                    <Box display="flex" sx={{mt: 1}}>
                        {/* Vieraspelaajan nappulat tässä: */}
                        <Box display="flex" flexDirection="column" gap="10px">
                            {/* <Box width="100%">
                                <Typography maxWidth="200px">
                                    {`Erän ${currentRound+1} vierasvoitto:`}
                                </Typography>
                            </Box> */}
                            <Box display="flex" gap="15px" justifyContent="center">
                                <Button variant="contained" onClick={() => setRoundResult(1, "K")}>K</Button>
                                <Button variant="contained" onClick={() => setRoundResult(1, "9")}>9</Button>
                                <Button variant="contained" onClick={() => setRoundResult(1, "1")}>1</Button>
                            </Box>
                            <Box display="flex" gap="15px" justifyContent="center">
                                <Button variant="contained" onClick={() => setRoundResult(1, "A")}>A</Button>
                                <Button variant="contained" onClick={() => setRoundResult(1, "C")}>C</Button>
                                <Button variant="contained" onClick={() => setRoundResult(1, "V")}>V</Button>
                            </Box>
                        </Box>
                    </Box>
                </Paper>
                </Box>
                }

                {/* Lopputulos: */}
                {(isFinished && !errorMessage) && 
                <Box sx={{mt: 0}}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    <Typography variant="body2">
                                        Pelaaja
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        Tulos
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell>
                                    <Typography variant="body2">
                                        {playerHome}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {gameScore[0]}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    <Typography variant="body2">
                                        {playerAway}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {gameScore[1]}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Box>
                }


            {/* "Muokkaa" ja "Sulje" nappulat: */}
            </DialogContent>
            <DialogActions>
                {(isFinished && !errorMessage) && 
                <Button variant="contained" color="primary" onClick={() => { setCurrentRoundAuto(); setIsFinished(false); }}>
                    Muokkaa
                </Button>
                }
                <Button variant="contained" color="primary" onClick={onClose}>
                    Sulje
                </Button>
                {/* <Button variant="contained" color="primary" onClick={() => onSubmit(state.gameIndex, results)}>
                    Kirjaa peli
                </Button> */}
            </DialogActions>
        </Dialog>
        </>
    );
};

export type { GameDialogState };
export default GameDialog;
