/**
 * Tietokannan testausta.
 */

import React, { useEffect, useState } from 'react';
import { testFaker } from "../../shared/dbFaker";
import { getApiUrl } from '../utils/apiUtils';

const DBTest: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [fakerModule, setFakerModule] = useState<any>(null);

    const fetchSchema = async () => {
        try {
            const apiUrl = `${getApiUrl()}/db/recreate`;
            const response = await fetch(apiUrl);

            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
        
            const result = await response.json();

            setData(result);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    // Ladataan faker-moduuli dynaamisesti (se on suuri ja tarvitaan ainoastaan tähän):
    useEffect(() => {
        const loadFakerModule = async () => {
            const { faker } = await import('@faker-js/faker');
            setFakerModule(faker);
        };
        loadFakerModule();
        fetchSchema();
    }, []);


    if (!fakerModule)
        return <div>Loading...</div>;

    const { name, email } = testFaker(fakerModule);
    return (
        <div>
            Nimi: {name}
            <br />
            Email: {email}
            <br />
            DB name: {!!data ? data.DB_NAME : "-"}
            <br />
            Result: 
            <pre dangerouslySetInnerHTML={{ __html: !!data ? JSON.stringify(data.schema) : "No data" }}>
            </pre>
        </div>
    );
}

export { DBTest };