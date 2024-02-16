/**
 * Tietokannan luontia ja testausta.
 */

import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../utils/apiUtils';
import { Link } from 'react-router-dom';

const DBTest: React.FC = () => {
    const [data, setData] = useState<any>(null);

    // Hakee tietokannan kaavion (schema):
    const fetchSchema = async () => {
        try {
            const apiUrl = `${getApiUrl()}/db/schema`;
            const response = await fetch(apiUrl);

            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
        
            const result = await response.json();

            setData(result);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    // Suorittaa api-kutsun tietokannan uudelleenluomiseksi (tuhoaa datan):
    const fetchRecreate = async () => {
        try {
            const apiUrl = `${getApiUrl()}/db/recreate`;
            const response = await fetch(apiUrl);

            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    useEffect(() => {
        fetchSchema();
    }, []);

    console.log(!!data ? data.commands : "ei dataa");

    return (<>
        <Link to="/">Takaisin</Link>
        <div style={{ padding: '40px' }}>
            Poista tietokanta ja luo se uudelleen (kaikki data poistetaan!)
            Luo myös taulut allaolevan kaavion mukaisesti ja generoi testidataa tauluihin.
            (Ei käytössä Azuressa.)
            <br />
            <button onClick={fetchRecreate}>Luo tietokanta</button>
            <br />
            DB lista: {!!data ? JSON.stringify(data.dbList) : "-"}
            <br />
            DB nimi: {!!data ? data.DB_NAME : "-"}
            <br />
            Tulos: 
            <pre dangerouslySetInnerHTML={{ __html: !!data ? JSON.stringify(data.schema) : "No data" }}>
            </pre>
        </div>
    </>);
}

export { DBTest };