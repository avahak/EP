/**
 * Esittää yhden ottelun pöytäkirjan.
 */

import { useEffect, useState } from "react";
import { Scoresheet } from "../scoresheet/Scoresheet";
import { Container } from "@mui/material";
import { fetchMatchData } from "../../utils/matchLoader";
import { Link } from "react-router-dom";

type Player = {
    id: number;
    name: string;
};

type Team = {
    id: number;
    teamName: string;
    teamRole: "home" | "away";
    allPlayers: (Player | null)[];
    selectedPlayers: (Player | null)[];
};

type ResultFields = null | {
    id: number;
    oldStatus: string;
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
        fetchMatch();
        console.log("useEffect");
    }, []);


    return (<>
        <Link to="/">Takaisin</Link>
        <Container maxWidth="md">

        {result &&
        <Scoresheet initialValues={result} mode="display" />
        }

        </Container>
        </>
    );
}

export { DisplayScoresheet };