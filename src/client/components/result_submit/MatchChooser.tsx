/**
 * Komponentti ottelun valintaan tulosten ilmoittamista varten. Ottelut 
 * on jaettu kategorioihin (SelectionCategory) ja kategoriat esitetään kortteina
 * (MatchCategoryCard).
 */

import { useContext, useEffect, useRef, useState } from "react";
import { getDayOfWeekStrings, dateToDDMMYYYY, dateToYYYYMMDD } from "../../../shared/generalUtils";
import { SubmitHandler, useForm } from "react-hook-form";
import { serverFetch } from "../../utils/apiUtils";
import { Box, Button, Checkbox, FormControlLabel, Grid, Paper, Radio, RadioGroup, Typography } from "@mui/material";
import { AuthenticationContext } from "../../contexts/AuthenticationContext";
import { roleIsAtLeast } from "../../../shared/commonTypes";
import { SnackbarContext } from "../../contexts/SnackbarContext";
import { Link } from "react-router-dom";

/**
 * Kategoriat otteluille
 */
type SelectionCategory = 
    "home"                          // kotijoukkueen ilmoitus
    | "away"                        // vierasjoukkueen tarkistus
    | "moderator_status_T"          // moderaattorille näkyvät ottelut, joilla status T
    | "moderator_status_K"          // moderaattorille näkyvät ottelut, joilla status K
    | "moderator_status_V"          // moderaattorille näkyvät ottelut, joilla status V
    | "moderator_status_M";         // moderaattorille näkyvät ottelut, joilla status M

type FormFields = {
    selectionCategory: SelectionCategory | undefined;
    selectionIndex: number;
    date: string;
    useLivescore: boolean;
};

type MatchChooserSubmitFields = {
    match: any;
    date: string;
    useLivescore: boolean;
};

type MatchCategoryCardProps = {
    title: string;
    moderator?: boolean;
    categoryName: SelectionCategory;
    matches: any[];
    selectedRadioButton: string;
    handleRadioChange: (_event: React.ChangeEvent<HTMLInputElement>, value: string) => void;
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${getDayOfWeekStrings(date).short} ${dateToDDMMYYYY(date)}`;
};

/**
 * Kortti, missä kaikki saman kategorian ottelut on listattu valintapainikkeina.
 */
const MatchCategoryCard: React.FC<MatchCategoryCardProps> = ({ title, moderator = false, categoryName, matches, selectedRadioButton, handleRadioChange }) => {
    return (
        <Paper sx={{ p: 1, background: moderator ? "#ffd580" : "inherit" }} elevation={5}>
            <Typography variant="body1" textAlign="center" fontWeight="bold">
                {title}
            </Typography>
            {moderator &&
            <Typography variant="body2" textAlign="center" fontWeight="bold" color="error">
                Moderaattorin ilmoitus
            </Typography>
            }
            <Box style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {matches.length > 0 ? (
                <RadioGroup value={selectedRadioButton} onChange={handleRadioChange}>
                    {matches.map((match: any, matchIndex: number) => (
                    <FormControlLabel 
                        key={`${matchIndex}`} 
                        value={`${categoryName}-${matchIndex}`} 
                        control={<Radio />} 
                        label={<Typography variant="body2" textAlign="center">{`${match.home} - ${match.away}, ${formatDate(match.date)}`}</Typography>}
                    />
                    ))}
                </RadioGroup>) 
                : <Typography variant="body2">Ei ilmoittamattomia otteluja</Typography>
                }
            </Box>
        </Paper>
    );
};

/**
 * Komponentti ilmoitettavan tuloksen ottelun valintaan.
 */
const MatchChooser: React.FC<{ submitCallback: (data: MatchChooserSubmitFields) => void }> = ({ submitCallback }) => {
    const authenticationState = useContext(AuthenticationContext);
    const setSnackbarState = useContext(SnackbarContext);
    const [matches, setMatches] = useState<any[]>([]);
    const [serverDate, setServerDate] = useState<string>(dateToYYYYMMDD(new Date()));
    // Lomakkeen kenttien tila:
    const { setValue, handleSubmit, watch } = useForm<FormFields>({
        defaultValues: {
            selectionCategory: undefined,
            selectionIndex: 0,
            date: '',
            useLivescore: true,
        },
    });
    const sendButton = useRef<HTMLButtonElement>(null);

    const userTeam = authenticationState.team ?? "";

    const formValues = watch();

    /**
     * Palauttaa valitun ottelun tai null.
     */
    const getSelectedMatch = (category: string | undefined, index: number) => {
        let selectedMatch = null;
        if (category === 'home')
            selectedMatch = homeMatches[index];
        else if (category === 'away')
            selectedMatch = awayMatches[index];
        else if (category === 'moderator_status_T')
            selectedMatch = moderatorMatchesStatus_T[index];
        else if (category === 'moderator_status_K')
            selectedMatch = moderatorMatchesStatus_K[index];
        else if (category === 'moderator_status_V')
            selectedMatch = moderatorMatchesStatus_V[index];
        else if (category === 'moderator_status_M')
            selectedMatch = moderatorMatchesStatus_M[index];
        return selectedMatch;
    };

    /** 
     * Funktio, joka kutsutaan kun lomake lähetetään.
     */
    const onSubmit: SubmitHandler<any> = (data: FormFields) => {
        const match = getSelectedMatch(data.selectionCategory, data.selectionIndex);
        let submitDate = data.date;
        if (data.useLivescore && match.status === "T")
            submitDate = serverDate;
        submitCallback({ match, date: submitDate, useLivescore: data.useLivescore });
    };

    /** 
     * Hakee ottelut tietokannasta. Moderaattorille käytetään specific_query 
     * "get_matches_to_report_moderator" ja muutoin käytetään "get_matches_to_report".
     */
    const fetchMatches = async () => {
        try {
            const response = await serverFetch("/api/db/specific_query", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ queryName: roleIsAtLeast(authenticationState.role, "mod") ? "get_matches_to_report_moderator" : "get_matches_to_report" }),
            }, authenticationState);
            if (!response.ok) {
                const jsonError = await response.json();
                throw new Error(jsonError.error || "Tuntematon virhe.");
            }
            const jsonData = await response.json();
            console.log("fetchMatches data: ", jsonData.rows);
            setMatches(jsonData.rows);
        } catch (error: any) {
            const message = error.message || "Tuntematon virhe.";
            setSnackbarState({
                isOpen: true,
                message: `Otteluiden haku epäonnistui: ${message} Uudelleenkirjautuminen voi auttaa.`,
                severity: "error",
                autoHideDuration: 12000,
                action: (
                    <Link to="/simulate_login">
                        <Button color="primary" variant="contained">Login linkki</Button>
                    </Link>
                ),
            });
            console.error('Error:', error);
        }
    };

    /** 
     * Hakee päivämäärän serveriltä. Tämä on tarpeen koska muutoin käytetään
     * live-ottelun päivämäärään käyttäjän tietokoneen kelloa, joka voi olla väärässä.
     */
    const fetchServerDate = async () => {
        try {
            const response = await serverFetch("/date", {
                method: 'GET',
            }, authenticationState);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            const jsonData = await response.json();
            console.log("server date: ", jsonData.date);
            setServerDate(jsonData.date);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    useEffect(() => {
        console.log("useEffect");
        fetchMatches();
        fetchServerDate();
    }, []);

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
    };

    /**
     * Muutetaan ottelun päivämäärä.
     */
    const handleSetDate = (value: string) => {
        if (value)
            setValue("date", value);
    }

    // Luodaan osajoukot otteluista kategorian mukaan:
    const homeMatches = matches.filter((match) => (match.home == userTeam) && (match.status == 'T'));
    const awayMatches = matches.filter((match) => (match.away == userTeam) && (match.status == 'K'));
    const moderatorMatchesStatus_T = matches.filter((match) => (match.status == 'T'));
    const moderatorMatchesStatus_K = matches.filter((match) => (match.status == 'K'));
    const moderatorMatchesStatus_V = matches.filter((match) => (match.status == 'V'));
    const moderatorMatchesStatus_M = matches.filter((match) => (match.status == 'M'));

    let selectedMatch = getSelectedMatch(formValues.selectionCategory, formValues.selectionIndex);
    useEffect(() => {
        sendButton.current?.focus();
    }, [selectedMatch]);

    let selectedRadioButton = `${formValues.selectionCategory}-${formValues.selectionIndex}`;
    console.log("selectedRadioButton:", selectedRadioButton);

    return (
        <Box>
            <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ mb: 5 }}>
                <Typography variant="h2" textAlign="center">Ilmoita tulos</Typography>
            </Box>
            <Grid container>
                <Grid item xs={12} sm={6} sx={{p: 2}}>
                    <MatchCategoryCard title="Omat kotiottelut" categoryName="home" matches={homeMatches} selectedRadioButton={selectedRadioButton} handleRadioChange={handleRadioChange}/>
                </Grid>
                <Grid item xs={12} sm={6} sx={{p: 2}}>
                    <MatchCategoryCard title="Omat vierasottelut" categoryName="away" matches={awayMatches} selectedRadioButton={selectedRadioButton} handleRadioChange={handleRadioChange}/>
                </Grid>
                {roleIsAtLeast(authenticationState.role, "mod") && 
                    <>
                    <Grid item xs={12} sm={6} sx={{p: 2}}>
                        <MatchCategoryCard moderator title={"Tulevat ottelut"} categoryName="moderator_status_T" matches={moderatorMatchesStatus_T} selectedRadioButton={selectedRadioButton} handleRadioChange={handleRadioChange}/>
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{p: 2}}>
                        <MatchCategoryCard moderator title={"Kotijoukkueen ilmoittamat"} categoryName="moderator_status_K" matches={moderatorMatchesStatus_K} selectedRadioButton={selectedRadioButton} handleRadioChange={handleRadioChange}/>
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{p: 2}}>
                        <MatchCategoryCard moderator title={"Vierasjoukkueen korjaamat"} categoryName="moderator_status_V" matches={moderatorMatchesStatus_V} selectedRadioButton={selectedRadioButton} handleRadioChange={handleRadioChange}/>
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{p: 2}}>
                        <MatchCategoryCard moderator title={"Molempien hyväksymät"} categoryName="moderator_status_M" matches={moderatorMatchesStatus_M} selectedRadioButton={selectedRadioButton} handleRadioChange={handleRadioChange}/>
                    </Grid>
                    </>
                }
            </Grid>
            {selectedMatch && <>
                <Box sx={{ mb: 1, mt: 5 }}>
                    <Typography variant="h2" textAlign="center">{selectedMatch.home} - {selectedMatch.away}</Typography>
                    {(!formValues.useLivescore || selectedMatch.status !== "T") &&
                    <Box sx={{ mt:4 }}>
                        <Typography textAlign="center" variant="body1">Muuta päivämäärää tarvittaessa:</Typography>
                        <Box display="flex" gap="10px" justifyContent="center">
                            <Typography variant="body1">{getDayOfWeekStrings(new Date(formValues.date)).long}</Typography>
                            <input
                                type="date"
                                value={formValues.date}
                                onChange={(event) => handleSetDate(event.target.value)}
                            />
                        </Box>
                    </Box>
                    }
                    {selectedMatch.status === "T" &&
                    <Box sx={{ mt: 3 }} display="flex" justifyContent="center">
                        <FormControlLabel
                            control={<Checkbox checked={formValues.useLivescore} onChange={(event) => { setValue('useLivescore', event.target.checked) }} />}
                            title="Valitse jos haluat tulosten näkyvän reaaliajassa otteluseuranta sivulla"
                            label="Kirjaa tulokset reaaliajassa otteluseurantaan"
                        />
                    </Box>
                    }
                </Box>
                <Box display="flex" justifyContent="right">
                    <Button ref={sendButton} variant="contained" type="submit">Valitse</Button>
                </Box>
            </>}
            </form>
        </Box>
    );
}

export type { MatchChooserSubmitFields };
export { MatchChooser };