/**
 * Esittää yhden ottelun pöytäkirjan.
 */

import { useEffect, useState } from "react";
import { Container, Typography } from "@mui/material";
import { fetchMatchData } from "../../utils/matchTools";
import { ScoresheetFields } from "../../../shared/scoresheetTypes";
import { ResultSubmission } from "./ResultSubmission";
import { useParams } from 'react-router-dom';

const DisplayScoresheet: React.FC = () => {
    const [result, setResult] = useState<ScoresheetFields | undefined | null>(undefined);
    const { matchId } = useParams<{ matchId: string }>();

    const fetchMatch = async () => {
        try {
            const numericMatchId = parseInt(matchId || "", 10);
            const matchData = await fetchMatchData(numericMatchId);
            if (matchData && matchData.status === 'T')
                throw Error(`Match status is "T".`);
            setResult(matchData);
        } catch(error) {
            setResult(null);
            console.error('Error:', error);
        }
    };

    useEffect(() => {
        fetchMatch();
    }, []);


    return (
        <Container maxWidth="md">

        {result && <ResultSubmission resultProp={result} />}
        {result === undefined && <Typography>Ladataan...</Typography>}
        {result === null && <Typography>Ei ottelua.</Typography>}

        </Container>
    );
}

export { DisplayScoresheet };