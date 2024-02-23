/**
 * Tietokannan luontia ja testausta.
 */

import React, { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { serverFetch } from '../utils/apiUtils';

const DBTest: React.FC = () => {
    const [data, setData] = useState<any>(null);

    // Hakee tietokannan kaavion (schema):
    const fetchSchema = async () => {
        try {
            const response = await serverFetch("/db/schema");

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
            const response = await serverFetch(`/db/recreate/${stage}`);

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
            {/* Ottelut: 
            {!!data ? <DataTable data={data.matches} />: "-"}
            <br /> */}
            Kaavio tauluille: 
            <pre dangerouslySetInnerHTML={{ __html: !!data ? JSON.stringify(data.schema1) : "No data" }}>
            </pre>
            <br />
            <hr />
            Herättimet: 
            <pre dangerouslySetInnerHTML={{ __html: !!data ? JSON.stringify(data.schema2) : "No data" }}>
            </pre>
            <br />
            <hr />
            Tietokannan luonti: 
            {!!data ? data.commands1.map((query: string, queryIndex: number) => (
                <Fragment key={queryIndex}>
                <li key={queryIndex}>{query}</li><br />
                </Fragment>
            ))
            : "-"}
            <hr />
            {!!data ? data.commands2.map((query: string, queryIndex: number) => (
                <Fragment key={queryIndex}>
                <li key={queryIndex}>{query}</li><br />
                </Fragment>
            ))
             : "-"}
        </div>
    </>);
}

export { DBTest };