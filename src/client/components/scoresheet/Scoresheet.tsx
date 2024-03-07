/**
 * Lomake ottelun tulosten kirjaamiseksi. Käyttäjä valitsee ensin ottelun. Tämän
 * jälkeen käyttäjä voi molempien joukkueiden pelaajat listalta.
 * Pelien tulokset valitaan myös select-elementin avulla ja kirjatut tulokset
 * näkyvät tulostaulussa (ScoreTable.tsx) välittömästi.
 * 
 * Suomennokset: ottelu=match, peli=game, erä=round.
 */
import { useForm, SubmitHandler } from "react-hook-form";
import React, { useEffect, useState } from "react";
import { GameResultsTable } from "./GameResultsTable";
import AddPlayerDialog from './AddPlayerDialog';
import { dateToISOString, getDayOfWeekStrings, toDDMMYYYY } from '../../../shared/generalUtils';
import { Box, Button, Grid, SelectChangeEvent, Typography } from '@mui/material';
// import { parseMatch } from '../../../shared/parseMatch';
import { TeamSelection } from "./TeamSelection";
import { RoundResultsTable } from "./RoundResultsTable";
import { computeGameRunningStats } from "../../utils/matchTools";
import { ScoresheetPlayer, ScoresheetTeam, ScoresheetFields, ScoresheetMode, createEmptyTeam } from "./scoresheetTypes";

/**
 * React komponentti tuloslomakkeelle.
 * @param mode Tuloslomakkeen esitysmuoto, "modify"=muokattava lomake, "verify"=vahvistamisen tarvitseva lomake, "display"=vain tulosten esitys.
 */
const Scoresheet: React.FC<{ initialValues: any, mode: ScoresheetMode, submitCallback?: (data: ScoresheetFields) => void, rejectCallback?: () => void, onChangeCallback?: (data: ScoresheetFields) => void}> = ({initialValues, mode, submitCallback, rejectCallback, onChangeCallback}) => {
    // isAddPlayerDialogOpen seuraa onko modaali pelaajan lisäämiseksi auki:
    const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);
    // currentPlayerSlot on apumuuttuja pitämään kirjaa vimeiseksi muutetusta pelaajasta. 
    // Tätä käytetään selvittämään mikä joukkue ja monesko pelaaja on kyseessä kun 
    // uusi pelaaja lisätään modaalin avulla:
    const [currentPlayerSlot, setCurrentPlayerSlot] = useState<{team: ScoresheetTeam, slot: number}>({team: createEmptyTeam(), slot: 0});
    // Lomakkeen kenttien tila:
    const { setValue, handleSubmit, watch, reset } = useForm<ScoresheetFields>({
        defaultValues: initialValues
    });
    // Käytetään onChageCallback varten tarkistamaan onko muutkoksia tapahtunut:
    const [dataString, setDataString] = useState("");

    const formFields = watch();
    // console.log("initialValues", initialValues);
    // console.log("formFields", formFields);

    // Jos initialValues muuttuu, muutetaan lomakkeen tila siihen, tätä
    // käytetään vain "display"-tilassa.
    useEffect(() => {
        reset(initialValues);
        console.log("Scoresheet useEffect called");
    }, [initialValues]);

    // avaa AddPlayerDialog
    const handleOpenAddPlayerDialog = () => {
        setIsAddPlayerDialogOpen(true);
    }

    // sulkee AddPlayerDialog
    const handleCloseAddPlayerDialog = () => {
        setIsAddPlayerDialogOpen(false);
    }

    // Takaisinkutsufunktio AddPlayerDialog varten:
    const handleAddPlayer = (player: ScoresheetPlayer, team: ScoresheetTeam, slot: number) => {
        console.log("handleAddPlayer", player.name, team);
        console.log("currentPlayerSlot", currentPlayerSlot);
        const isHome = (team.teamRole == "home");
        // const baseTeam = isHome ? formFields.teamHome : formFields.teamAway;
        setValue(isHome ? "teamHome.allPlayers" : "teamAway.allPlayers", [...team.allPlayers, player]);
        setValue(isHome ? `teamHome.selectedPlayers.${slot}` : `teamAway.selectedPlayers.${slot}`, player);
        console.log("handleAddPlayer isHome", isHome);
        console.log("handleAddPlayer allPlayers", isHome ? formFields.teamHome.allPlayers : formFields.teamAway.allPlayers);
        console.log("handleAddPlayer selectedPlayers", isHome ? formFields.teamHome.selectedPlayers : formFields.teamAway.selectedPlayers);
    } 

    /** 
     * Funktio, joka kutsutaan kun lomake lähetetään.
     */
    const onSubmit: SubmitHandler<ScoresheetFields> = (data) => {
        // TODO form validation tässä!
        if (onChangeCallback)
            onChangeCallback({ ...data, isSubmitted: true });
        if (submitCallback) 
            submitCallback({ ...data, isSubmitted: true });
    }

    const gameRunningStats = computeGameRunningStats(formFields.scores);

    /**
     * Kutsutaan kun käyttäjä valitsee erän tuloksen. Päivittää scores taulukkoa.
     */
    // const handleSelectOutcome = (event: React.ChangeEvent<HTMLSelectElement>, gameIndex: number, playerIndex: number, roundIndex: number) => {
    //     const selectValue = event.target.value;
    //     const updatedScores = [...formFields.scores];
    //     updatedScores[gameIndex][playerIndex][roundIndex] = selectValue;
    //     // Jos valitaan voitto, niin vastustajan mahdollinen voitto tulee poistaa:
    //     if (selectValue !== " ")
    //         updatedScores[gameIndex][1-playerIndex][roundIndex] = " ";
    //     setValue('scores', updatedScores);
    // };

    /**
     * Kutsutaan kun käyttäjä valitsee erän tuloksen. Päivittää scores taulukkoa.
     */
    const handleGameDialogSubmit = (gameIndex: number, results: string[][]) => {
        const updatedScores = [...formFields.scores];
        updatedScores[gameIndex] = [...results];
        setValue('scores', updatedScores);
    };

    /**
     * Kutsutaan kun käyttäjä valitsee pelaajan. Jos pelaaja on "newPlayer", 
     * avataan modaali pelaajan lisäämiseksi.
     */
    const handleSelectPlayer = (event: SelectChangeEvent<any>, team: ScoresheetTeam, slot: number) => {
        const value = event.target.value;
        event.target.value = "";
        console.log("handleSelectPlayer", value);
        const isHome = (team.teamRole == "home");
        if (value == "newPlayer") {
            // Tyhjennetään pelaajan valinta:
            setValue(isHome ? `teamHome.selectedPlayers.${slot}` : `teamAway.selectedPlayers.${slot}`, null);
            setCurrentPlayerSlot({team, slot});
            console.log("newPlayer selected, slot: ", slot);
            handleOpenAddPlayerDialog();
        } else {
            setValue(isHome ? `teamHome.selectedPlayers.${slot}` : `teamAway.selectedPlayers.${slot}`, 
                team.allPlayers[team.allPlayers.findIndex((player) => player?.id == parseInt(value))]);
        }
    };

    /**
     * Muutetaan ottelun päivämäärä.
     */
    const handleSetDate = (value: string) => {
        console.log("handleSetDate", value);
        if (value)
            setValue("date", value);
    }

    // Tarkistetaan onko kaikki pelaajat valittu.
    let playersAllSelected = true;
    if (formFields.teamHome.selectedPlayers.length != 3 || formFields.teamAway.selectedPlayers.length != 3)
        playersAllSelected = false;
    if (playersAllSelected) {
        for (let k = 0; k < 3; k++)
            if (!formFields.teamHome.selectedPlayers[k] || !formFields.teamAway.selectedPlayers[k])
                playersAllSelected = false;
    };

    // Tarkistetaan onko lomakkeen tila muuttunut, kutsuu onChangeCallback jos on
    if (playersAllSelected && onChangeCallback) {
        const newDataString = JSON.stringify(formFields);
        if (onChangeCallback && (newDataString !== dataString)) {
            onChangeCallback(formFields);
            setDataString(newDataString);
        };
    };

    return (
        <Box>
        <form onSubmit={handleSubmit(onSubmit)}>
        <Box>
            {/* Lisätään dialog pelaajan lisäämiseksi  */}
            <AddPlayerDialog
                isOpen={isAddPlayerDialogOpen}
                team={currentPlayerSlot.team}
                onClose={handleCloseAddPlayerDialog}
                onAddPlayer={(player) => handleAddPlayer(player, currentPlayerSlot.team, currentPlayerSlot.slot)}
            />
            
            {/* Ottelu ja päivämäärä */}
            <Box display="flex" justifyContent="center" sx={{mb: 2}}>
                <Box textAlign="center">
                    <Typography variant='h4'>
                        {formFields.teamHome.teamName} - {formFields.teamAway.teamName}
                    </Typography>
                    <Box display="flex">
                        <Typography variant='body1'>
                            {!formFields.date ? "" : getDayOfWeekStrings(new Date(formFields.date)).long}
                            &nbsp;    
                        </Typography>
                            {mode == "modify" ?
                            <input
                                type="date"
                                value={dateToISOString(new Date(formFields.date))}
                                onChange={(event) => handleSetDate(event.target.value)}
                                style={{zIndex: 1}}
                            />
                            :
                            <Typography variant='body1'>
                                {toDDMMYYYY(new Date(formFields.date))}
                            </Typography>
                        }
                    </Box>
                </Box>
            </Box>

            <Box sx={{mb: 2, mt: 1}}>
                <Grid container>
                    {/* Kotijoukkueen nimi ja pelaajat */}
                    <Grid item xs={12} sm={6} sx={{px: 2}}>
                        {<TeamSelection mode={mode} team={formFields.teamHome} handleSelectPlayer={handleSelectPlayer} />}
                    </Grid>
                    {/* Vierasjoukkueen nimi ja pelaajat */}
                    <Grid item xs={12} sm={6} sx={{px: 2}}>
                        {<TeamSelection mode={mode} team={formFields.teamAway} handleSelectPlayer={handleSelectPlayer} />}
                    </Grid>
                </Grid>
            </Box>

            {playersAllSelected &&
            <Box display="flex" justifyContent="center">
                <Box width="100%" maxWidth="750px" minWidth="300px">
                    <RoundResultsTable mode={mode} formFields={formFields} onGameDialogSubmit={handleGameDialogSubmit} gameRunningStats={gameRunningStats}></RoundResultsTable>
                </Box>
            </Box>
            }
        </Box>

        {playersAllSelected &&
        <Box display="flex" justifyContent="center">
            <Box width="100%" maxWidth="500px">
                <GameResultsTable gameRunningStats={gameRunningStats} teamHome={formFields.teamHome} teamAway={formFields.teamAway}></GameResultsTable>
            </Box>
        </Box>
        }

        {/* Napit */}
        <Box display="flex" justifyContent="space-between" marginTop="16px">
            <Box>
            </Box>
            <Box display="flex" flexDirection="column" sx={{p: 1}}>
                <Box flexGrow={1}>
                </Box>
                <Box>
                {(mode == 'modify' && playersAllSelected) &&
                <Button type="submit" variant="contained" color="success">Lähetä</Button>}

                {(mode == "verify") && 
                <Box display="flex" gap="20px">
                    <Button type="button" variant="contained" color="error" onClick={rejectCallback}>Muokkaa</Button>
                    {playersAllSelected &&
                    <Button type="submit" variant="contained" color="success">Hyväksy</Button>
                    }
                </Box>}
                </Box>
            </Box>
         </Box>
        {/* {JSON.stringify(formFields)} */}
        {/* {`data: ${JSON.stringify(parseMatch("?", formFields))}`} */}
        </form>
        </Box>
    );
}

export { Scoresheet };