/**
 * PageName on React conteksti, joka pitää kirjaa tämänhetkisen sivun nimestä.
 */

import React, { createContext, useState } from 'react';

type PageNameState = {
    pageName: string;
    setPageName: React.Dispatch<React.SetStateAction<string>>;
};

const defaultPageNameState: PageNameState = {
    pageName: '',
    setPageName: () => {},
};

const PageNameContext = createContext<PageNameState>(defaultPageNameState);

const PageNameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pageName, setPageName] = useState<string>("");

    return (
        <PageNameContext.Provider value={{ pageName, setPageName }}>
            {children}
        </PageNameContext.Provider>
    );
};

export { PageNameContext, PageNameProvider };