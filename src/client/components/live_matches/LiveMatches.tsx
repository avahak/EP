import { Box, Container, Grid, Typography } from "@mui/material"
import { useCallback, useEffect, useRef, useState } from "react";
import { getBackendUrl } from "../../utils/apiUtils";
import { base64JSONparse } from "../../../shared/generalUtils";
import { LiveMatchEntry } from "../../../shared/commonTypes";
import { Scoresheet } from "../scoresheet/Scoresheet";
import { LiveMatchCard } from "./LiveMatchCard";

// const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Live otteluiden esityssivu. Näyttää kutakin ottelua kohden kortin sen tiedoista.
 * Kun korttia painetaan, näkyy ottelun pöytäkirja. Pöytäkirja päivitty automaattisesti
 * käyttäen SSE:tä.
 * Katso https://en.wikipedia.org/wiki/Server-sent_events
 */
const LiveMatches: React.FC = () => {
    const [matchId, setMatchId] = useState<number | null>(null);
    const [matchData, setMatchData] = useState<any>(null);
    const [liveMatchList, setLiveMatchList] = useState<LiveMatchEntry[]>([]);
    // const retryCountRef = useRef<number>(0); // To track retry attempts
    // const hasHeartbeatRef = useRef<boolean>(false);
    const isMountedRef = useRef(false);

    // Kun serveri lähettää viestin, päivitetään seurattavaa ottelua (type="matchUpdate")
    // tai listaa otteluista (type="matchListUpdate"). 
    // Heartbeat ("hb") ei aiheuta toimintoja, sen tarkoitus on vain pitää SSE elossa.
    const handleOnMessage = useCallback((event: MessageEvent) => {
        const eventData = event.data;
        if (eventData === "hb") {
            console.log(`Received: heartbeat.`);
            // hasHeartbeatRef.current = true;
            return;
        }
        const parsedData = base64JSONparse(eventData);
        const { type, data } = parsedData;

        if (type === "matchListUpdate") 
            setLiveMatchList(data);
        else if (type === "matchUpdate")
            setMatchData(data);

        console.log(`Received: type: ${type}, data: ${JSON.stringify(data)}`);
    }, []);

    const handleOnError = useCallback(async (error: any) => {
        console.log("EventSource failed:", error);

        // hasHeartbeatRef.current = false;    // presumed dead
        // // Retry logic with a delay
        // await delay(60*1000);
        // if (!hasHeartbeatRef.current && isMountedRef.current) { 
        //     // no heartbeat in a minute
        //     if (retryCountRef.current++ < 10) {
        //         console.log(`Attempting to reconnect (${retryCountRef.current})`);
        //         setMatchId(prevId => prevId); // This re-triggers useEffect to reconnect
        //     }
        // }
    }, []);

    // Aloitetaan uusi koko ajan auki pidettävä SSE yhteys palvelimeen. Se suljetaan kun 
    // valittu ottelu muutetaan tai komponentti poistetaan.
    useEffect(() => {
        console.log("LiveMatches useEffect!");
        // hasHeartbeatRef.current = true;
        isMountedRef.current = true;
        const eventSource = new EventSource(`${getBackendUrl()}/api/live/watch_match/${matchId}`);
        eventSource.onmessage = handleOnMessage;
        eventSource.onerror = handleOnError;

        const closeEventSource = () => {
            eventSource.close();
        };

        // Firefox bugin takia joudutaan tekemään vielä ylimääräinen loppusiivous:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=712329
        // https://stackoverflow.com/questions/14140414/websocket-was-interrupted-while-page-is-loading-on-firefox-for-socket-io
        window.addEventListener('beforeunload', closeEventSource);

        // Suljetaan eventSource lopuksi:
        return () => {
            isMountedRef.current = false;
            closeEventSource();
            setMatchData(null);
            setLiveMatchList([]);
            window.removeEventListener('beforeunload', closeEventSource);
        };
    }, [matchId, handleOnMessage, handleOnError]);

    console.log("matchId", matchId);

    return (
        <>
        {/* <Link to="/">Takaisin</Link> */}
        <Container maxWidth="md">
            {liveMatchList.length > 0 &&
            <>
                <Typography textAlign="center" variant="h3">
                    Live ottelut
                </Typography>
                <Grid container>
                    {liveMatchList.map((entry, index) => (
                        <Grid item xs={6} sm={4} md={3} p={2} key={index}>
                            <LiveMatchCard entry={entry} onSelect={(id) => setMatchId(id)} selected={entry.matchId == matchId} />
                        </Grid>
                    ))}
                </Grid>
            </>}
            {liveMatchList.length == 0 &&
                <Typography textAlign="center" variant="h3">
                    Ei live otteluita
                </Typography>
            }
            {matchData &&
                <Box sx={{mt: 6}}>
                    <Scoresheet initialValues={matchData} mode="display" />
                </Box>
            }
        </Container>
        </>
    );
};

export { LiveMatches };