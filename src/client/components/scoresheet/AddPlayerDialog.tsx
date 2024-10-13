/** 
 * AddPlayerDialog on dialog ikkuna, joka avataan Scoresheet päälle
 * pelaajan lisäämiseksi joukkueeseen.
 */

import React, { useContext, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import TextField from '@mui/material/TextField';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { serverFetch } from '../../utils/apiUtils';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { SnackbarContext } from '../../contexts/SnackbarContext';
import { ScoresheetPlayer, ScoresheetTeam } from '../../../shared/scoresheetTypes';
import { AuthenticationContext } from '../../contexts/AuthenticationContext';

type AddPlayerDialogProps = {
    isOpen: boolean;
    team: ScoresheetTeam;
    onClose: () => void;
    onAddPlayer: (newPlayer: ScoresheetPlayer) => void;
};

type Sex = "-" | "M" | "N";

/** 
 * AddPlayerDialog on dialog ikkuna, joka avataan Scoresheet päälle
 * pelaajan lisäämiseksi joukkueeseen.
 */
const AddPlayerDialog: React.FC<AddPlayerDialogProps> = ({ isOpen, team, onClose, onAddPlayer }) => {
    const authenticationState = useContext(AuthenticationContext);
    const [newPlayerName, setNewPlayerName] = useState<string>('');
    const [newPlayerSex, setNewPlayerSex] = useState<Sex>('-');
    const setSnackbarState = useContext(SnackbarContext);

    /**
     * Lisää uuden pelaajan tietokantaan.
     * @returns Uuden pelaajan id tai -1.
     */
    const fetchAddPlayer = async (teamId: number, name: string, sex: Sex) => {
        console.log("fetchAddPlayer()");
        try {
            const response = await serverFetch("/api/db/specific_query", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ queryName: "add_player", params: { teamId: teamId, name: name, sex: sex } }),
            }, authenticationState);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            const jsonData = await response.json();
            if (!jsonData.rows.insertId)
                throw new Error(`Player insert failed`);

            console.log("jsonData.rows", jsonData.rows);

            setSnackbarState({ isOpen: true, message: `Pelaaja ${name} lisätty joukkueeseen ${team.name}.`, severity: "success" });
            return jsonData.rows.insertId;
        } catch(error) {
            console.error('Error:', error);
            setSnackbarState({ isOpen: true, message: "Pelaajan lisäys epäonnistui.", severity: "error" });
            return -1;
        }
    };

    /**
     * Kutsutaan kun "lisää pelaaja" nappia painetaan.
     * Tarkistaa, että nimeä ei vielä ole.
     */
    const handleAddPlayer = async () => {
        if (newPlayerName.trim() === '')
            return;
        for (const otherPlayer of team.allPlayers) {
            if (!otherPlayer)
                continue;
            if (newPlayerName.trim().toUpperCase() === otherPlayer.name.trim().toUpperCase()) {
                setSnackbarState({ isOpen: true, message: "Pelaajan lisäys epäonnistui: samanniminen pelaaja on jo.", severity: "error" });
                return;
            }
        }
        const playerId = await fetchAddPlayer(team.id, newPlayerName, newPlayerSex);
        if (playerId !== -1) {
            onAddPlayer({ id: playerId, name: newPlayerName });
            setNewPlayerName("");
            setNewPlayerSex("-");
            onClose();
        }
    };

    return (
        <>
        <Dialog open={isOpen} onClose={onClose}>
            <DialogTitle>Lisää pelaaja joukkueeseen {team.name} ({team.role == "home" ? "koti" : "vieras"})</DialogTitle>
            <DialogContent>
                <DialogContentText>Puuttuuko pelaaja listasta? Syötä uuden pelaajan tiedot.</DialogContentText>
                <Box display="flex">
                    <Box flexGrow="1">
                        <TextField
                            autoFocus
                            margin="dense"
                            id="name"
                            label="Pelaajan nimi"
                            type="text"
                            fullWidth
                            value={newPlayerName}
                            inputProps={{ maxLength: 16 }}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                        />
                    </Box>
                    <Box>
                        {/* Miksi m: 1 tarvitaan tässä? Ehkä TextField on vakiona m: 1 ja Select ei? */}
                        <FormControl sx={{ m: 1, minWidth: 100 }}>
                            <InputLabel id="player-sex-label">Sukupuoli</InputLabel>
                            <Select
                                labelId="player-sex-label"
                                id="player-sex"
                                value={newPlayerSex}
                                label="Sukupuoli"
                                onChange={(e) => setNewPlayerSex(e.target.value as Sex)}
                            >
                                <MenuItem value="-">-</MenuItem>
                                <MenuItem value="M">M</MenuItem>
                                <MenuItem value="N">N</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
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
        </>
    );
};

export default AddPlayerDialog;
