/**
 * PageNameContext on React conteksti, joka pitää kirjaa tämänhetkisen sivun nimestä.
 */

import React, { createContext, useState } from 'react';

type PageNameState = {
    pageName: string;
    setPageName: React.Dispatch<React.SetStateAction<string>>;
};

/** 
 * Tätä tilaa ei käytetä jos kontekstia käytetään oikein, se on vain 
 * alkuarvo, kunnes konteksti on otettu käyttöön.
 */
const dummyPageNameState: PageNameState = {
    pageName: '',
    setPageName: () => {},
};

/**
 * PageNameContext on React conteksti, joka pitää kirjaa tämänhetkisen sivun nimestä.
 */
const PageNameContext = createContext<PageNameState>(dummyPageNameState);

/**
 * Tarjoaa PageNameContext tilan sen sisällä olevien komponenttien käyttöön.
 */
const PageNameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pageName, setPageName] = useState<string>("");

    return (
        <PageNameContext.Provider value={{ pageName, setPageName }}>
            {children}
        </PageNameContext.Provider>
    );
};

export { PageNameContext, PageNameProvider };