/**
 * Sivu joukkueiden tulosten esittämiselle.
 */

import { serverFetch } from "../../utils/apiUtils";
import { Box, Container, Typography } from "@mui/material";
import { TeamsTable } from "./TeamTables";
import { compareJsonObjects } from "../../../shared/generalUtils";
import { useEffect, useState } from "react";
import { GroupSelector } from "./GroupSelector";

const DisplayResultsTeams: React.FC = () => {

    const [lohko, setLohko] = useState<any>("");
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
                body: JSON.stringify({ queryName: "get_results_teams_old", ...(lohko && { params: { lohko } }) }),
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
                body: JSON.stringify({ queryName: "get_results_teams", ...(lohko && { params: { lohko } }) }),
            }, null);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            const jsonData = await response.json();
            setResultsNew(jsonData.rows);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    // Haetaan data jos lohko muuttuu:
    useEffect(() => {
        if (lohko !== "") {
            fetchResultsOld();
            fetchResultsNew();
        }
    }, [lohko]);

    console.log("lohko", lohko);
    console.log("resultsOld", resultsOld);
    console.log("resultsNew", resultsNew);

    let diff = [];

    if (resultsOld && resultsNew) {
        const reduction = (results: any[]) => results.reduce((acc, curr) => {
            const { "nimi": _, ...rest } = curr; // cut out nimi
            acc[curr.joukkue] = rest;
            return acc;
        }, {} as Record<string, any>);
        const reductionOld = reduction(resultsOld);
        const reductionNew = reduction(resultsNew);
        console.log("reductionOld", reductionOld);
        console.log("reductionNew", reductionNew);
        diff = compareJsonObjects(reductionOld, reductionNew);
        if (diff.length === 0) {
            console.log("Sarjatilanteet ovat samat varsinaisissa tauluissa ja _tulokset tauluissa.")
        } else {
            console.log("Tulokset eroavat ainakin seuraavassa kohdassa:", diff);
        }
    }

    return (
        <>
        <Container maxWidth="md">

        <GroupSelector lohko={lohko} setLohko={setLohko} />

        {resultsOld && resultsNew && 
        <Box sx={{my: 2}}>
        {diff.length === 0 ?
        <Typography sx={{color: 'green'}}>
            Tulokset molemmissa tauluissa ovat samat.
        </Typography>
        :
        <Typography sx={{color: 'red', fontSize: '1.5rem'}}>
            Ongelma: Tulokset eroavat toisistaan! Katso konsoli.
        </Typography>
        }
        </Box>
        }

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