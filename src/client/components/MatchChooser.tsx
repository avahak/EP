import { Link } from "react-router-dom";
// import { SubmitHandler, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { dateToISOString, getDayOfWeekStrings, toDDMMYYYY } from "../../shared/generalUtils";
import './MatchChooser.css';
import { SubmitHandler, useForm } from "react-hook-form";
import { serverFetch } from "../utils/apiUtils";

type FormFields = {
    selectionCategory: string;
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

    const allFormValues = watch();

    // Funktio, joka kutsutaan kun lomake lähetetään:
    const onSubmit: SubmitHandler<any> = (data: FormFields) => {
        const match = getSelectedMatch(data.selectionCategory, data.selectionIndex);
        submitCallback({ match, date: data.date });
    }

    // Suorittaa api-kutsun tietokannan uudelleenluomiseksi (tuhoaa datan):
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
            setMatches(jsonData.rows);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, []);

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

    /**
     * Kutsutaan kun käyttäjä valitsee joukkueen.
     */
    const handleSelectMatch = (event: React.ChangeEvent<HTMLSelectElement>, category: string) => {
        console.log("selected", event.target.value, "category", category);
        setValue(`selectionCategory`, category);
        const index = parseInt(event.target.value);
        setValue(`selectionIndex`, index);
        setValue(`date`, dateToISOString(new Date(getSelectedMatch(category, index).date)));
    };

    const homeMatches = matches.filter((match) => (match.home == userTeam) && (match.status == 'T'));
    const awayMatches = matches.filter((match) => (match.away == userTeam) && (match.status == 'K'));
    const otherMatches = matches.filter((match) => (match.home != userTeam) && (match.away != userTeam) 
            && (match.status == 'T' || match.status == 'K'));

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${getDayOfWeekStrings(date).short} ${toDDMMYYYY(date)}`;
    };

    let selectedMatch = getSelectedMatch(allFormValues.selectionCategory, allFormValues.selectionIndex);

    return (
        <>
        <Link to="/">Takaisin</Link>
        &nbsp;Tällä sivulla oletetaan, että käyttäjä on kirjautuneena sisään pelaajana,
        jonka joukkue on {userTeam}. (Sisäänkirjautumista ei ole vielä)
        <div id="container">
        <form onSubmit={handleSubmit(onSubmit)}>
        <div id="formContainer">
        <h1>Ilmoita tulos</h1>
        <div className="selectDiv">
            <label>
            Omat kotiottelut:
            </label>
            {homeMatches.length == 0 ? "-" :
            <select value={allFormValues.selectionCategory == 'home' ? allFormValues.selectionIndex : ''} 
                    onChange={(event) => handleSelectMatch(event, 'home')}>
                <option value="" disabled hidden>
                    Valitse kotiottelu
                </option>
                {homeMatches.map((match, matchIndex) => (
                    <option key={`home-${matchIndex}`} value={matchIndex}>
                    {match.home}-{match.away}, {formatDate(match.date)}
                </option>
                ))}
            </select>}
        </div>
        <div className="selectDiv">
            <label>
            Omat vierasottelut:
            </label>
            {awayMatches.length == 0 ? "-" :
            <select value={allFormValues.selectionCategory == 'away' ? allFormValues.selectionIndex : ''} 
                     onChange={(event) => handleSelectMatch(event, 'away')}>
                <option value="" disabled hidden>
                    Valitse vierasottelu
                </option>
                {awayMatches.map((match, matchIndex) => (
                    <option key={`away-${matchIndex}`} value={matchIndex}>
                    {match.home}-{match.away}, {formatDate(match.date)}
                </option>
                ))}
            </select>}
        </div>
        {/* <div className="selectDiv">
            <label>
            Muut ottelut:
            </label>
            {otherMatches.length == 0 ? "-" :
            <select value={allFormValues.selectionCategory == 'other' ? allFormValues.selectionIndex : ''} 
                    onChange={(event) => handleSelectMatch(event, 'other')}>
                <option value="" disabled hidden>
                    Valitse muu ottelu
                </option>
                {otherMatches.map((match, matchIndex) => (
                    <option key={`other-${matchIndex}`} value={matchIndex}>
                    {match.home}-{match.away}, {formatDate(match.date)}
                </option>
                ))}
            </select>}
        </div> */}

        {selectedMatch == null ? <></> :
        <div className="selectionDiv">
            <div>
                <p className="selectedMatch">
                {selectedMatch.home}-{selectedMatch.away}
                </p>
                <div className="dateDiv">
                <label>Muuta päivämäärää tarvittaessa:</label>
                {getDayOfWeekStrings(new Date(allFormValues.date)).long}
                <input
                    type="date"
                    id="datePicker"
                    name="datePicker"
                    value={allFormValues.date}
                    onChange={(event) => setValue("date", event.target.value)}
                />
                </div>
            </div>
            <button id="submitButton" type="submit">Valitse</button>
        </div>}

        </div>
        </form>
        </div>
        </>
    );
}

export { MatchChooser };