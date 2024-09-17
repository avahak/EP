/**
 * SnackbarContext on React konteksti, jonka avulla voidaan luoda
 * tilapäinen ilmoitusviesti. Snackbar ilmestyy yleensä näytön alareunaan viestilaatikkona
 * ja antaa käyttäjälle nopeasti tietoa esim. tapahtuman onnistumisesta.
 */

import { Alert, Slide, Snackbar } from '@mui/material';
import React, { createContext, useState } from 'react';

type SnackbarState = {
    isOpen: boolean;
    message?: string;
    severity?: "success" | "error";     // Vaikuttaa viestin taustaväriin
    autoHideDuration?: number;
    action?: React.ReactNode;
};

// Tämä ei tee mitään, käytössä vain oletusarvona.
const dummySnackbarStateSetter: React.Dispatch<React.SetStateAction<SnackbarState>> = () => {};

/**
 * SnackbarContext on React konteksti, jonka avulla voidaan luoda
 * tilapäinen ilmoitusviesti. Snackbar ilmestyy yleensä näytön alareunaan viestilaatikkona
 * ja antaa käyttäjälle nopeasti tietoa esim. tapahtuman onnistumisesta.
 */
const SnackbarContext = createContext<React.Dispatch<React.SetStateAction<SnackbarState>>>(dummySnackbarStateSetter);

/**
 * Määrittää ilmoitusviestien tilan ja tarjoaa sen sovelluksen laajuiseen käyttöön
 * käyttäen SnackbarContext kontekstia.
 */
const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [snackbarState, setSnackbarState] = useState<SnackbarState>({ isOpen: false });

    return (
        <SnackbarContext.Provider value={ setSnackbarState }>
            {children}
            <Snackbar
                // ContentProps={{sx: {flexWrap: 'nowrap'}}}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                open={snackbarState.isOpen}
                transitionDuration={500}
                autoHideDuration={snackbarState.autoHideDuration ?? 5000}
                onClose={() => setSnackbarState({...snackbarState, isOpen: false })}
                TransitionComponent={Slide}
            >
                <Alert
                    onClose={() => setSnackbarState({...snackbarState, isOpen: false })}
                    severity={snackbarState.severity ?? "info"}
                    variant="filled"
                    sx={{ width: '100%' }}
                    action={snackbarState.action}
                >
                    {snackbarState.message ?? ""}
                </Alert>
            </Snackbar>
        </SnackbarContext.Provider>
    );
};

export { SnackbarContext, SnackbarProvider };