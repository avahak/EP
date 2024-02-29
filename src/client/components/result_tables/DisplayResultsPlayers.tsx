/**
 * Testisivu pelaajien tulosten esittämiselle.
 */

// import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ResultTable } from "../tables/ResultTable";
import { extractKeys } from "../../../shared/generalUtils";
import { useInitialServerFetch } from "../../utils/apiUtils";

/**
 * Yhdistää ep_pelaaja (rows1), kotivoitot ep_erat taulussa (rows2), 
 * ja vierasvoitot ep_erat taulussa (rows3).
 */
const playerDataProcessor = (data: any) => {
    const [rows1, rows2, rows3] = data.rows;
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
    const keys = extractKeys(newResults);
    console.log("keys", keys);
    newResults.forEach((row: any, _index: number) => {
        for (const [key, _type] of keys) 
            if (!row[key])
                row[key] = 0;
    });
    return newResults;
};

const DisplayResultsPlayers: React.FC = () => {
    const results = useInitialServerFetch({ 
        route: "/db/specific_query", 
        method: "POST", 
        params: { queryName: "get_results_players" },
        dataProcessor: playerDataProcessor
    });
    
    console.log("results", results);

    if (!results.status.ok)
        return "Ei dataa."

    return (
        <>
        <Link to="/">Takaisin</Link>
        <ResultTable rows={results.data} tableName="Pelaajien tulokset" maxWidth="1300px" />
        </>);
}

export { DisplayResultsPlayers };