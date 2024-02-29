/**
 * Tämä komponentti vastaa yhden pelin kirjaamisesta ottelun ilmoittamiseen.
 */

import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography, styled } from '@mui/material';
import { checkGameResults, computeGameScore, gameIndexToPlayerIndexes } from '../../utils/matchLoader';
import './GameDialog.css';
// import { useSnackbar } from '../../utils/SnackbarContext';

const CustomTable = styled(Table)({
    // border: '2px solid black',
    borderCollapse: 'collapse',
});
  
const CustomTableCell = styled(TableCell)({
    border: '2px solid black',
    paddingTop: "8px",
    paddingBottom: "8px",
    paddingLeft: "2px",
    paddingRight: "2px",
    minWidth: "36px",
    maxWidth: "70px",
    overflow: "hidden",
});

const CustomHeadTableCell = styled(TableCell)({
    border: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
});

const CustomTypography = styled(Typography)({
    textAlign: "center",
});

const CustomNameTypography = styled(Typography)({
    textAlign: "center",
    // maxWidth: "50px",
    textWrap: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    padding: 0,
    margin: 0,
});

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

type GameDialogState = {
    isOpen: boolean;
    gameIndex?: number;
    roundIndex?: number;
};

type GameDialogProps = {
    state: GameDialogState;
    formFields: FormFields;
    onClose: () => void;
    onSubmit: (gameIndex: number, gameResults: string[][]) => void;
};

const GameDialog: React.FC<GameDialogProps> = ({ state, formFields, onClose, onSubmit }) => {
    const [results, setResults] = useState<string[][]>([[" ", " ", " ", " ", " "], [" ", " ", " ", " ", " "]])
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [currentRound, setCurrentRound] = useState<number>(0);

    const [homePlayerIndex, awayPlayerIndex] = gameIndexToPlayerIndexes(state.gameIndex!);
    const playerHome = formFields.teamHome.selectedPlayers[homePlayerIndex]?.name;
    const playerAway = formFields.teamAway.selectedPlayers[awayPlayerIndex]?.name;

    const gameScore = computeGameScore(results);
    const invalidResult = checkGameResults(results);

    let isFinished = (currentRound >= 5);
    if (gameScore[0] >= 3 || gameScore[1] >= 3) {
        // Tarkistetaan, että loput eristä on tyhjiä:
        isFinished = true;
        for (let k = currentRound; k < 5; k++)
            if ((results[0][k] != " ") || (results[1][k] != " "))
                isFinished = false;
    }
    if (invalidResult && isFinished) {
        setErrorMessage(invalidResult);
        setCurrentRound(0);
    }

    const setRoundResult = (round: number, playerIndex: number, result: string) => {
        if (round < 0 || round >= 5)
            return;
        const newResults = JSON.parse(JSON.stringify(results));
        newResults[playerIndex][round] = result;
        newResults[1-playerIndex][round] = " ";
        setResults(newResults);
        if (result != " ")
            setCurrentRound(round+1);
        setErrorMessage("");
    }

    useEffect(() => {
        setCurrentRound(state.roundIndex ?? 0);
        setResults(formFields.scores[state.gameIndex ?? 0]);
    }, [state]);

    console.log("GameDialog: formFields", formFields);
    console.log("GameDialog: results", results);
    console.log("GameDialog: state", state);

    return (
        <>
        <Dialog open={state.isOpen} onClose={onClose}>
            <DialogTitle>{`${formFields.teamHome.teamName} - ${formFields.teamAway.teamName}, peli ${state.gameIndex!+1}`}</DialogTitle>
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
                        {`Syötä pelin ${state.gameIndex!+1} erän ${currentRound+1} tulos:`}
                    </Typography>
                    <Button variant="outlined" size="small" onClick={() => setRoundResult(currentRound, 0, " ")}>
                        {`Tyhjää erä ${currentRound+1}`}
                    </Button>
                </Box>

                {/* Nimi ja nappulat kotipelaajalle: */}
                <Box>
                    <Box display="flex" justifyContent="space-around" marginTop={2} gap="20px">
                        <Box>
                            <Typography maxWidth="200px" textAlign="center">
                                Ylärivi
                            </Typography>
                            <hr />
                            <Typography maxWidth="200px" textAlign="center" fontWeight="bold">
                                {playerHome}
                                <br />
                                {formFields.teamHome.teamName} (koti)
                            </Typography>
                        </Box>
                        {/* Kotipelaajan nappulat tässä: */}
                        <Box display="flex" flexDirection="column" gap="10px">
                            <Box width="100%">
                                <Typography maxWidth="200px">
                                    {`Erän ${currentRound+1} kotivoitto:`}
                                </Typography>
                            </Box>
                            <Box display="flex" gap="15px" justifyContent="center">
                                <Button variant="outlined" onClick={() => setRoundResult(currentRound, 0, "A")}>A</Button>
                                <Button variant="outlined" onClick={() => setRoundResult(currentRound, 0, "C")}>C</Button>
                                <Button variant="outlined" onClick={() => setRoundResult(currentRound, 0, "V")}>V</Button>
                            </Box>
                            <Box display="flex" gap="15px" justifyContent="center">
                                <Button variant="outlined" onClick={() => setRoundResult(currentRound, 0, "1")}>1</Button>
                                <Button variant="outlined" onClick={() => setRoundResult(currentRound, 0, "9")}>9</Button>
                                <Button variant="outlined" onClick={() => setRoundResult(currentRound, 0, "K")}>K</Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>
                </>}

                {/* Taulu tuloksille */}
                <CustomTable sx={{mt: 1}}>
                    <TableHead>
                        <TableRow>
                            <CustomHeadTableCell>
                                <CustomNameTypography variant="body2">
                                    Pelaaja
                                </CustomNameTypography>
                            </CustomHeadTableCell>
                            {[0, 1, 2, 3, 4].map((index) => 
                                <CustomHeadTableCell key={index} className={(index == currentRound && !isFinished) ? "active" : ""} onClick={() => setCurrentRound(index)}>
                                    <CustomTypography variant="body2">
                                        {`Erä ${index+1}`}
                                    </CustomTypography>
                                </CustomHeadTableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow sx={{height: "50px"}}>
                            <CustomTableCell width="50px">
                                <CustomNameTypography variant="body2" fontWeight="bold">
                                    {playerHome}
                                </CustomNameTypography>
                            </CustomTableCell>
                            {[0, 1, 2, 3, 4].map((index) => 
                                <CustomTableCell key={index} className={(index == currentRound && !isFinished) ? "active" : ""} onClick={() => setCurrentRound(index)}>
                                    <CustomTypography variant="body1" fontWeight="bold">
                                        {`${results[0][index] ?? -1}`}
                                    </CustomTypography>
                                </CustomTableCell>
                            )}
                        </TableRow>
                        <TableRow sx={{height: "50px"}}>
                            <CustomTableCell>
                                <CustomNameTypography variant="body2" fontWeight="bold">
                                    {playerAway}
                                </CustomNameTypography>
                            </CustomTableCell>
                            {[0, 1, 2, 3, 4].map((index) => 
                                <CustomTableCell key={index} className={(index == currentRound && !isFinished) ? "active" : ""} onClick={() => setCurrentRound(index)}>
                                    <CustomTypography variant="body1" fontWeight="bold">
                                        {`${results[1][index] ?? -1}`}
                                    </CustomTypography>
                                </CustomTableCell>
                            )}
                        </TableRow>
                    </TableBody>
                </CustomTable>
                {(errorMessage) &&
                <Box sx={{mt: 2}}>
                    <Typography variant="body1" color="error">
                        Virhe! {`${errorMessage}`}
                    </Typography>
                </Box>
                }

                {/* Nimi ja nappulat vieraspelaajalle */}
                {!isFinished &&
                <Box>
                    <Box display="flex" justifyContent="space-around" marginTop={2} gap="20px">
                        <Box>
                            <Typography maxWidth="200px" textAlign="center">
                                Alarivi
                            </Typography>
                            <hr />
                            <Typography maxWidth="200px" textAlign="center" fontWeight="bold">
                                {playerAway}
                                <br />
                                {formFields.teamAway.teamName} (vieras)
                            </Typography>
                        </Box>
                        {/* Vieraspelaajan nappulat tässä: */}
                        <Box display="flex" flexDirection="column" gap="10px">
                            <Box width="100%">
                                <Typography maxWidth="200px">
                                    {`Erän ${currentRound+1} vierasvoitto:`}
                                </Typography>
                            </Box>
                            <Box display="flex" gap="15px" justifyContent="center">
                                <Button variant="outlined" onClick={() => setRoundResult(currentRound, 1, "1")}>1</Button>
                                <Button variant="outlined" onClick={() => setRoundResult(currentRound, 1, "9")}>9</Button>
                                <Button variant="outlined" onClick={() => setRoundResult(currentRound, 1, "K")}>K</Button>
                            </Box>
                            <Box display="flex" gap="15px" justifyContent="center">
                                <Button variant="outlined" onClick={() => setRoundResult(currentRound, 1, "A")}>A</Button>
                                <Button variant="outlined" onClick={() => setRoundResult(currentRound, 1, "C")}>C</Button>
                                <Button variant="outlined" onClick={() => setRoundResult(currentRound, 1, "V")}>V</Button>
                            </Box>
                        </Box>
                    </Box>
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
                                        {playerHome} (ylärivi)
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
                                        {playerAway} (alarivi)
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


            </DialogContent>
            <DialogActions>
                <Button variant="contained" color="error" onClick={onClose}>
                    Peruuta
                </Button>
                <Button variant="contained" color="primary" onClick={() => onSubmit(state.gameIndex!, results)}>
                    Kirjaa peli
                </Button>
            </DialogActions>
        </Dialog>
        </>
    );
};

export default GameDialog;
