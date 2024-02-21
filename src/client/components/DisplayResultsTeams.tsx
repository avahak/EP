import { useEffect, useState } from "react";
import { getApiUrl } from "../utils/apiUtils";
import { Link } from "react-router-dom";

import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

// Tässä tulisi nyt vähän miettiä asiaa - uudelleenkäytä typpejä!
type Data = {
    id: number;
    nimi: string;
    joukkue: number;
    lyhenne: string;
}

const DisplayResultsTeams: React.FC = () => {
    const [results, setResults] = useState<Data[]>([]);

    // Suorittaa api-kutsun tietokannan uudelleenluomiseksi (tuhoaa datan):
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
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        {Object.keys(results[0]).map((key) => (
                            <TableCell key={key}>{key}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {results.map((row) => (
                        <TableRow key={row.id}>
                        {Object.keys(row).map((key) => (
                            <TableCell key={key}>{(row as any)[key]}</TableCell>
                        ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
        </>);
}

export { DisplayResultsTeams };