/**
 * Tietokannan testausta.
 */

import React, { useEffect, useState } from 'react';
import { testFaker } from "../../shared/dbFaker";

const DBTest: React.FC = () => {
    const [fakerModule, setFakerModule] = useState<any>(null);

    // Ladataan faker-moduuli dynaamisesti (se on suuri ja tarvitaan ainoastaan tähän):
    useEffect(() => {
        const loadFakerModule = async () => {
            const { faker } = await import('@faker-js/faker');
            setFakerModule(faker);
        };
        loadFakerModule();
    }, []);


    if (!fakerModule)
        return <div>Loading...</div>;

    const { name, email } = testFaker(fakerModule);
    return (
        <div>
        {name}
        <br />
        {email}
        </div>
    );
}

export { DBTest };