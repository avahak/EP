/**
 * Sivu tulosten ilmoittamiseksi. Ensin valitaan ottelu käyttäen 
 * MatchChooser komponenttia. Jos kyseessä on kotiottelu niin esitetään
 * Scoresheet (mode='modify') täytettäväksi ja vierasottelun tapauksessa
 * esitetään Scoresheet (mode='verify') hyväksyttäväksi.
 */

import { useContext, useEffect, useRef, useState } from "react";
import { MatchChooser, MatchChooserSubmitFields } from "./MatchChooser";
import { Scoresheet } from "../scoresheet/Scoresheet";
import { getBackendUrl, serverFetch } from "../../utils/apiUtils";
import { Container } from "@mui/material";
import { parseMatch } from "../../../shared/parseMatch";
import { fetchMatchData } from "../../utils/matchTools";
import { SnackbarContext } from "../../contexts/SnackbarContext";
import { ScoresheetFields, createEmptyScoresheet } from "../../../shared/scoresheetTypes";
import { AuthenticationContext } from "../../contexts/AuthenticationContext";
import { roleIsAtLeast } from "../../../shared/commonTypes";
import { createRandomUniqueIdentifier, useDebounce } from "../../../shared/generalUtils";
import { ErrorCode } from "../../../shared/customErrors";
import { MessageBackdrop, ProcessingBackdrop } from "../Backdrops";

/**
 * Sivun tila
 */
type PageState = 
    "choose_match" |                        // käyttäjä valitsee ottelua, esitetään MatchChooser
    "scoresheet_fresh" |                    // uuden ottelun ilmoitus (=uuden ilmoitus)
    "scoresheet_modify" |                   // olemassaolevan ottelun muokkaaminen (=toisen joukkueen korjaukset)
    "scoresheet_verify" |                   // olemassaolevan ottelun esittäminen muokattavana tai hyväksyttävänä (=toisen joukkueen valinta korjataanko vai hyväksytäänkö)
    "scoresheet_display" |                  // esitetään ottelu, ei toimintoja
    "scoresheet_display_modifiable";        // esitetään ottelu, esitetään nappi tulosten muokkaamiselle (=admin muutokset jälkikäteen)

/**
 * Ruudun peittävän Backdrop-komponentin tila
 */
type BackdropState = {
    state: "off" | "processing" | "message" | "error";
    title: string;
    text: string;
    buttonText: string;
};

/**
 * Tulosten ilmoitussivu.
 */
const ResultSubmission: React.FC<{resultProp?: ScoresheetFields|null}> = ({resultProp}) => {
    const authenticationState = useContext(AuthenticationContext);
    const setSnackbarState = useContext(SnackbarContext);

    const acceptResultProp = resultProp && (resultProp.status !== "T");

    const initialResult = acceptResultProp ? resultProp : createEmptyScoresheet();
    const initialPageState: PageState = acceptResultProp ? 
        (roleIsAtLeast(authenticationState.role, "admin") ? "scoresheet_display_modifiable" : "scoresheet_display") 
        : "choose_match";

    // Ottelun tila:
    const [result, setResult] = useState<ScoresheetFields>(initialResult);
    const [useLivescore, setUseLivescore] = useState<boolean>(acceptResultProp ? false : true);
    const [pageState, setPageState] = useState<PageState>(initialPageState);
    const [backdropState, setBackdropState] = useState<BackdropState>({ state: "off", title: "", text: "", buttonText: "" });
    // EventSource kuuntelemaan muiden tekemiä muutoksia (kun pageState on "scoresheet_fresh")
    const [eventSource, setEventSource] = useState<EventSource|undefined>();
    // Uniikki id, ei käytetä tällä hetkellä
    const uuid = useRef<string>(createRandomUniqueIdentifier());
    // Hack estämään onAlreadySubmitted tilan muuttaminen samaan aikaan kun lomake lähetetty
    // TODO TÄMÄ ON HUONO RATKAISU! Keksi parempi ratkaisu tähän
    const disableOnAlreadySubmitted = useRef<boolean>(false);

    /**
     * Lähettää lomakkeen tiedot palvelimelle kirjattavaksi tietokantaan.
     */
    const fetchSendResult = async (newStatus: string, result: ScoresheetFields) => {
        console.log("fetchSendResult()");
        let clearBackdrop = true;
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

            let dataMismatch = false;
            if (!response.ok) {
                const errorData = await response.json();
                const checkAgainstCode: ErrorCode = "DATA_MISMATCH";
                if (errorData.code === checkAgainstCode && 
                        errorData.dbMatchStatus && 
                        result.status !== errorData.dbMatchStatus) {
                    // Ottelulla on tietokannassa eri status
                    dataMismatch = true;
                } else 
                    throw new Error(errorData.error || `Tuntematon virhe`);
            }

            // Haetaan data uudelleen esitettäväksi:
            const matchData = await fetchMatchData(result.id);

            disableOnAlreadySubmitted.current = true;

            setResult(matchData);
            setPageState("scoresheet_display");
            console.log("matchData", matchData);
            if (!dataMismatch)
                setSnackbarState({ isOpen: true, message: "Lomakkeen lähetys onnistui.", severity: "success" });
            else {
                setBackdropState({ state: "message", title: "Ottelun status on muuttunut", text: "Ottelun status on muuttunut tietokannassa. Todennäköisin syy on, että toiminto on jo suoritettu. Paina \"Jatka\" nähdäksesi ottelun tiedot.", buttonText: "Jatka" });
                clearBackdrop = false;
                // setSnackbarState({ isOpen: true, autoHideDuration: 10000, message: "Ottelun status ei vastaa tietokannan tietoja. Todennäköisin syy on, että toiminto on jo suoritettu.", severity: "error" });
            }
        } catch (error: any) {
            // Jokin meni pieleen - palataan edelliseen sivun tilaan 
            // ja näytetään virheilmoitus käyttäjälle:
            console.error('Error:', error);
            const message = error.message || "Tuntematon Virhe";
            setSnackbarState({ isOpen: true, autoHideDuration: 10000, message: `Lomakkeen lähetys epäonnistui. Viesti: ${message}`, severity: "error" });
        } finally {
            if (clearBackdrop)
                setBackdropState({ state: "off", title: "", text: "", buttonText: "" });
        }
    };

    /**
     * Lähettää lomakkeen tiedot serverille live-seurantaa varten.
     * Tämä tehdään jokaisen muutoksen jälkeen.
     */
    const fetchSendLiveResult = async ({ oldValues, newValues }: { oldValues: ScoresheetFields|null, newValues: ScoresheetFields }): Promise<void> => {
        console.log("fetchSendLiveResult()");
        try {
            // await delay(100+400*Math.random());
            const response = await serverFetch("/api/live/submit_match", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ oldResult: oldValues, result: newValues }),
            }, authenticationState);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            // await delay(100+400*Math.random());
        } catch(error) {
            console.error('Error:', error);
        }
    };

    /**
     * Palauttaa uuden statuksen ottelulle.
     */
    const determineNewStatus = (match: ScoresheetFields): string|null => {
        const isModerator = roleIsAtLeast(authenticationState.role, "mod");

        if (isModerator)
            return "H";

        if (authenticationState.team === match.teamHome.name) {
            // Käyttäjä on ottelun kotijoukkueessa
            if (match.status === "T")
                return "K";
            if (match.status === "W" && pageState === "scoresheet_modify")
                return "L";
            if (match.status === "W" && pageState === "scoresheet_verify")
                return "M";
        }

        if (authenticationState.team === match.teamAway.name) {
            // Käyttäjä on ottelun vierasjoukkueessa
            if (match.status === "T")
                return "W";
            if (match.status === "K" && pageState === "scoresheet_modify")
                return "V";
            if (match.status === "K" && pageState === "scoresheet_verify")
                return "M";
        }
        
        return null;
    };

    /**
     * Tätä funktiota kutsutaan kun käyttäjä yrittää lähettää täytetyn/muokatun 
     * Scoresheet lomakkeen.
     */
    const handleSubmit = (data: ScoresheetFields) => {
        console.log("handleSubmit()");
        let newStatus = determineNewStatus(data);
        if (newStatus === null) {
            handleError("Ongelma uuden statuksen asettamisessa. Lataa sivu uudelleen painamalla nappia.");
            return;
        }
        setResult(data);
        setBackdropState({ state: "processing", title: "Tietoja käsitellään...", text: "", buttonText: "" });
        fetchSendResult(newStatus, data);
    };

    /**
     * Kutsutaan jos joku toinen on lähettänyt ottelupäiväkirjan käyttäjän kirjauksen aikana.
     */
    const onAlreadySubmitted = async () => {
        // console.log("onAlreadySubmitted()", pageState, disableOnAlreadySubmitted.current);
        if (disableOnAlreadySubmitted.current)
            return;
        // Haetaan data uudelleen esitettäväksi:
        const matchData = await fetchMatchData(result.id);
        console.log("matchData", matchData);

        // console.log("onAlreadySubmitted() loaded", pageState, disableOnAlreadySubmitted.current);
        if (disableOnAlreadySubmitted.current)
            return;

        let snackMessage = "Lomake on lähetetty.";  // Tapahtuu kun moderaattori lähettää.
        if (matchData.status === "K")
            snackMessage = `Kotijoukkue (${matchData.teamHome.name}) lähetti lomakkeen.`;
        if (matchData.status === "W")
            snackMessage = `Vierasjoukkue (${matchData.teamAway.name}) lähetti lomakkeen.`;

        let newPageState: PageState = "scoresheet_display";
        if (matchData.status === "K" && authenticationState.team === matchData.teamAway.name)
            newPageState = "scoresheet_verify";
        if (matchData.status === "W" && authenticationState.team === matchData.teamHome.name)
            newPageState = "scoresheet_verify";

        const backdropText = (newPageState === "scoresheet_verify") ? 
            snackMessage + " Voit nyt tarkistaa ja hyväksyä sen tai tehdä korjauksia." :
            snackMessage + " Tässä on lähetetty pöytäkirja.";

        setBackdropState({ state: "message", title: "Live-syöttö on päättynyt", text: backdropText, buttonText: "Jatka" });
        setResult(matchData);
        setPageState(newPageState);
        // setSnackbarState({ isOpen: true, message: snackMessage, severity: "success" });
    };

    /**
     * Kutsutaan kun ottelupöytäkirjaan tehdään muutoksia tilassa "scoresheet_fresh".
     * Tässä argumenttina on funktio getMostRecentScoresheetData, joka palauttaa 
     * pöytäkirjan uusimman datan.
     */
    const handleScoresheetLiveResult = useDebounce((getMostRecentScoresheetData: () => { oldValues: ScoresheetFields|null, newValues: ScoresheetFields }) => {
        if (useLivescore) {
            const data = getMostRecentScoresheetData();
            fetchSendLiveResult(data);
        }
    }, 3000);

    /**
     * Tämä kutsutaan kun vierasjoukkueen edustaja hylkää kotijoukkueen 
     * antamat tulokset ja haluaa tehdä niihin muutoksia.
     */
    const handleReject = () => {
        setPageState("scoresheet_modify");
    };

    /**
     * Palautumisen estävä virhetilanne - asetetaan virheen kertova overlay.
     */
    const handleError = (infoText: string) => {
        setBackdropState({ state: "error", title: "Virhetilanne", text: infoText, buttonText: "Päivitä" });
    };

    /**
     * Tämä funktio kutsutaan kun MatchChooser valinta tehdään.
     */
    const matchChooserCallback = async (matchChooserValues: MatchChooserSubmitFields) => {
        console.log("matchChooserCallback()", matchChooserValues.match, matchChooserValues.date);
        const matchData = await fetchMatchData(matchChooserValues.match.id);
        if (matchChooserValues.match.status !== matchData.status) {
            handleError("Ottelun status on muuttunut. Lataa sivu uudelleen painamalla nappia.");
            return;
        }

        if (matchChooserValues.match.status === 'T')
            matchData.date = matchChooserValues.date;
        setResult(matchData);
        console.log("matchChooserCallback matchData", matchData);
        setUseLivescore(matchChooserValues.useLivescore);

        if (matchChooserValues.match.status === 'T') {
            if (roleIsAtLeast(authenticationState.role, "mod") ||
                    (authenticationState.team === matchData.teamHome.name) ||
                    (authenticationState.team === matchData.teamAway.name))
                setPageState("scoresheet_fresh");
            else // Tätä ei pitäisi tapahtua
                handleError("Virheellinen ottelu. Lataa sivu uudelleen painamalla nappia.");
        } else 
            setPageState("scoresheet_verify");
    };

    // Jos pageState on "scoresheet_fresh", luodaan EventSource kuuntelemaan 
    // muiden tekemiä muutoksia pöytäkirjaan
    useEffect(() => {
        if (pageState === "scoresheet_fresh" && useLivescore) {
            const matchId = result.id;
            console.log("creating eventSource for match id", matchId);
            const eventSource = new EventSource(`${getBackendUrl()}/api/live/watch_match/${matchId}`);
            setEventSource(eventSource);
            const closeEventSource = () => {
                eventSource?.close();
            };
            window.addEventListener('beforeunload', closeEventSource);
            return () => {
                closeEventSource();
                window.removeEventListener('beforeunload', closeEventSource);
            };
        }
    }, [pageState, useLivescore]);
    
    console.log("pageState", pageState);
    console.log("result", result);

    return (<>
        <Container maxWidth="md">
        {/* Valitaan ottelu: */}
        {pageState === "choose_match" && 
            <MatchChooser submitCallback={matchChooserCallback} />}

        {/* Tulosten kirjaus tyhjään pöytäkirjaan: */}
        {(pageState === "scoresheet_fresh") && 
            <Scoresheet 
                initialValues={result} 
                isModifiable 
                onChangeCallback={handleScoresheetLiveResult}
                submitCallback={handleSubmit} 
                onAlreadySubmitted={onAlreadySubmitted} 
                eventSource={eventSource} 
                uuid={uuid.current}
            />}

        {/* Jo olemassaolevan pöytäkirjan muuttaminen: */}
        {(pageState === "scoresheet_modify") && 
            <Scoresheet 
                initialValues={result} 
                isModifiable 
                submitCallback={handleSubmit} 
            />}

        {/* Tulosten tarkistus: */}
        {pageState === "scoresheet_verify" && 
            <Scoresheet 
                initialValues={result} 
                submitCallback={handleSubmit} 
                rejectCallback={() => {handleReject()}}
            />}

        {/* Täytetyn pöytäkirjan esittäminen: */}
        {pageState === "scoresheet_display" && 
            <Scoresheet initialValues={result} />
        }

        {/* Täytetyn pöytäkirjan esittäminen muokattavana: */}
        {pageState === "scoresheet_display_modifiable" && 
            <Scoresheet 
                initialValues={result} 
                rejectCallback={() => {handleReject()}} 
            />
        }

        {/* Ottelun lähetyksen aikana käytettävä overlay */}
        { backdropState.state === "processing" &&
            <ProcessingBackdrop title={backdropState.title} text={backdropState.text} />
        }
        {/* Tilan muutoksen kertova overlay */}
        { backdropState.state === "message" &&
            <MessageBackdrop title={backdropState.title} text={backdropState.text} buttonText={backdropState.buttonText} buttonCallback={() => setBackdropState({ state: "off", title: "", text: "", buttonText: "" })} />
        }
        {/* VVirhetilasta kertova overlay */}
        { backdropState.state === "error" &&
            <MessageBackdrop title={backdropState.title} text={backdropState.text} buttonText={backdropState.buttonText} buttonCallback={() => window.location.reload()} />
        }

        </Container>
        </>
    );
}

export { ResultSubmission };