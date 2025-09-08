/**
 * Komponentti lohkon valitsemiseen.
 */

import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { serverFetch } from "../../utils/apiUtils";
import React, { useEffect, useState } from "react";

/**
 * Testisivu pelaajien tulosten esittämiselle.
 */
const GroupSelector: React.FC<{
    lohko: any, 
    setLohko: React.Dispatch<any>, 
    includeLatestRegularSeason?: boolean
}> = ({lohko, setLohko, includeLatestRegularSeason = false}) => {
    const [lohkot, setLohkot] = useState<any>(null);

    /**
     * Hakee lohkot.
     */
    const fetchGroups = async () => {
        try {
            const response = await serverFetch("/api/db/specific_query", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ queryName: "get_groups" }),
            }, null);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            const jsonData = await response.json();
            if (includeLatestRegularSeason) {
                // Lisätään viimeisin runkosarja kausi
                const latestRegularSeasonEntry = { id: 'viimeisin_runkosarja', kausi: 'Kaikki pelaajat uusimmassa runkosarjassa' };
                setLohkot([...jsonData.rows, latestRegularSeasonEntry]);
                setLohko(latestRegularSeasonEntry.id);
            } else {
                setLohkot(jsonData.rows);
                setLohko(jsonData.rows[jsonData.rows.length-1].id);
            }
            console.log("lohkot", jsonData.rows);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    // Haetaan lohkot:
    useEffect(() => {
        fetchGroups();
    }, []);

    return (
        <>
        {lohkot && 
        <Box sx={{mt: 2, mb: 5}}>
        <FormControl sx={{minWidth: 200}}>
        <InputLabel>Lohko</InputLabel>
            <Select
                value={lohko}
                label="Lohko"
                onChange={(event) => setLohko(event.target.value)}
            >
                {lohkot.map((group: any, index: number) => (
                    <MenuItem key={index} value={group.id}>{Number.isInteger(group.id) ? `${group.kausi} (${group.Laji}), ${group.selite}` : `${group.kausi}`}</MenuItem>
                ))}
            </Select>
        </FormControl>
        </Box>
        }
        </>
    );
}

export { GroupSelector };