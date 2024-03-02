/**
 * Komponentti ottelun valintaan (koti/vieras) tulosten ilmoittamista varten.
 */

// import { SubmitHandler, useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { getDayOfWeekStrings, toDDMMYYYY } from "../../../shared/generalUtils";
import { SubmitHandler, useForm } from "react-hook-form";
import { serverFetch } from "../../utils/apiUtils";
// import './MatchChooser.css';
import { Box, Button, FormControlLabel, Grid, Paper, Radio, RadioGroup, Typography } from "@mui/material";

type SelectionCategory = "" | "home" | "away" | "other";

type FormFields = {
    selectionCategory: SelectionCategory;
    selectionIndex: number;
    date: string;
};

type SubmitFields = {
    match: any;
    date: string;
}

/**
 * Komponentti ilmoitettavan tuloksen ottelun valintaan
 */
const MatchChooser: React.FC<{ userTeam: string, submitCallback: (data: SubmitFields) => void }> = ({ userTeam, submitCallback }) => {
    const [matches, setMatches] = useState<any[]>([]);
    // Lomakkeen kenttien tila:
    const { setValue, handleSubmit, watch } = useForm<FormFields>({
        defaultValues: {
            selectionCategory: '',
            selectionIndex: 0,
            date: ''
        },
    });
    const sendButton = useRef<HTMLButtonElement>(null);

    const allFormValues = watch();

    /**
     * Palauttaa valitun ottelun tai null.
     */
    const getSelectedMatch = (category: string, index: number) => {
        let selectedMatch = null;
        if (category == 'home')
            selectedMatch = homeMatches[index];
        else if (category == 'away')
            selectedMatch = awayMatches[index];
        else if (category == 'other')
            selectedMatch = otherMatches[index];
        return selectedMatch;
    }

    // Funktio, joka kutsutaan kun lomake lähetetään:
    const onSubmit: SubmitHandler<any> = (data: FormFields) => {
        const match = getSelectedMatch(data.selectionCategory, data.selectionIndex);
        submitCallback({ match, date: data.date });
    }

    // Hakee ottelut tietokannasta
    const fetchMatches = async () => {
        try {
            const response = await serverFetch("/db/specific_query", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ queryName: "get_matches_to_report" }),
            });
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            const jsonData = await response.json();
            console.log("fetchMatches data: ", jsonData.rows);
            setMatches(jsonData.rows);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, []);

    /**
     * Kutsutaan kun käyttäjä valitsee joukkueen.
     */
    // const handleSelectMatch = (event: React.ChangeEvent<HTMLSelectElement>, category: SelectionCategory) => {
    //     const index = parseInt(event.target.value);
    //     const match = getSelectedMatch(category, index);
    //     console.log("selected", event.target.value, "category", category, match);
    //     setValue(`selectionCategory`, category);
    //     setValue(`selectionIndex`, index);
    //     setValue(`date`, match.date);
    // };

    /**
     * Kutsutaan kun käyttäjä valitsee joukkueen.
     */
    const handleRadioChange = (_event: React.ChangeEvent<HTMLInputElement>, value: string) => {
        const parts = value.split("-");
        const category = parts[0] as SelectionCategory;
        const index = parseInt(parts[1]);
        const match = getSelectedMatch(category, index);
        setValue(`selectionCategory`, category);
        setValue(`selectionIndex`, index);
        setValue(`date`, match.date);
        sendButton.current?.focus();
    };

    /**
     * Muutetaan ottelun päivämäärä.
     */
    const handleSetDate = (value: string) => {
        console.log("handleSetDate", value);
        if (value)
            setValue("date", value);
    }

    const homeMatches = matches.filter((match) => (match.home == userTeam) && (match.status == 'T'));
    const awayMatches = matches.filter((match) => (match.away == userTeam) && (match.status == 'K'));
    const otherMatches = matches.filter((match) => (match.home != userTeam) && (match.away != userTeam) 
            && (match.status == 'T' || match.status == 'K'));

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${getDayOfWeekStrings(date).short} ${toDDMMYYYY(date)}`;
    };

    let selectedMatch = getSelectedMatch(allFormValues.selectionCategory, allFormValues.selectionIndex);

    let selectedRadioButton = "";
    if (allFormValues.selectionCategory == "home")
        selectedRadioButton = `home-${allFormValues.selectionIndex}`;
    else if (allFormValues.selectionCategory == "away")
        selectedRadioButton = `away-${allFormValues.selectionIndex}`;
    console.log("selectedRadioButton:", selectedRadioButton);

    return (
        <Box>
            <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ mb: 5 }}>
                <Typography variant="h2" textAlign="center">Ilmoita tulos</Typography>
            </Box>
            <Grid container>
            {/* <Box display="flex" justifyContent="center" gap="50px"> */}
                <Grid item xs={12} sm={6} sx={{p: 2}}>
                    <Paper style={{ padding: "10px" }} elevation={5}>
                    <Typography variant="body1" textAlign="center" fontWeight="bold">Omat kotiottelut</Typography>
                    <Box style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {homeMatches.length > 0 ? (
                    <RadioGroup value={selectedRadioButton} onChange={handleRadioChange}>
                        {homeMatches.map((match, matchIndex) => (
                        <FormControlLabel 
                            key={`home-${matchIndex}`} 
                            value={`home-${matchIndex}`} 
                            control={<Radio />} 
                            label={<Typography variant="body2" textAlign="center">{`${match.home} - ${match.away}, ${formatDate(match.date)}`}</Typography>}
                        />
                        ))}
                    </RadioGroup>) 
                    : <Typography variant="body2">Ei ilmoittamattomia otteluja</Typography>
                    }
                    </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} sx={{p: 2}}>
                    <Paper style={{ padding: "10px" }} elevation={5}>
                    <Typography variant="body1" textAlign="center" fontWeight="bold">Omat vierasottelut</Typography>
                    <Box style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {awayMatches.length > 0 ? (
                    <RadioGroup value={selectedRadioButton} onChange={handleRadioChange}>
                        {awayMatches.map((match, matchIndex) => (
                        <FormControlLabel 
                            key={`away-${matchIndex}`} 
                            value={`away-${matchIndex}`} 
                            control={<Radio />} 
                            label={<Typography variant="body2" textAlign="center">{`${match.home} - ${match.away}, ${formatDate(match.date)}`}</Typography>}
                        />
                        ))}
                    </RadioGroup>) 
                    : <Typography variant="body2">Ei ilmoittamattomia otteluja</Typography>
                    }
                    </Box>
                    </Paper>

                </Grid>
            {/* </Box> */}
            </Grid>
            {selectedMatch && <>
                <Box sx={{ mb: 1, mt: 5 }}>
                    <Typography variant="h2" textAlign="center">{selectedMatch.home} - {selectedMatch.away}</Typography>
                    <Box sx={{ mt:4 }}>
                    <Typography textAlign="center" variant="body1">Muuta päivämäärää tarvittaessa:</Typography>
                    <Box display="flex" gap="10px" justifyContent="center">
                        <Typography variant="body1">{getDayOfWeekStrings(new Date(allFormValues.date)).long}</Typography>
                        <input
                            type="date"
                            value={allFormValues.date}
                            onChange={(event) => handleSetDate(event.target.value)}
                        />
                    </Box>
                    </Box>
                </Box>
                <Box display="flex" justifyContent="right">
                    <Button ref={sendButton} variant="contained" type="submit">Valitse</Button>
                </Box>
            </>}
            </form>
        </Box>
    );
}

export { MatchChooser };