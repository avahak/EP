/**
 * Sivu joukkueiden tulosten esittämiselle.
 */

import { serverFetch } from "../../utils/apiUtils";
import { Box, Container, Link, Typography } from "@mui/material";
import { TeamsTable } from "./TeamTables";
import { useContext, useEffect, useState } from "react";
import { GroupSelector } from "./GroupSelector";
import { AuthenticationContext } from "../../contexts/AuthenticationContext";

const DisplayResultsTeams: React.FC = () => {
    const authenticationState = useContext(AuthenticationContext);
    const [lohko, setLohko] = useState<any>("");
    const [resultsOld, setResultsOld] = useState<any>("");

    /**
     * Hakee tietokannasta sarjatilanteen varsinaisten taulujen perusteella.
     */
    const fetchResultsOld = async () => {
        try {
            const response = await serverFetch("/api/db/specific_query", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ queryName: "get_results_teams", ...(lohko && { params: { lohko } }) }),
            }, null);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            const jsonData = await response.json();
            setResultsOld(jsonData.rows);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    // Haetaan data jos lohko muuttuu:
    useEffect(() => {
        if (lohko !== "")
            fetchResultsOld();
    }, [lohko]);

    /**
     * Palauttaa true joss rivin tiedot liittyvät kirjautuneeseen käyttäjään.
     */
    const isHighlighted = (row: any) => {
        return (row.lyhenne === authenticationState.team);
    }

    console.log("lohko", lohko);
    console.log("resultsOld", resultsOld);

    return (
        <>
        <Container maxWidth="md">

        <GroupSelector lohko={lohko} setLohko={setLohko} />

        <Typography sx={{pb: 2}}>
            Mukana on kaikki alkusarjassa pelatut ottelut.
            <br />
            Lajittelun prioriteetti sijoituksille: 1. Voitot, 2. Pelivoitot, 3. Erävoitot.
        </Typography>

        {resultsOld ?
        <TeamsTable rows={resultsOld} tableName={"Sarjatilanne"} isHighlighted={isHighlighted} />
        : 
        "Ladataan taulua.."
        }

        {<Box sx={{my: 2}}>
            <Typography>
                <Link href="/Ohjelma37.php">Takaisin Alueliiga-sivulle</Link>
            </Typography>
        </Box>}

        </Container>
        </>
    );
}

export { DisplayResultsTeams };