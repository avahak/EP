import { Box, Button, Container, Typography } from "@mui/material"
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { serverFetch } from "../../utils/apiUtils";
import { LiveMatch } from "./LiveMatch";

const LiveMatches: React.FC = () => {
    const [matchId, setMatchId] = useState<number | undefined>(undefined);
    const [liveMatchList, setLiveMatchList] = useState<Array<any>>([]);

    // Hakee live ottelut:
    const fetchLiveMatchList = async () => {
        try {
            const response = await serverFetch("/live/get_match_list")
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            const jsonData = await response.json();
            setLiveMatchList(jsonData.data);
        } catch(error) {
            console.error('Error:', error);
            setLiveMatchList([]);
        }
    };

    useEffect(() => {
        fetchLiveMatchList();
    }, []);

    console.log("liveMatchList", liveMatchList);
    console.log("matchId", matchId);

    return (
        <>
        <Link to="/">Takaisin</Link>
        <Container maxWidth="md">
            <Box display="flex" flexDirection="row" gap="10px">
            {liveMatchList.map((liveMatch, index) => (
                <Button key={index} variant="outlined" onClick={() => setMatchId(liveMatch.id)}>
                    <Typography>{liveMatch.id}: {liveMatch.home}-{liveMatch.away}</Typography>
                </Button>
            ))}
            </Box>
                {matchId &&
                    <Box sx={{mt: 2}}>
                        <LiveMatch matchId={matchId} />
                    </Box>
                }
        </Container>
        </>
    );
};

export { LiveMatches };