/**
 * Esittää yhden ottelun pöytäkirjan.
 */

import { useEffect, useState } from "react";
import { Scoresheet } from "../scoresheet/Scoresheet";
import { Container } from "@mui/material";
import { Team, fetchMatchData } from "../../utils/matchTools";
import { Link } from "react-router-dom";

type ResultFields = null | {
    id: number;
    status: string;
    teamHome: Team;
    teamAway: Team;
    date: string;
    scores: string[][][];   // scores[peli][0(koti)/1(vieras)][erä]
};

const DisplayScoresheet: React.FC = () => {
    const [result, setResult] = useState<ResultFields>(null);

    useEffect(() => {
        const fetchMatch = async () => {
            const matchData = await fetchMatchData(1);
            setResult(matchData);
        }
        console.log("useEffect");
        fetchMatch();
    }, []);


    return (<>
        <Link to="/">Takaisin</Link>
        <Container maxWidth="md">

        {result ?
        <Scoresheet initialValues={result} mode="display" />
        : 
        "Ei dataa."
        }

        </Container>
        </>
    );
}

export { DisplayScoresheet };