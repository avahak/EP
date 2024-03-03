/**
 * Testisivu joukkueiden tulosten esittämiselle.
 */

import { Link } from "react-router-dom";
import { ResultTable } from "../tables/ResultTable";
import { useInitialServerFetch } from "../../utils/apiUtils";
import { Container } from "@mui/material";

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
        <ResultTable rows={results.data.rows} tableName="Joukkueiden tulokset" />
        : 
        "Ei dataa."
        }

        </Container>
        </>
    );
}

export { DisplayResultsTeams };