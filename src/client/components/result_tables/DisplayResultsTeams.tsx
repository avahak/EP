/**
 * Sivu joukkueiden tulosten esittämiselle.
 */

import { serverFetch } from "../../utils/apiUtils";
import { Box, Container, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { TeamsTable } from "./TeamTables";
import { findStringDifference } from "../../../shared/generalUtils";
import { useEffect, useState } from "react";

const DisplayResultsTeams: React.FC = () => {

    const [kausi, setKausi] = useState<any>("");
    const [kaudet, setKaudet] = useState<any>(null);
    const [resultsOld, setResultsOld] = useState<any>("");
    const [resultsNew, setResultsNew] = useState<any>("");

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
                body: JSON.stringify({ queryName: "get_results_teams_old", ...(kausi && { params: { kausi: kausi } }) }),
            }, null);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            const jsonData = await response.json();
            setResultsOld(jsonData.rows);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    /**
     * Hakee tietokannasta sarjatilanteen _tulokset taulujen perusteella.
     */
    const fetchResultsNew = async () => {
        try {
            const response = await serverFetch("/api/db/specific_query", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ queryName: "get_results_teams", ...(kausi && { params: { kausi: kausi } }) }),
            }, null);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            const jsonData = await response.json();
            setResultsNew(jsonData.rows);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    /**
     * Hakee kaudet.
     */
    const fetchSeasons = async () => {
        try {
            const response = await serverFetch("/api/db/specific_query", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ queryName: "get_seasons" }),
            }, null);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            const jsonData = await response.json();
            setKaudet(jsonData.rows.data);
            setKausi(jsonData.rows.current_kausi);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    // Haetaan kaudet:
    useEffect(() => {
        fetchSeasons();
    }, []);

    // Haetaan data uudestaan jos kausi muuttuu:
    useEffect(() => {
        fetchResultsOld();
        fetchResultsNew();
    }, [kausi]);

    console.log("kausi", kausi);
    console.log("kaudet", kaudet);
    console.log("resultsOld", resultsOld);
    console.log("resultsNew", resultsNew);

    const str1 = JSON.stringify(resultsOld);
    const str2 = JSON.stringify(resultsNew);
    const index = findStringDifference(str1, str2);

    if (resultsOld && resultsNew) {
        if (index === -1) {
            console.log("Sarjatilanteet ovat samat varsinaisissa tauluissa ja _tulokset tauluissa.")
        } else {
            console.log("Tulokset eroavat ainakin seuraavassa kohdassa:", str1.slice(0, index), " --> ", str1.slice(index, index+1), " <-- ", str1.slice(index+1, str1.length));
        }
    }

    return (
        <>
        <Container maxWidth="md">

        {kaudet && 
        <>
        <FormControl sx={{mt: 2, mb: 5}}>
        <InputLabel>Kausi</InputLabel>
            <Select
                value={kausi}
                label="Kausi"
                onChange={(event) => setKausi(event.target.value)}
            >
                {kaudet.map((season: any, index: number) => (
                    <MenuItem key={index} value={season.id}>{`${season.kausi} (${season.Laji})`}</MenuItem>
                ))}
            </Select>
        </FormControl>
        </>
        }

        <Box sx={{my: 2}}>
        {index === -1 ?
        <Typography sx={{color: 'green'}}>
            Tulokset molemmissa tauluissa ovat samat.
        </Typography>
        :
        <Typography sx={{color: 'red', fontSize: '1.5rem'}}>
            Ongelma: Tulokset eroavat toisistaan! Katso konsoli.
        </Typography>
        }
        </Box>

        {resultsOld ?
        <TeamsTable rows={resultsOld} tableName="Sarjatilanne varsinaisten taulujen mukaan" />
        : 
        "Ladataan taulua.."
        }

        {resultsNew ?
        <TeamsTable rows={resultsNew} tableName="Sarjatilanne _tulokset taulujen mukaan" />
        : 
        "Ladataan taulua.."
        }

        </Container>
        </>
    );
}

export { DisplayResultsTeams };