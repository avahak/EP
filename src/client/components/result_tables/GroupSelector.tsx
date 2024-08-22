/**
 * Komponentti lohkon valitsemiseen.
 */

import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { serverFetch } from "../../utils/apiUtils";
import React, { useEffect, useState } from "react";

/**
 * Testisivu pelaajien tulosten esittämiselle.
 */
const GroupSelector: React.FC<{lohko: any, setLohko: React.Dispatch<any>}> = ({lohko, setLohko}) => {
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
            setLohkot(jsonData.rows);
            setLohko(jsonData.rows[jsonData.rows.length-1].id);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    // Haetaan lohkot:
    useEffect(() => {
        fetchGroups();
        console.log("lohkot", lohkot);
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
                    <MenuItem key={index} value={group.id}>{`${group.kausi} (${group.Laji}), ${group.selite}`}</MenuItem>
                ))}
            </Select>
        </FormControl>
        </Box>
        }
        </>
    );
}

export { GroupSelector };