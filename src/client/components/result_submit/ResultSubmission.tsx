/**
 * Sivu tulosten ilmoittamiseksi. Ensin valitaan ottelu käyttäen 
 * MatchChooser komponenttia. Jos kyseessä on kotiottelu niin esitetään
 * Scoresheet (mode='modify') täytettäväksi ja vierasottelun tapauksessa
 * esitetään Scoresheet (mode='verify') hyväksyttäväksi.
 */

// import { Scoresheet } from "./Scoresheet";
import { useState } from "react";
import { MatchChooser } from "./MatchChooser";
import { Scoresheet } from "../scoresheet/Scoresheet";
import { serverFetch } from "../../utils/apiUtils";
import { Backdrop, Box, CircularProgress, Container, Typography } from "@mui/material";
import { parseMatch } from "../../../shared/parseMatch";
import { fetchMatchData } from "../../utils/matchTools";
import { Link } from "react-router-dom";
import { useSnackbar } from "../../utils/SnackbarContext";

type PageState = "choose_match" | "scoresheet_fresh" | "scoresheet_modify" |
    "scoresheet_verify" | "scoresheet_submit" | "submit_success" | "submit_failure";

type Player = {
    id: number;
    name: string;
};

type MatchChooserSubmitFields = {
    match: any;
    date: string;
};

type Team = {
    id: number;
    teamName: string;
    teamRole: "home" | "away";
    allPlayers: (Player | null)[];
    selectedPlayers: (Player | null)[];
};

type ResultFields = {
    id: number;
    status: string;
    teamHome: Team;
    teamAway: Team;
    date: string;
    scores: string[][][];   // scores[peli][0(koti)/1(vieras)][erä]
};

const emptyTeam: Team = {
    id: -1,
    teamName: '',
    teamRole: "home",
    allPlayers: [],
    selectedPlayers: [],
};

const scoresDefaultValue = Array.from({ length: 9 }, () => Array.from({ length: 2 }, () => Array.from({ length: 5 }, () => ' ')));

/**
 * Tulosten ilmoitussivu.
 */
const ResultSubmission: React.FC<{ userTeam: string }> = ({ userTeam }) => {
    const [result, setResult] = useState<ResultFields>({
        id: -1,
        status: 'T',
        teamHome: {...emptyTeam, teamRole: "home"},
        teamAway: {...emptyTeam, teamRole: "away"},
        date: '',
        scores: [...scoresDefaultValue],
    });
    const [pageState, setPageState] = useState<PageState>("choose_match");
    const setSnackbarState = useSnackbar();

    /**
     * Lähettää lomakkeen tiedot serverille kirjattavaksi tietokantaan.
     */
    const fetchSendResult = async (newStatus: string, result: ResultFields, oldPageState: PageState) => {
        console.log("fetchSendResult()");
        try {
            const parsedResult = parseMatch(newStatus, result);
            const response = await serverFetch("/db/specific_query", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ queryName: "submit_match_result", params: { result: parsedResult } }),
            });
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);

            // Haetaan data uudelleen esitettäväksi:
            const matchData = await fetchMatchData(result.id);

            setResult(matchData);
            setPageState("submit_success");
            console.log("matchData", matchData);
            setSnackbarState?.({ isOpen: true, message: "Lomakkeen lähetys onnistui.", severity: "success" });
        } catch(error) {
            console.error('Error:', error);
            setPageState(oldPageState);

            setSnackbarState?.({ isOpen: true, message: "Lomakkeen lähetys epäonnistui, tarkista tiedot.", severity: "error" });
        }
    };

    /**
     * Lähettää lomakkeen tiedot serverille live-seurantaa varten.
     */
    const fetchSendSSE = async (data: ResultFields) => {
        console.log("fetchSendSSE()");
        try {
            const response = await serverFetch("/submit_live_match", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ result: data }),
            });
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);

            // setSnackbarState?.({ isOpen: true, message: "Muutos kirjattu.", severity: "success", autoHideDuration: 1000 });
        } catch(error) {
            console.error('Error:', error);
            // setSnackbarState?.({ isOpen: true, message: "Muutoksen kirjaus epäonnistui.", severity: "error", autoHideDuration: 2000 });
        }
    };

    /**
     * Tätä funktiota kutsutaan kun käyttäjä lähettää täytetyn/muokatun Scoresheet lomakkeen.
     */
    const handleSubmit = (data: ResultFields) => {
        console.log("handleSubmit()");
        let newStatus = '';
        if (pageState == "scoresheet_fresh")
            newStatus = 'K';
        else if (pageState == "scoresheet_modify")
            newStatus = 'V';
        else if (pageState == "scoresheet_verify")
            newStatus = 'M';
        setResult(data);
        const oldPageState = pageState;
        setPageState("scoresheet_submit");
        fetchSendResult(newStatus, data, oldPageState);
    }

    /**
     * For SSE
     */
    const handleScoresheetSSE = (data: ResultFields) => {
        console.log("handleScoresheetSSE", data);
        fetchSendSSE(data);
    }

    /**
     * Tämä kutsutaan kun vierasjoukkueen edustaja hylkää kotijoukkueen antamat tulokset ja
     * haluaa tehdä niihin muutoksia.
     */
    const handleReject = () => {
        console.log("handleReject()");
        setPageState("scoresheet_modify");
    }

    /**
     * Tämä funktio kutsutaan kun MatchChooser valinta tehdään.
     */
    const matchChooserCallback = async ({match, date}: MatchChooserSubmitFields) => {
        const matchData = await fetchMatchData(match.id);
        matchData.date = date;
        setResult(matchData);
        console.log("matchData", matchData);
        console.log("matchChooserCallback()", match, date);
        console.log("result", result);
        if (match.status == 'T')
            setPageState("scoresheet_fresh");
        else 
            setPageState("scoresheet_verify");
    };
    
    console.log("pageState", pageState);
    console.log("result", result);

    return (<>
        <Link to="/">Takaisin</Link>
        <Container maxWidth="md">
        {/* Valitaan ottelu: */}
        {pageState == "choose_match" && 
            <MatchChooser userTeam={userTeam} submitCallback={matchChooserCallback} />}

        {/* Kotijoukkue kirjaa tulokset: */}
        {(pageState == "scoresheet_fresh") && 
            <Scoresheet initialValues={result} mode="modify" onChangeCallback={handleScoresheetSSE}
                submitCallback={(data) => handleSubmit(data)} rejectCallback={() => {}}/>}

        {/* Vierasjoukkue haluaa tehdä muutoksia tuloksiin: */}
        {(pageState == "scoresheet_modify") && 
            <Scoresheet initialValues={result} mode="modify" 
                submitCallback={(data) => handleSubmit(data)} rejectCallback={() => {}}/>}

        {/* Vierasjoukkue tarkistaa tulokset: */}
        {pageState == "scoresheet_verify" && 
            <Scoresheet initialValues={result} mode="verify" 
                submitCallback={(data) => handleSubmit(data)} rejectCallback={() => {handleReject()}}/>}

        {/* Tulosten lähetys: */}
        {pageState == "scoresheet_submit" && 
        <>
        <Scoresheet initialValues={result} mode="display"
            submitCallback={(data) => handleSubmit(data)} rejectCallback={() => {}}/>
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

        {/* Ilmoitetaan käyttäjälle, että tulosten lähetys onnistui */}
        {pageState == "submit_success" && 
            <Scoresheet initialValues={result} mode="display" />
        }

        </Container>
        </>
    );
}

export { ResultSubmission };