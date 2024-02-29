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
import { gameIndexToPlayerIndexes } from '../../utils/matchLoader';
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
    paddingLeft: 0,
    paddingRight: 0,
});

const CustomHeadTableCell = styled(TableCell)({
    border: 0,
    paddingBottom: 0,
});

const CustomTypography = styled(Typography)({
    textAlign: "center",
    minHeight: "1.5rem",
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
    // onAccept: (..) => void;
};

// @ts-ignore
const GameDialog: React.FC<GameDialogProps> = ({ state, formFields, onClose }) => {
    const [results, setResults] = useState<string[][]>([[" ", " ", " ", " ", " "], [" ", " ", " ", " ", " "]])
    const [currentRound, setCurrentRound] = useState<number>(0);
    const [homePlayerIndex, awayPlayerIndex] = gameIndexToPlayerIndexes(state.gameIndex!);
    const playerHome = formFields.teamHome.selectedPlayers[homePlayerIndex]?.name;
    const playerAway = formFields.teamAway.selectedPlayers[awayPlayerIndex]?.name;

    const setRoundResult = (round: number, playerIndex: number, result: string) => {
        const newResults = JSON.parse(JSON.stringify(results));
        newResults[playerIndex][round] = result;
        newResults[1-playerIndex][round] = " ";
        setResults(newResults);
        setCurrentRound(currentRound+1);
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
            <DialogTitle>{`Peli ${state.gameIndex!+1}`}</DialogTitle>
            <DialogContent>
                <Box display="flex" justifyContent="space-between">
                    <Typography variant="body1">
                        {`Syötä pelin ${state.gameIndex!+1} erän ${currentRound+1} tulos:`}
                    </Typography>
                    <Button variant="outlined" size="small" onClick={() => setRoundResult(currentRound, 0, " ")}>
                        {`Tyhjää erä ${currentRound+1}`}
                    </Button>
                </Box>
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
                                    {`Merkkaa erän ${currentRound+1} kotivoitto:`}
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
                <CustomTable>
                    <TableHead>
                        <TableRow>
                            {[0, 1, 2, 3, 4].map((index) => 
                                <CustomHeadTableCell key={index} className={index == currentRound ? "active" : ""} onClick={() => setCurrentRound(index)}>
                                    <CustomTypography variant="body2">
                                        {`Erä ${index+1}`}
                                    </CustomTypography>
                                </CustomHeadTableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            {[0, 1, 2, 3, 4].map((index) => 
                                <CustomTableCell key={index} className={index == currentRound ? "active" : ""} onClick={() => setCurrentRound(index)}>
                                    <CustomTypography variant="body1" fontWeight="bold">
                                        {`${results[0][index] ?? -1}`}
                                    </CustomTypography>
                                </CustomTableCell>
                            )}
                        </TableRow>
                        <TableRow>
                            {[0, 1, 2, 3, 4].map((index) => 
                                <CustomTableCell key={index} className={index == currentRound ? "active" : ""} onClick={() => setCurrentRound(index)}>
                                    <CustomTypography variant="body1" fontWeight="bold">
                                        {`${results[1][index] ?? -1}`}
                                    </CustomTypography>
                                </CustomTableCell>
                            )}
                        </TableRow>
                    </TableBody>
                </CustomTable>
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
                        {/* Kotipelaajan nappulat tässä: */}
                        <Box display="flex" flexDirection="column" gap="10px">
                            <Box width="100%">
                                <Typography maxWidth="200px">
                                    {`Merkkaa erän ${currentRound+1} kotivoitto:`}
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
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained" color="error">
                    Peruuta
                </Button>
                <Button variant="contained" color="primary">
                    Kirjaa peli
                </Button>
            </DialogActions>
        </Dialog>
        </>
    );
};

export default GameDialog;
