/**
 * Tämä komponentti vastaa yhden pelin kirjaamisesta ottelun ilmoittamiseen.
 */

import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { Box } from '@mui/material';
// import { useSnackbar } from '../../utils/SnackbarContext';

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

type GameDialogProps = {
    isOpen: boolean;
    formFields: FormFields;
    onClose: () => void;
    // onAccept: (..) => void;
};

// @ts-ignore
const GameDialog: React.FC<GameDialogProps> = ({ isOpen, formFields, onClose }) => {
    // const setSnackbarState = useSnackbar();

    return (
        <>
        <Dialog open={isOpen} onClose={onClose}>
            <DialogTitle>Title here</DialogTitle>
            <DialogContent>
                <DialogContentText>Text here</DialogContentText>
                <Box display="flex">
                    <Box flexGrow="1">
                        X
                    </Box>
                    <Box>
                        Y
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
