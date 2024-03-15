import { Box, Container, Grid, Typography } from "@mui/material"
import { useEffect, useState } from "react";
import { getBackendUrl } from "../../utils/apiUtils";
import { base64JSONparse } from "../../../shared/generalUtils";
import { LiveMatchEntry } from "../../../shared/commonTypes";
import { Scoresheet } from "../scoresheet/Scoresheet";
import { LiveMatchCard } from "./LiveMatchCard";

const LiveMatches: React.FC = () => {
    const [matchId, setMatchId] = useState<number | undefined>(undefined);
    const [matchData, setMatchData] = useState<any>(undefined);
    const [liveMatchList, setLiveMatchList] = useState<LiveMatchEntry[]>([]);

    // Hakee live ottelut:
    // const fetchLiveMatchList = async () => {
    //     try {
    //         const response = await serverFetch("/api/live/get_match_list")
    //         if (!response.ok) 
    //             throw new Error(`HTTP error! Status: ${response.status}`);
    //         const jsonData = await response.json();
    //         setLiveMatchList(jsonData.data);
    //     } catch(error) {
    //         console.error('Error:', error);
    //         setLiveMatchList([]);
    //     }
    // };

    useEffect(() => {
        const eventSource = new EventSource(`${getBackendUrl()}/api/live/watch_match/${matchId}`);

        eventSource.onmessage = (event) => {
            const eventData = event.data;
            const parsedData = base64JSONparse(eventData);
            const type = parsedData.type;
            const data = parsedData.data;

            if (type == "matchListUpdate") 
                setLiveMatchList(data);
            else if (type == "matchUpdate")
                setMatchData(data);

            console.log(`Received: type: ${type}, data: ${JSON.stringify(data)}`);
        };

        eventSource.onerror = (error) => {
            console.log("EventSource failed:", error);
            eventSource.close();
            setMatchData(undefined);
            setLiveMatchList([]);
        };

        // Firefox bugin 
        // https://bugzilla.mozilla.org/show_bug.cgi?id=712329
        // https://stackoverflow.com/questions/14140414/websocket-was-interrupted-while-page-is-loading-on-firefox-for-socket-io
        // takia joudutaan tekemään vielä varmuuden vuoksi ylimääräinen loppusiivous:
        window.addEventListener('beforeunload', () => eventSource.close());

        // Suljetaan eventSource lopuksi:
        return () => {
            eventSource.close();
            setMatchData(undefined);
            setLiveMatchList([]);
        };
    }, [matchId]);

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