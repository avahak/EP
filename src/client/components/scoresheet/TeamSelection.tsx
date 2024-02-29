import { Box, FormControl, InputLabel, MenuItem, Paper, Select, SelectChangeEvent, Typography } from "@mui/material";
import React from "react";

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

type ScoresheetMode = "modify" | "verify" | "display";

/**
 * Luo joukkueen valintaan liittyvät elementit: joukkueen nimi
 * ja pelaajien valintaan käytettävät select-elementit.
 */
const TeamSelection: React.FC<{ mode: ScoresheetMode, team: Team, handleSelectPlayer: (event: SelectChangeEvent<any>, team: Team, playerIndex: number) => any }> = ({ mode, team, handleSelectPlayer }) => {
    const teamText = (team.teamRole == "home") ? "Kotijoukkue" : "Vierasjoukkue";
    const playerText = (team.teamRole == "home") ? "Kotipelaaja" : "Vieraspelaaja";
    // const defaultOptionText = (team.teamRole == "home") ? "Valitse kotipelaaja" : "Valitse vieraspelaaja";
    console.log("team", team);
    return (
        <Box>
        <Paper sx={{ m: 1 }} elevation={10}>
            <Box sx={{ p: 1 }}>
            {/* Joukkuen nimi */}
            <Typography variant="body1" textAlign="center" fontWeight="bold" sx={{mb: 1}}>
                {teamText}&nbsp;
                {!!team.teamName ? team.teamName : "-"}
            </Typography>

            {mode == "modify" && [0, 1, 2].map((playerIndex) => (
                <Box key={`pelaaja-select-${playerIndex}`} sx={{ py: 1 }}>
                <FormControl fullWidth size="small" error={!team.selectedPlayers[playerIndex]?.id}>
                    <InputLabel id="pelaaja-label">{`${playerText} ${playerIndex+1}`}</InputLabel>
                    <Select
                        labelId="pelaaja-label"
                        id="pelaaja"
                        value={`${team.selectedPlayers[playerIndex]?.id ?? ''}`}
                        onChange={(event, _child) => handleSelectPlayer(event, team, playerIndex)}
                        label={`${playerText} ${playerIndex+1}`}
                    >
                        {team.allPlayers.map((playerOption, playerOptionIndex) => (
                            playerOption &&
                            <MenuItem 
                                key={`player-option-${playerOptionIndex}`}
                                value={`${playerOption.id}`}
                                disabled={(playerOption.id != team.selectedPlayers[playerIndex]?.id) && (team.selectedPlayers.map((player) => player?.id).includes(playerOption.id))}
                            >
                                {playerOption.name}
                            </MenuItem>
                        ))}
                        <MenuItem value="newPlayer">Lisää uusi pelaaja</MenuItem>
                    </Select>
                </FormControl>
                </Box>
            ))}
            {mode != "modify" && [0, 1, 2].map((playerIndex) => (
                <Box key={`pelaaja-select-${playerIndex}`} sx={{ py: 1 }}>
                    <Typography variant="body1">{playerIndex+1}. {team.selectedPlayers[playerIndex]?.name ?? ''}</Typography>
                </Box>
            ))}
            </Box>
        </Paper>
        </Box>
    );
};

// {[0, 1, 2].map((playerIndex) => (
//     <label key={`label-${playerIndex}`}>{playerIndex+1}. {team.selectedPlayers[playerIndex]?.name ?? ''}</label>
// ))}
// </> }

export { TeamSelection };