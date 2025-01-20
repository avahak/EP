/**
 * Lomake ottelupöytäkirjan esittämiseen ja muokkaamiseen. Käyttäjä valitsee ensin 
 * molempien joukkueiden pelaajat TeamSelection komponenttia käyttäen ja siinä
 * voi lisätä uusia pelaajia käyttäen AddPlayerDialog komponenttia.
 *     Erien tulokset näytetään taulukkomuodossa RoundResultsTable komponentilla 
 * ja niitä voi muokata GameDialog komponentilla. Näiden alla on pelien tulokset
 * GameResultsTable komponentissa. 
 * 
 * Live-otteluiden kohdalla lomakkeen tiedot lähetetään serverille live-seurantaa varten
 * ja ne synkronoidaan muiden ottelun live-syöttäjien kanssa tekemällä toistuvia 
 * POST pyyntöjä serverille funktiolla liveUpdate().
 * 
 * Suomennokset: ottelu=match, peli=game, erä=round.
 */
import { useForm, SubmitHandler } from "react-hook-form";
import React, { useContext, useEffect, useRef, useState } from "react";
import { GameResultsTable } from "./GameResultsTable";
import AddPlayerDialog from './AddPlayerDialog';
import { dateToDDMMYYYY, dateToYYYYMMDD, getDayOfWeekStrings, rejectAfterTimeout } from '../../../shared/generalUtils';
import { Box, Button, Grid, SelectChangeEvent, Typography } from '@mui/material';
import { TeamSelection } from "./TeamSelection";
import { RoundResultsTable } from "./RoundResultsTable";
import { computeGameRunningStats, gameIndexToPlayerIndexes, getPlayerName, isEmptyPlayer, statusDescription } from "../../utils/matchTools";
import { ScoresheetPlayer, ScoresheetTeam, ScoresheetFields, createEmptyTeam } from "../../../shared/scoresheetTypes";
import { SnackbarContext } from "../../contexts/SnackbarContext";
import { LegendBox } from "./LegendBox";
import { integrateLiveMatchChanges } from "../../../shared/liveMatchTools";
import { AuthenticationContext } from "../../contexts/AuthenticationContext";
import { serverFetch } from "../../utils/apiUtils";

/**
 * Tyyppi live-ottelun metadatalle.
 */
type LiveMatchState = {
    // Uusimman serveriltä saadun pöytäkirjan versio
    version: number;
    // Viimeinen pöytäkirjan tila, joka saatu serveriltä
    state: ScoresheetFields|null;
    // Viimeisin serveriltä saatu pöytäkirja merkkijonona
    dataString: string;
};

type ScoresheetProps = {
    initialValues: ScoresheetFields;
    isModifiable?: boolean,
    isLive?: boolean,
    submitCallback?: (data: ScoresheetFields) => void;
    onAlreadySubmitted?: () => void;
    rejectCallback?: () => void;
    uuid?: string;
};

/**
 * Lomake ottelupöytäkirjan esittämiseen ja muokkaamiseen.
 */
const Scoresheet: React.FC<ScoresheetProps> = ({
    initialValues, 
    isModifiable = false,
    isLive = false,
    submitCallback, 
    onAlreadySubmitted, 
    rejectCallback, 
    uuid,
}) => {
    const authenticationState = useContext(AuthenticationContext);
    const setSnackbarState = useContext(SnackbarContext);
    // isAddPlayerDialogOpen seuraa onko modaali pelaajan lisäämiseksi auki:
    const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);
    // currentPlayerSlot on apumuuttuja pitämään kirjaa vimeiseksi muutetusta pelaajasta. 
    // Tätä käytetään selvittämään mikä joukkue ja monesko pelaaja on kyseessä kun 
    // uusi pelaaja lisätään modaalin avulla:
    const [currentPlayerSlot, setCurrentPlayerSlot] = useState<{team: ScoresheetTeam, slot: number}>({team: createEmptyTeam("home"), slot: 0});
    // Lomakkeen kenttien tila:
    const { setValue, handleSubmit, watch, reset, getValues } = useForm<ScoresheetFields>({
        defaultValues: initialValues
    });
    // Kun lomake yritetään lähettää epäonnistuneesti, aletaan näyttää virheilmoituksia:
    const [displayErrors, setDisplayErrors] = useState<boolean>(false);
    // Metatieto viimeisestä serverin lähettämästä live-ottelun tiedosta
    const liveMatchState = useRef<LiveMatchState>({ version: -1, state: null, dataString: "" });
    // Onko muistutus lähettää lomake annettu?
    const [isSubmitReminderSent, setIsSubmitReminderSent] = useState<boolean>(false);
    // Ajastin live-päivityksille
    const liveTimer = useRef<{ timeout: NodeJS.Timeout|null, callback: () => void }>({ timeout: null, callback: () => {} });

    const formFields = watch();

    // Jos initialValues muuttuu, muutetaan lomakkeen tila siihen, tätä
    // käytetään vain "display"-tilassa.
    useEffect(() => {
        reset(initialValues);
        console.log("Scoresheet useEffect on [initialValues] called");
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
        const isHome = (team.role == "home");
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
                message: "Lomakkeen lähetys epäonnistui. Tarkista tiedot.", 
                severity: "error" 
            });
        } else {
            if (submitCallback) 
                submitCallback({ ...data });
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
        const isHome = (team.role == "home");
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
        if (value === "noPlayer" || oldPlayer === "-" || !oldPlayer)
            resetGameScores(isHome, slot);
    };

    /**
     * Muutetaan ottelun päivämäärä.
     */
    const handleSetDate = (value: string) => {
        console.log("handleSetDate", value);
        if (value)
            setValue("date", value);
    };

    /**
     * Resetoi live-päivitysten ajastimen uudella viiveellä
     */
    const setLiveTimer = (delay: number) => {
        if (liveTimer.current.timeout) 
            clearTimeout(liveTimer.current.timeout);
        liveTimer.current.timeout = setTimeout(liveTimer.current.callback, delay);
    };

    /**
     * Funktio, jota kutsutaan toistuvasti kun kyseessä on live-ottelu. 
     * Tämä lähettää käyttäjän muutokset serverille ja vastaanottaa serveriltä
     * päivitetyn ottelun, jossa voi olla mukana muiden tekemiä muutoksia.
     */
    const liveUpdate = async () => {
        console.log("liveUpdate()");
        const currentFormFields = getValues();

        let uploadData: any = { version: liveMatchState.current.version };
        if (playersAllSelected) {
            const newDataString = JSON.stringify(currentFormFields);
            if (newDataString !== liveMatchState.current.dataString) {
                uploadData = { version: liveMatchState.current.version, oldValues: liveMatchState.current.state, newValues: currentFormFields };
            };
        }

        const timeoutHandle = { id: undefined };
        try {
            setLiveTimer(120000);   // pitkä odotus jos serveri ei vastaa
            // await delay(100+400*Math.random());
            console.log("DEBUG, liveUpdate sending", JSON.stringify({ matchId: getValues().id, data: uploadData }));
            const response = await Promise.race([
                rejectAfterTimeout(60000, timeoutHandle), 
                serverFetch("/api/live/submit_match", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ matchId: getValues().id, data: uploadData }),
                }, authenticationState)
            ]);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);

            const { version, data } = await response.json();
            console.log("DEBUG, liveUpdate response", { version, data });
            if (data) {
                if (version === 0) {
                    // Serveri lähettää ensimmäisen version
                    // Tämä voi tapahtua myös jos serveri kaatuu
                    // TODO tämä ei enää toimi entisellä SSE tavalla, pitäisikö muuttaa?
                    liveMatchState.current.version = version;
                    liveMatchState.current.state = data;
                    liveMatchState.current.dataString = JSON.stringify(data);
                    reset(data);
                } else if (version !== liveMatchState.current.version) {
                    // Tarkistetaan mitä muutoksia data:ssa on edelliseen serverin lähettämään 
                    // verrattuna ja integroidaan muutokset currentFormFields kopioon, palauttaa tuloksen.
                    let newState = data;
                    if (liveMatchState.current.state)
                        newState = integrateLiveMatchChanges(currentFormFields, liveMatchState.current.state, data);

                    liveMatchState.current.version = version;
                    liveMatchState.current.state = data;
                    liveMatchState.current.dataString = JSON.stringify(data); // ennen oli = JSON.stringify(newState);
                    reset(newState);
                }
                if (data.status !== "T" && onAlreadySubmitted)
                    onAlreadySubmitted();
            }

        } catch(error) {
            console.error('Error:', error);
        } finally {
            if (timeoutHandle.id)
                clearTimeout(timeoutHandle.id);
            // Sovitaan uusi timeout
            setLiveTimer(6000);
        }
    };
    liveTimer.current.callback = liveUpdate;

    // Asetetaan ajastin live-päivityksille
    useEffect(() => {
        if (isLive) {
            console.log("Scoresheet useEffect, calling liveUpdate");
            liveUpdate();
            return () => {
                if (liveTimer.current.timeout)
                    clearTimeout(liveTimer.current.timeout);
            };
        }
    }, [uuid, isLive]);

    // Erätuloksia voi muuttaa ainoastaan jos kaikki pelaajat on valittu.
    // Tarkistetaan tässä onko kaikki pelaajat valittu:
    let playersAllSelected = true;
    if (formFields.teamHome.selectedPlayers.length != 3 || formFields.teamAway.selectedPlayers.length != 3)
        playersAllSelected = false;
    if (playersAllSelected) {
        for (let k = 0; k < 3; k++)
            if (!formFields.teamHome.selectedPlayers[k] || !formFields.teamAway.selectedPlayers[k])
                playersAllSelected = false;
    }

    useEffect(() => {
        // Jos kyseessä on live-ottelu niin muistutetaan lomakkeen lähettämisestä kun 
        // lähettäminen tulee ensimmäisen kerran mahdolliseksi.
        if (playersAllSelected && !isSubmitReminderSent && gameRunningStats[8].isAllGamesValid && isLive) {
            setIsSubmitReminderSent(true);
            setSnackbarState({ isOpen: true, message: "Muista lähettää lomake lopuksi painamalla \"Lähetä\"-nappia!", severity: "success", autoHideDuration: 8000 });
        }
    }, [isLive, formFields]);

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
            <Box justifyContent="center" sx={{ mb: 2 }}>
                <Box>
                    <Typography variant='h4' textAlign="center">
                        {formFields.teamHome.name} - {formFields.teamAway.name}
                    </Typography>
                </Box>
                <Box display="flex" justifyContent="center">
                    <Typography variant='body1'>
                        {!formFields.date ? "" : getDayOfWeekStrings(new Date(formFields.date)).long}
                        &nbsp;
                    </Typography>
                        {isModifiable ?
                        <input
                            type="date"
                            value={ dateToYYYYMMDD(new Date(formFields.date)) }
                            onChange={(event) => handleSetDate(event.target.value)}
                            style={{zIndex: 1}}
                        />
                        :
                        <Typography variant='body1'>
                            {dateToDDMMYYYY(new Date(formFields.date))}
                        </Typography>
                    }
                </Box>
                {/* Status */}
                {(!isModifiable && formFields.status !== "T") &&
                <Box>
                    <Typography variant='body2' textAlign="center">
                        {statusDescription(formFields.status)}
                        &#32;
                        ({formFields.status})
                    </Typography>
                </Box>}
            </Box>

            {/* Pelaajien valinta: */}
            <Box sx={{mb: 2, mt: 1}}>
                <Grid container>
                    {/* Kotijoukkueen nimi ja pelaajat: */}
                    <Grid item xs={12} sm={6} sx={{px: 2}}>
                        {<TeamSelection isModifiable={isModifiable} team={formFields.teamHome} handleSelectPlayer={handleSelectPlayer} />}
                    </Grid>
                    {/* Vierasjoukkueen nimi ja pelaajat: */}
                    <Grid item xs={12} sm={6} sx={{px: 2}}>
                        {<TeamSelection isModifiable={isModifiable} team={formFields.teamAway} handleSelectPlayer={handleSelectPlayer} />}
                    </Grid>
                </Grid>
            </Box>

            {/* Taulukko erätuloksille: */}
            {playersAllSelected &&
            <Box display="flex" justifyContent="center">
                <Box width="100%" maxWidth="750px" minWidth="300px">
                    <RoundResultsTable isModifiable={isModifiable} displayErrors={displayErrors} formFields={formFields} onGameDialogSubmit={handleGameDialogSubmit} gameRunningStats={gameRunningStats}></RoundResultsTable>
                </Box>
            </Box>
            }
        </Box>

        {playersAllSelected &&
        <Box sx={{mb: 2, mt: 1}}>
            <Grid container direction={{ xs: 'column-reverse', sm: 'row' }}>
                {/* Symbolien selitykset */}
                <Grid item xs={12} sm={5} display="flex" justifyContent="center">
                    <Box width="100%" maxWidth="400px">
                        <LegendBox />
                    </Box>
                </Grid>
                {/* Ottelutulokset */}
                <Grid item xs={12} sm={7} display="flex" justifyContent="center">
                    <Box width="100%" maxWidth="400px">
                        <GameResultsTable gameRunningStats={gameRunningStats} displayErrors={displayErrors} teamHome={formFields.teamHome} teamAway={formFields.teamAway} />
                    </Box>
                </Grid>
            </Grid>
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
                    {/* Muokattavana oleva lomake */}
                    {(submitCallback && !rejectCallback && isModifiable && playersAllSelected) &&
                    <Button type="submit" variant="contained" color="success">Lähetä</Button>}

                    {/* Hyväksyttävänä oleva täytetty lomake */}
                    {(submitCallback && rejectCallback && !isModifiable) &&
                    <Box display="flex" gap="20px">
                        <Button type="button" variant="contained" color="error" onClick={rejectCallback}>Muokkaa</Button>
                        {playersAllSelected &&
                        <Button type="submit" variant="contained" color="success">Hyväksy</Button>
                        }
                    </Box>}

                    {/* Täytetyn pöytäkirjan esittäminen muokattavana */}
                    {(!submitCallback && rejectCallback && !isModifiable) && 
                    <Box display="flex" gap="20px">
                        <Button type="button" variant="contained" color="error" onClick={rejectCallback}>Muokkaa</Button>
                    </Box>}
                </Box>
            </Box>
        </Box>
        </form>
        </Box>
    );
}

export { Scoresheet };