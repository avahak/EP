/**
 * Esittää yhden ottelun pöytäkirjan (ep_ottelu id=1).
 * HUOM! Tämä on vain testaukseen, ei käytössä tuotantoversiossa.
 */

import { useEffect, useState } from "react";
import { Scoresheet } from "../scoresheet/Scoresheet";
import { Container } from "@mui/material";
import { fetchMatchData } from "../../utils/matchTools";
import { ScoresheetFields } from "../scoresheet/scoresheetTypes";

const DisplayScoresheet: React.FC = () => {
    const [result, setResult] = useState<ScoresheetFields | null>(null);

    useEffect(() => {
        const fetchMatch = async () => {
            const matchData = await fetchMatchData(1);
            setResult(matchData);
        }
        console.log("useEffect");
        fetchMatch();
    }, []);


    return (<>
        {/* <Link to="/">Takaisin</Link> */}
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