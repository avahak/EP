/**
 * Testisivu joukkueiden tulosten esittämiselle.
 */

import { useInitialServerFetch } from "../../utils/apiUtils";
import { Container } from "@mui/material";
import { TeamsTable } from "./TeamTables";
import { crudeHash } from "../../../shared/generalUtils";

const DisplayResultsTeams: React.FC = () => {
    // Suorittaa api-kutsun joukkueiden tulosten hakuun sivun lataamisen yhteydessä:
    const resultsOld = useInitialServerFetch({ 
        route: "/db/specific_query", 
        method: "POST", 
        params: { queryName: "get_results_teams_old" },
    });

    const resultsNew = useInitialServerFetch({ 
        route: "/db/specific_query", 
        method: "POST", 
        params: { queryName: "get_results_teams" },
    });

    console.log("resultsOld", resultsOld);
    console.log("resultsNew", resultsNew);

    console.log("hash for old:", crudeHash(resultsOld));
    console.log("hash for new:", crudeHash(resultsNew));

    return (
        <>
        {/* <Link to="/">Takaisin</Link> */}
        <Container maxWidth="md">

        {resultsOld.status.ok ?
        <TeamsTable rows={resultsOld.data.rows} tableName="Sarjatilanne" />
        : 
        "Ladataan.."
        }

        {resultsNew.status.ok ?
        <TeamsTable rows={resultsNew.data.rows} tableName="Sarjatilanne" />
        : 
        "Ladataan.."
        }

        </Container>
        </>
    );
}

export { DisplayResultsTeams };