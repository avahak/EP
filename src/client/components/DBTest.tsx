import React, { Fragment, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { serverFetch } from '../utils/apiUtils';
import { AuthenticationContext } from '../contexts/AuthenticationContext';

/**
 * Testisivu tietokannan uudelleenluontiin. Näyttää tietokannan perustamiskyselyt
 * ja napit uudelleenluontiin.
 * HUOM! Tämä poistetaan ehdottomasti tuotantoversiossa.
 */
const DBTest: React.FC = () => {
    const authenticationState = useContext(AuthenticationContext);
    const [data, setData] = useState<any>(null);

    // Hakee tietokannan kaavion (schema):
    const fetchSchema = async () => {
        try {
            const response = await serverFetch("/api/db/schema", {}, authenticationState);

            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
        
            const result = await response.json();

            setData(result);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    // Suorittaa api-kutsun tietokannan uudelleenluomiseksi (tuhoaa datan):
    const fetchRecreate = async (stage: number) => {
        try {
            const response = await serverFetch(`/api/db/recreate/${stage}`, {}, authenticationState);

            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    useEffect(() => {
        fetchSchema();
    }, []);

    return (<>
        <Link to="/">Takaisin</Link>
        <div style={{ padding: '40px' }}>
            Poista tietokanta ja luo se uudelleen (kaikki data poistetaan!)
            Luo myös taulut allaolevan kaavion mukaisesti ja generoi testidataa tauluihin.
            (Ei käytössä Azuressa.)
            <br />
            <button onClick={() => fetchRecreate(1)}>Luo tietokanta ja taulut</button>
            <br />
            <button onClick={() => fetchRecreate(2)}>Luo herättimet</button>
            <br />
            <button onClick={() => fetchRecreate(3)}>Generoi ja lisää rivit</button>
            <br />
            {/* DB lista: 
            {!!data ? JSON.stringify(data.dbList) : "-"}
            <br /> */}
            DB nimi: 
            {!!data ? data.DB_NAME : "-"}
            <br />
            Tietokannan luonti: 
            <hr style={{marginTop: "100px", marginBottom: "100px"}} />
            {!!data ? data.commands1.map((query: string, queryIndex: number) => (
                <Fragment key={queryIndex}>
                <li key={queryIndex}>{query}</li><br />
                </Fragment>
            ))
            : "-"}
            <hr style={{marginTop: "100px", marginBottom: "100px"}} />
            {!!data ? data.commands2.map((query: string, queryIndex: number) => (
                <Fragment key={queryIndex}>
                <li key={queryIndex}>{query}</li><br />
                </Fragment>
            ))
             : "-"}
            <hr style={{marginTop: "100px", marginBottom: "100px"}} />
            {!!data ? data.commands3.map((query: string, queryIndex: number) => (
                <Fragment key={queryIndex}>
                <li key={queryIndex}>{query}</li><br />
                </Fragment>
            ))
             : "-"}
            <hr style={{marginTop: "100px", marginBottom: "100px"}} />
            {!!data ? data.commands4.map((query: string, queryIndex: number) => (
                <Fragment key={queryIndex}>
                <li key={queryIndex}>{query}</li><br />
                </Fragment>
            ))
             : "-"}
        </div>
    </>);
}

export { DBTest };