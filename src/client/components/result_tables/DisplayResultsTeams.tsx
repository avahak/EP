/**
 * Testisivu joukkueiden tulosten esittämiselle.
 */

import { Link } from "react-router-dom";
import { ResultTable } from "../ResultTable";
import { useInitialServerFetch } from "../../utils/apiUtils";

const DisplayResultsTeams: React.FC = () => {
    // Suorittaa api-kutsun joukkueiden tulosten hakuun sivun lataamisen yhteydessä:
    const results = useInitialServerFetch({ 
        route: "/db/specific_query", 
        method: "POST", 
        params: { queryName: "get_results_teams" },
    });

    console.log("results", results);

    if (!results.status.ok)
        return "Ei dataa."

    return (
        <>
        <Link to="/">Takaisin</Link>
        <ResultTable rows={results.data.rows} tableName="Joukkueiden tulokset" maxWidth="1000px" />
        </>);
}

export { DisplayResultsTeams };