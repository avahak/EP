/**
 * Sivu tulosten ilmoittamiseksi. Ensin valitaan ottelu käyttäen 
 * MatchChooser komponenttia. Jos kyseessä on kotiottelu niin esitetään
 * Scoresheet (mode='modify') täytettäväksi ja vierasottelun tapauksessa
 * esitetään Scoresheet (mode='verify') hyväksyttäväksi.
 */

import { useContext, useState } from "react";
import { MatchChooser, MatchChooserSubmitFields } from "./MatchChooser";
import { Scoresheet } from "../scoresheet/Scoresheet";
import { serverFetch } from "../../utils/apiUtils";
import { Backdrop, Box, CircularProgress, Container, Typography } from "@mui/material";
import { parseMatch } from "../../../shared/parseMatch";
import { fetchMatchData } from "../../utils/matchTools";
import { SnackbarContext } from "../../contexts/SnackbarContext";
import { ScoresheetFields, createEmptyScores, createEmptyTeam } from "../scoresheet/scoresheetTypes";
import { AuthenticationContext } from "../../contexts/AuthenticationContext";
import { AuthError, roleIsAtLeast } from "../../../shared/commonTypes";

/**
 * Sivun tila
 */
type PageState = 
    "choose_match"              // käyttäjä valitsee ottelua, esitetään MatchChooser
    | "scoresheet_fresh"        // uuden ottelun ilmoitus: Scoresheet "modify" moodissa
    | "scoresheet_modify"       // olemassaolevan ottelun muokkaaminen: Scoresheet "modify" moodissa
    | "scoresheet_verify"       // esitetään ottelu Scoresheet "verify" moodissa
    | "scoresheet_submit"       // väliaikainen tila kun ottelu lähetetään palvelimelle, esitetään ottelu ja sen päällä latausikoni
    | "display"                 // esitetään ottelu Scoresheet "display" moodissa
    | "display_modifiable";     // esitetään ottelu Scoresheet "display_modifiable" moodissa, jolloin tuloksia voi muokata

/**
 * Tulosten ilmoitussivu.
 */
const ResultSubmission: React.FC<{resultProp?: ScoresheetFields|null}> = ({resultProp}) => {
    const authenticationState = useContext(AuthenticationContext);
    const setSnackbarState = useContext(SnackbarContext);

    const acceptResultProp = resultProp && (resultProp.status !== "T");

    const initialResult = acceptResultProp ? resultProp : {
        id: -1,
        status: 'T',
        teamHome: {...createEmptyTeam(), teamRole: "home"},
        teamAway: {...createEmptyTeam(), teamRole: "away"},
        date: '',
        scores: createEmptyScores(),
        isSubmitted: false,
    } as ScoresheetFields;
    const initialPageState = acceptResultProp ? 
        (roleIsAtLeast(authenticationState.role, "admin") ? "display_modifiable" : "display") 
        : "choose_match";

    // Ottelun tila:
    const [result, setResult] = useState<ScoresheetFields>(initialResult);
    const [useLivescore, setUseLivescore] = useState<boolean>(acceptResultProp ? false : true);
    const [pageState, setPageState] = useState<PageState>(initialPageState);

    /**
     * Lähettää lomakkeen tiedot palvelimelle kirjattavaksi tietokantaan.
     */
    const fetchSendResult = async (newStatus: string, result: ScoresheetFields, oldPageState: PageState) => {
        console.log("fetchSendResult()");
        try {
            const parsedResult = parseMatch(newStatus, result);
            console.log("parsedResult", parsedResult);
            const response = await serverFetch("/api/db/specific_query", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ queryName: "submit_match_result", params: { result: parsedResult } }),
            }, authenticationState);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);

            // Haetaan data uudelleen esitettäväksi:
            const matchData = await fetchMatchData(result.id);

            setResult(matchData);
            setPageState("display");
            console.log("matchData", matchData);
            setSnackbarState({ isOpen: true, message: "Lomakkeen lähetys onnistui.", severity: "success" });
        } catch(error) {
            // Jokin meni pieleen - palataan edelliseen sivun tilaan 
            // ja näytetään virheilmoitus käyttäjälle:
            console.error('Error:', error);
            setPageState(oldPageState);
            setSnackbarState({ isOpen: true, message: "Lomakkeen lähetys epäonnistui, tarkista tiedot.", severity: "error" });
        }
    };

    /**
     * Lähettää lomakkeen tiedot serverille live-seurantaa varten.
     * Tämä tehdään jokaisen muutoksen jälkeen.
     */
    const fetchSendSSE = async (data: ScoresheetFields) => {
        console.log("fetchSendSSE()");
        try {
            const response = await serverFetch("/api/live/submit_match", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ result: data }),
            }, authenticationState);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    /**
     * Tätä funktiota kutsutaan kun käyttäjä yrittää lähettää täytetyn/muokatun 
     * Scoresheet lomakkeen.
     */
    const handleSubmit = (data: ScoresheetFields) => {
        console.log("handleSubmit()");
        let newStatus = '';
        if (data.status === 'T')
            newStatus = 'K';
        if (roleIsAtLeast(authenticationState.role, "mod")) {
            // Lähettäjä on moderaattori:
            if (data.status !== 'T')
                newStatus = 'H';
        } else {
            // Lähettäjä on tavallinen käyttäjä:
            if (data.status !== 'T' && data.status !== 'K')
                throw new AuthError();
            if ((data.status === 'K') && (pageState === "scoresheet_modify"))
                newStatus = 'V';
            else if ((data.status === 'K') && (pageState === "scoresheet_verify"))
                newStatus = 'M';
        }
        setResult(data);
        const oldPageState = pageState;
        setPageState("scoresheet_submit");
        fetchSendResult(newStatus, data, oldPageState);
    };

    /**
     * Kutsutaan kun ottelupöytäkirjaan tehdään muutoksia tilassa "scoresheet_fresh".
     */
    const handleScoresheetSSE = (data: ScoresheetFields) => {
        if (useLivescore)
            fetchSendSSE(data);
    };

    /**
     * Tämä kutsutaan kun vierasjoukkueen edustaja hylkää kotijoukkueen 
     * antamat tulokset ja haluaa tehdä niihin muutoksia.
     */
    const handleReject = () => {
        setPageState("scoresheet_modify");
    };

    /**
     * Tämä funktio kutsutaan kun MatchChooser valinta tehdään.
     */
    const matchChooserCallback = async (matchChooserValues: MatchChooserSubmitFields) => {
        const matchData = await fetchMatchData(matchChooserValues.match.id);
        matchData.date = matchChooserValues.date;
        setResult(matchData);
        console.log("matchData", matchData);
        console.log("matchChooserCallback()", matchChooserValues.match, matchChooserValues.date);
        console.log("result", result);
        setUseLivescore(matchChooserValues.useLivescore);
        if (matchChooserValues.match.status === 'T')
            setPageState("scoresheet_fresh");
        else 
            setPageState("scoresheet_verify");
    };
    
    console.log("pageState", pageState);
    console.log("result", result);

    return (<>
        <Container maxWidth="md">
        {/* Valitaan ottelu: */}
        {pageState == "choose_match" && 
            <MatchChooser submitCallback={matchChooserCallback} />}

        {/* Tulosten kirjaus tyhjään pöytäkirjaan: */}
        {(pageState == "scoresheet_fresh") && 
            <Scoresheet initialValues={result} mode="modify" onChangeCallback={handleScoresheetSSE}
                submitCallback={(data) => handleSubmit(data)} rejectCallback={() => {}}/>}

        {/* Jo olemassaolevan pöytäkirjan muuttaminen: */}
        {(pageState == "scoresheet_modify") && 
            <Scoresheet initialValues={result} mode="modify" 
                submitCallback={(data) => handleSubmit(data)} rejectCallback={() => {}}/>}

        {/* Tulosten tarkistus: */}
        {pageState == "scoresheet_verify" && 
            <Scoresheet initialValues={result} mode="verify" 
                submitCallback={(data) => handleSubmit(data)} rejectCallback={() => {handleReject()}}/>}

        {/* Tulosten lähetys. Tämän tulisi näkyä vain lyhyen hetken
            kun odotetaan palvelimen vastausta: */}
        {pageState == "scoresheet_submit" && 
        <>
        <Scoresheet initialValues={result} mode="display"
            submitCallback={() => {}} rejectCallback={() => {}}/>
        <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={true}
        >
            <Box display="flex" flexDirection="column" textAlign="center">
                <Typography variant="h2">Lähetetään...</Typography>
                <Box marginTop="20px">
                    <CircularProgress color="inherit" />
                </Box>
            </Box>
        </Backdrop></>}

        {/* Täytetyn pöytäkirjan esittäminen: */}
        {pageState == "display" && 
            <Scoresheet initialValues={result} mode="display" />
        }

        {/* Täytetyn pöytäkirjan esittäminen muokattavana: */}
        {pageState == "display_modifiable" && 
            <Scoresheet initialValues={result} mode="display_modifiable" rejectCallback={() => {handleReject()}} />
        }

        </Container>
        </>
    );
}

export { ResultSubmission };