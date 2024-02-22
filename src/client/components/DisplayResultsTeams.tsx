/**
 * Testisivu joukkueiden tulosten esittämiselle.
 */

import { useEffect, useState } from "react";
import { getApiUrl } from "../utils/apiUtils";
import { Link } from "react-router-dom";

import { ResultTable } from "./ResultTable";

// Tässä tulisi nyt vähän miettiä asiaa - uudelleenkäytä typpejä!
// type Data = {
//     id: number;
//     nimi: string;
//     joukkue: number;
//     lyhenne: string;
// }

const DisplayResultsTeams: React.FC = () => {
    const [results, setResults] = useState<any[]>([]);

    // Suorittaa api-kutsun joukkueiden tulosten hakuun:
    const fetchResults = async () => {
        try {
            const apiUrl = `${getApiUrl()}/db/get_results_teams`;
            const response = await fetch(apiUrl);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            const jsonData = await response.json();
            setResults(jsonData.rows);
        } catch(error) {
            console.error('Error:', error);
        }
    };
    
    useEffect(() => {
        fetchResults();
    }, []);

    console.log("results", results);

    if (results.length == 0)
        return "Ei dataa."

    return (
        <>
        <Link to="/">Takaisin</Link>
        <ResultTable rows={results} tableName="Joukkueiden tulokset" maxWidth="1000px" />
        </>);
}

export { DisplayResultsTeams };