/** 
 * AddPlayerModal on modaalinen ikkuna, joka avataan Scoresheet päälle
 * pelaajan lisäämiseksi joukkueeseen.
 */

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import TextField from '@mui/material/TextField';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

type Player = {
    id: number;
    name: string;
};

type Team = {
    teamName: string;
    teamRole: "home" | "away";
    allPlayers: (Player | null)[];
    selectedPlayers: (Player | null)[];
};

type AddPlayerModalProps = {
    isOpen: boolean;
    team: Team;
    onClose: () => void;
    onAddPlayer: (newPlayer: Player) => void;
};

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ isOpen, team, onClose, onAddPlayer }) => {
    const [newPlayerName, setNewPlayerName] = useState('');

    const handleAddPlayer = () => {
        if (newPlayerName.trim() === '') {
            return;
        }
// TODO Korjaa!!! Tietokantalisäys ja saat oikean id.
        onAddPlayer({ id: 100+Math.floor(Math.random()*100000), name: newPlayerName });
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={onClose}>
            <DialogTitle>Lisää pelaaja joukkueeseen {team.teamName} ({team.teamRole})</DialogTitle>
            <DialogContent>
                <DialogContentText>Puuttuuko pelaaja listasta? Syötä uuden pelaajan nimi.</DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="name"
                    label="Uuden pelaajan nimi"
                    type="text"
                    fullWidth
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained" color="error">
                    Peruuta
                </Button>
                <Button onClick={handleAddPlayer} variant="contained" color="primary">
                    Lisää pelaaja
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddPlayerModal;
