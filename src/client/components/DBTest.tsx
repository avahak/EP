/**
 * Tietokannan luontia ja testausta.
 */

import React, { useEffect, useState } from 'react';
// import { testFaker } from "../../server/database/dbFaker";
import { getApiUrl } from '../utils/apiUtils';
import { Link } from 'react-router-dom';

const DBTest: React.FC = () => {
    const [data, setData] = useState<any>(null);
    // const [fakerModule, setFakerModule] = useState<any>(null);

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

    // Lisää automaattisesti generoituja rivejä tietokantaan testaustarkoitukseen:
    const fetchFakeData = async () => {
        try {
            const apiUrl = `${getApiUrl()}/db/fake_data`;
            const response = await fetch(apiUrl);

            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    // Ladataan faker-moduuli dynaamisesti (se on suuri ja tarvitaan ainoastaan tähän):
    useEffect(() => {
        // const loadFakerModule = async () => {
        //     const { faker } = await import('@faker-js/faker');
        //     setFakerModule(faker);
        // };
        // loadFakerModule();
        fetchSchema();
    }, []);

    // if (!fakerModule)
    //     return <div>Loading...</div>;

    console.log(!!data ? data.commands : "ei dataa");

    return (<>
        <Link to="/">Takaisin</Link>
        <div style={{ padding: '40px' }}>
            <button onClick={fetchRecreate}>Rakenna uudelleen (kaikki data poistetaan!)</button>
            <button onClick={fetchFakeData}>Generoi rivejä tauluihin</button>
            <br />
            DB lista: {!!data ? JSON.stringify(data.dbList) : "-"}
            <br />
            DB nimi: {!!data ? data.DB_NAME : "-"}
            <br />
            kyselyt: {!data ? "-" : 
                <ul>
                {data.commands.map((element: string, index: number) => (
                <li key={index}>
                    {element}
                </li>
                ))}
                </ul>
            }
            <br />
            Tulos: 
            <pre dangerouslySetInnerHTML={{ __html: !!data ? JSON.stringify(data.schema) : "No data" }}>
            </pre>
        </div>
    </>);
}

export { DBTest };