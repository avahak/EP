import { Box, Container, Grid, Typography } from "@mui/material"
import { useEffect, useRef, useState } from "react";
import { serverFetch } from "../../utils/apiUtils";
import { LiveMatchEntry } from "../../../shared/commonTypes";
import { Scoresheet } from "../scoresheet/Scoresheet";
import { LiveMatchCard } from "./LiveMatchCard";
import { rejectAfterTimeout } from "../../../shared/generalUtils";

/**
 * Live-otteluiden esityssivu. Näyttää kutakin ottelua kohden kortin sen tiedoista.
 * Kun korttia painetaan, näkyy ottelun pöytäkirja. Pöytäkirja päivitty automaattisesti
 * pyytäen jatkuvasti uusia tuloksia backendiltä (korvaa SSE-yhteydet).
 */
const LiveMatchesFetch: React.FC = () => {
    const [matchId, setMatchId] = useState<number | null>(-1);
    const [matchData, setMatchData] = useState<any>(null);
    const [matchVersion, setMatchVersion] = useState<number>(-1);
    const [liveMatchList, setLiveMatchList] = useState<LiveMatchEntry[]>([]);
    const [listVersion, setListVersion] = useState<number>(-1);
    const timer = useRef<{ timeout: NodeJS.Timeout|null, callback: () => void }>({ timeout: null, callback: () => {} });

    /**
     * Resetoi ajastimen uudella viiveellä
     */
    const setTimer = (delay: number) => {
        if (timer.current.timeout) 
            clearTimeout(timer.current.timeout);
        timer.current.timeout = setTimeout(timer.current.callback, delay);
    };

    /**
     * Hakee ottelutietoja ja listan otteluista serveriltä. Serverille lähetetään
     * nykyiset versionumerot, jotta turhaa tietoa tarvitsisi lähettää vähemmän.
     * Jos serveri lähettää ottelun tai listan takaisin, se otetaan käyttöön.
     */
    const fetchData = async () => {
        console.log("fetchData");

        // URL query parametrit:
        const queryParams = new URLSearchParams({
            mId: String(matchId),
            mVer: String(matchVersion),
            lVer: String(listVersion)
        }).toString();
        // handle rejectAfterTimeout timeoutille
        const timeoutHandle = { id: undefined };

        try {
            setTimer(180000);    // pitkä odotus jos serveri ei vastaa

            // Odotetaan serverin vastausta tai timeout, kumpi tahansa tulee ensin:
            const response = await Promise.race([
                rejectAfterTimeout(120000, timeoutHandle),     // reject jos fetch vie liian kauan
                serverFetch(`/api/live/get_match?${queryParams}`, {
                    method: 'GET',
                }, null)
                // serverFetch(`/api/live/get_match`, {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //     },
                //     body: JSON.stringify({ 
                //         mId: matchId, 
                //         mVer: matchVersion,
                //         lVer: listVersion,
                //     }),
                // }, null)
            ]);

            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            const jsonData = await response.json();
            if (jsonData.match) {
                // Saatiin uusi ottelutieto
                setMatchData(jsonData.match.data);
                setMatchVersion(jsonData.match.version);
            }
            if (jsonData.list) {
                // Saatiin uusi lista
                setLiveMatchList(jsonData.list.data);
                setListVersion(jsonData.list.version);
            }
            console.log("data: ", jsonData);
        } catch(error) {
            console.error('Error:', error);
        } finally {
            if (timeoutHandle.id)
                clearTimeout(timeoutHandle.id);
            // Tietojen haku valmis, palataan takaisin normaaliin tulosten kyselytahtiin
            setTimer(10000);
        }
    };
    // Päivitetään timerin käyttämä callback funktio
    timer.current.callback = fetchData; 

    useEffect(() => {
        console.log("LiveMatchesFetch useEffect!");

        fetchData();

        return () => {
            if (timer.current.timeout)
                clearTimeout(timer.current.timeout);
        };
    }, [matchId]);

    console.log("matchId", matchId);
    console.log("matchVersion", matchVersion);
    console.log("listVersion", listVersion);

    return (
        <>
        {/* <Link to="/">Takaisin</Link> */}
        <Container maxWidth="md">
            {liveMatchList.length > 0 &&
            <>
                <Typography textAlign="center" variant="h3">
                    Live-ottelut
                </Typography>
                <Grid container>
                    {liveMatchList.map((entry, index) => (
                        <Grid item xs={6} sm={4} md={3} p={2} key={index}>
                            <LiveMatchCard entry={entry} onSelect={(id) => 
                            { 
                                setMatchId(id); 
                                setMatchVersion(-1); 
                            }} selected={entry.matchId == matchId} />
                        </Grid>
                    ))}
                </Grid>
            </>}
            {liveMatchList.length == 0 &&
                <Typography textAlign="center" variant="h3">
                    Ei live-otteluita
                </Typography>
            }
            {matchData &&
                <Box sx={{mt: 6}}>
                    <Scoresheet initialValues={matchData} />
                </Box>
            }
        </Container>
        </>
    );
};

export { LiveMatchesFetch };