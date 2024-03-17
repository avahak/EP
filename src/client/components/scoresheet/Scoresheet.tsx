/**
 * Lomake ottelupöytäkirjan esittämiseen ja muokkaamiseen. Käyttäjä valitsee ensin 
 * molempien joukkueiden pelaajat TeamSelection komponenttia käyttäen ja siinä
 * voi lisätä uusia pelaajia käyttäen AddPlayerDialog komponenttia.
 *     Erien tulokset näytetään taulukkomuodossa RoundResultsTable komponentilla 
 * ja niitä voi muokata GameDialog komponentilla. Näiden alla on pelien tulokset
 * GameResultsTable komponentissa. 
 * 
 * Suomennokset: ottelu=match, peli=game, erä=round.
 */
import { useForm, SubmitHandler } from "react-hook-form";
import React, { useContext, useEffect, useState } from "react";
import { GameResultsTable } from "./GameResultsTable";
import AddPlayerDialog from './AddPlayerDialog';
import { dateToDDMMYYYY, dateToYYYYMMDD, getDayOfWeekStrings } from '../../../shared/generalUtils';
import { Box, Button, Grid, SelectChangeEvent, Typography } from '@mui/material';
import { TeamSelection } from "./TeamSelection";
import { RoundResultsTable } from "./RoundResultsTable";
import { computeGameRunningStats, gameIndexToPlayerIndexes, getPlayerName, isEmptyPlayer } from "../../utils/matchTools";
import { ScoresheetPlayer, ScoresheetTeam, ScoresheetFields, ScoresheetMode, createEmptyTeam } from "./scoresheetTypes";
import { SnackbarContext } from "../../contexts/SnackbarContext";

/**
 * Lomake ottelupöytäkirjan esittämiseen ja muokkaamiseen.
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
    // Käytetään onChageCallback varten tarkistamaan onko muutoksia tapahtunut:
    const [dataString, setDataString] = useState("");
    // Kun lomake yritetään lähettää epäonnistuneesti, aletaan näyttää virheilmoituksia:
    const [displayErrors, setDisplayErrors] = useState<boolean>(false);

    const formFields = watch();

    const setSnackbarState = useContext(SnackbarContext);

    // Jos initialValues muuttuu, muutetaan lomakkeen tila siihen, tätä
    // käytetään vain "display"-tilassa.
    useEffect(() => {
        reset(initialValues);
        console.log("Scoresheet useEffect called");
    }, [initialValues]);

    // Lasketaan väliaikatulokset ja virheilmoitukset:
    const gameRunningStats = computeGameRunningStats(formFields);
    console.log("gameRunningStats", gameRunningStats);

    /** 
     * Avaa AddPlayerDialog ikkunan.
     */ 
    const handleOpenAddPlayerDialog = () => {
        setIsAddPlayerDialogOpen(true);
    };

    /** 
     * Sulkee AddPlayerDialog ikkunan.
     */ 
    const handleCloseAddPlayerDialog = () => {
        setIsAddPlayerDialogOpen(false);
    };

    /** 
     * Takaisinkutsufunktio AddPlayerDialog varten, lisää uuden pelaajan listoihin ja 
     * asettaa sen valituksi.
     */
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
    };

    /** 
     * Funktio, joka kutsutaan kun lomake lähetetään.
     */
    const onSubmit: SubmitHandler<ScoresheetFields> = (data) => {
        if (!gameRunningStats[8].isAllGamesValid) {
            // Käyttäjä yritti lähettää virheellisen lomakkeen - näytä virheet:
            // TODO Tässä voisi siirtää fokus virheelliseen kohtaan.
            setDisplayErrors(true);
            setSnackbarState({ 
                isOpen: true, 
                message: "Lomakkeen lähetys epäonnistui, tarkista tiedot.", 
                severity: "error" 
            });
        } else {
            if (onChangeCallback)
                onChangeCallback({ ...data, isSubmitted: true });
            if (submitCallback) 
                submitCallback({ ...data, isSubmitted: true });
        }
    };

    /**
     * Resetoi annettuun pelaajaan liittyvät erätulokset. Näin joudutaan tekemään
     * kun pelaaja vaihdetaan tyhjäksi tai pois tyhjästä.
     */
    const resetGameScores = (isHome: boolean, playerSlot: number) => {
        for (let gameIndex = 0; gameIndex < 9; gameIndex++) {
            const homePlayerIndex = gameIndexToPlayerIndexes(gameIndex)[0];
            const awayPlayerIndex = gameIndexToPlayerIndexes(gameIndex)[1];
            if (!((isHome && playerSlot == homePlayerIndex) || (!isHome && playerSlot == awayPlayerIndex)))
                continue;
            console.log("resetting gameIndex:", gameIndex);
            for (let playerIndex = 0; playerIndex < 2; playerIndex++) {
                const isPlayerEmpty = isEmptyPlayer(formFields, gameIndex, playerIndex);
                const isOtherPlayerEmpty = isEmptyPlayer(formFields, gameIndex, 1-playerIndex);
                for (let roundIndex = 0; roundIndex < 5; roundIndex++) {
                    let score = ' ';
                    if (isOtherPlayerEmpty && !isPlayerEmpty && (roundIndex < 3))
                        score = '1';
                    if (formFields.scores[gameIndex][playerIndex][roundIndex] != score)
                        setValue(`scores.${gameIndex}.${playerIndex}.${roundIndex}`, score);
                }
            }
        }
    };

    /**
     * Kutsutaan kun GameDialog palauttaa syötetyt erätiedot. 
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
        const oldPlayer = isHome ? getPlayerName(formFields.teamHome.selectedPlayers, slot, "Koti") : getPlayerName(formFields.teamAway.selectedPlayers, slot, "Vieras");
        if (value === "noPlayer") {
            // Valittu 3. pelaaja tyhjäksi
            setValue(isHome ? `teamHome.selectedPlayers.${slot}` : `teamAway.selectedPlayers.${slot}`, {id: -1, name: "-"});
        } else if (value === "newPlayer") {
            // Tyhjennetään pelaajan valinta:
            setValue(isHome ? `teamHome.selectedPlayers.${slot}` : `teamAway.selectedPlayers.${slot}`, null);
            setCurrentPlayerSlot({team, slot});
            console.log("newPlayer selected, slot: ", slot);
            handleOpenAddPlayerDialog();
        } else {
            setValue(isHome ? `teamHome.selectedPlayers.${slot}` : `teamAway.selectedPlayers.${slot}`, 
                team.allPlayers[team.allPlayers.findIndex((player) => player?.id == parseInt(value))]);
        }
        if (value === "noPlayer" || oldPlayer === "-")
            resetGameScores(isHome, slot);
    };

    /**
     * Muutetaan ottelun päivämäärä.
     */
    const handleSetDate = (value: string) => {
        console.log("handleSetDate", value);
        if (value)
            setValue("date", value);
    }

    // Erätuloksia voi muuttaa ainoastaan jos kaikki pelaajat on valittu.
    // Tarkistetaan tässä onko kaikki pelaajat valittu:
    let playersAllSelected = true;
    if (formFields.teamHome.selectedPlayers.length != 3 || formFields.teamAway.selectedPlayers.length != 3)
        playersAllSelected = false;
    if (playersAllSelected) {
        for (let k = 0; k < 3; k++)
            if (!formFields.teamHome.selectedPlayers[k] || !formFields.teamAway.selectedPlayers[k])
                playersAllSelected = false;
    };

    // Tarkistetaan onko lomakkeen tila muuttunut, kutsuu onChangeCallback jos on:
    if (playersAllSelected && onChangeCallback) {
        const newDataString = JSON.stringify(formFields);  // Tehoton tapa tarkistaa mutta helppo tehdä näin
        if (onChangeCallback && (newDataString !== dataString)) {
            onChangeCallback(formFields);
            setDataString(newDataString);
        };
    };

    return (
        <Box>
        <form onSubmit={handleSubmit(onSubmit)}>
        <Box>
            {/* Lisätään AddPlayerDialog pelaajan lisäämiseksi:  */}
            <AddPlayerDialog
                isOpen={isAddPlayerDialogOpen}
                team={currentPlayerSlot.team}
                onClose={handleCloseAddPlayerDialog}
                onAddPlayer={(player) => handleAddPlayer(player, currentPlayerSlot.team, currentPlayerSlot.slot)}
            />
            
            {/* Ottelu ja päivämäärä: */}
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
                                value={dateToYYYYMMDD(new Date(formFields.date))}
                                onChange={(event) => handleSetDate(event.target.value)}
                                style={{zIndex: 1}}
                            />
                            :
                            <Typography variant='body1'>
                                {dateToDDMMYYYY(new Date(formFields.date))}
                            </Typography>
                        }
                    </Box>
                </Box>
            </Box>

            {/* Pelaajien valinta: */}
            <Box sx={{mb: 2, mt: 1}}>
                <Grid container>
                    {/* Kotijoukkueen nimi ja pelaajat: */}
                    <Grid item xs={12} sm={6} sx={{px: 2}}>
                        {<TeamSelection mode={mode} team={formFields.teamHome} handleSelectPlayer={handleSelectPlayer} />}
                    </Grid>
                    {/* Vierasjoukkueen nimi ja pelaajat: */}
                    <Grid item xs={12} sm={6} sx={{px: 2}}>
                        {<TeamSelection mode={mode} team={formFields.teamAway} handleSelectPlayer={handleSelectPlayer} />}
                    </Grid>
                </Grid>
            </Box>

            {/* Taulukko erätuloksille: */}
            {playersAllSelected &&
            <Box display="flex" justifyContent="center">
                <Box width="100%" maxWidth="750px" minWidth="300px">
                    <RoundResultsTable mode={mode} displayErrors={displayErrors} formFields={formFields} onGameDialogSubmit={handleGameDialogSubmit} gameRunningStats={gameRunningStats}></RoundResultsTable>
                </Box>
            </Box>
            }
        </Box>

        {/* Taulukko pelien tuloksille: */}
        {playersAllSelected &&
        <Box display="flex" justifyContent="center">
            <Box width="100%" maxWidth="400px">
                <GameResultsTable gameRunningStats={gameRunningStats} displayErrors={displayErrors} teamHome={formFields.teamHome} teamAway={formFields.teamAway} />
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
        </form>
        </Box>
    );
}

export { Scoresheet };