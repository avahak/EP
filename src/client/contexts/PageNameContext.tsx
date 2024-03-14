/**
 * PageNameContext on React conteksti, joka pitää kirjaa tämänhetkisen sivun nimestä.
 */

import React, { createContext, useState } from 'react';

type PageNameState = {
    pageName: string;
    setPageName: React.Dispatch<React.SetStateAction<string>>;
};

/** 
 * Tätä tilaa ei koskaan käytetä jos kontekstia käytetään oikein.
 * Se on tässä vain käyttämättömänä alkuarvona.
 */
const dummyPageNameState: PageNameState = {
    pageName: '',
    setPageName: () => {},
};

const PageNameContext = createContext<PageNameState>(dummyPageNameState);

const PageNameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pageName, setPageName] = useState<string>("");

    return (
        <PageNameContext.Provider value={{ pageName, setPageName }}>
            {children}
        </PageNameContext.Provider>
    );
};

export { PageNameContext, PageNameProvider };