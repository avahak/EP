/**
 * Testisivu joukkueiden tulosten esittämiselle.
 */

import { Link } from "react-router-dom";
import { useInitialServerFetch } from "../../utils/apiUtils";
import { Container } from "@mui/material";
import { TeamsTable } from "./TeamTables";

const DisplayResultsTeams: React.FC = () => {
    // Suorittaa api-kutsun joukkueiden tulosten hakuun sivun lataamisen yhteydessä:
    const results = useInitialServerFetch({ 
        route: "/db/specific_query", 
        method: "POST", 
        params: { queryName: "get_results_teams" },
    });

    console.log("results", results);

    return (
        <>
        <Link to="/">Takaisin</Link>
        <Container maxWidth="md">

        {results.status.ok ?
        <TeamsTable rows={results.data.rows} tableName="Sarjatilanne" />
        : 
        "Ei dataa."
        }

        </Container>
        </>
    );
}

export { DisplayResultsTeams };