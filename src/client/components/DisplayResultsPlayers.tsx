/**
 * Testisivu pelaajien tulosten esittämiselle.
 */

import { useEffect, useState } from "react";
import { getApiUrl } from "../utils/apiUtils";
import { Link } from "react-router-dom";

import { ResultTable } from "./ResultTable";

const DisplayResultsPlayers: React.FC = () => {
    const [results, setResults] = useState<any[]>([]);

    // Suorittaa api-kutsun joukkueiden tulosten hakuun.
    const fetchResults = async () => {
        try {
            const apiUrl = `${getApiUrl()}/db/get_results_players`;
            const response = await fetch(apiUrl);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            const jsonData = await response.json();

            const [rows1, rows2, rows3] = jsonData.result;
            const newResults = JSON.parse(JSON.stringify(rows1));   // deep copy trikki
            const map: Map<number, any> = new Map();
            rows1.forEach((row: any, index: number) => { 
                map.set(row.id, index);
            });
            rows2.forEach((row: any, _index: number) => { 
                newResults[map.get(row.id)] = {...newResults[map.get(row.id)], ...row};
            });
            rows3.forEach((row: any, _index: number) => { 
                newResults[map.get(row.id)] = {...newResults[map.get(row.id)], ...row};
            });

            setResults(newResults);
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
        <ResultTable rows={results} tableName="Pelaajien tulokset" maxWidth="1300px" />
        </>);
}

export { DisplayResultsPlayers };