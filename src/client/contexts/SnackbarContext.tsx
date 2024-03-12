/**
 * SnackbarContext on React conteksti, jonka avulla voidaan luoda
 * ilmoitusviestejä.
 */

import { Alert, Slide, Snackbar } from '@mui/material';
import React, { createContext, useState } from 'react';

type SnackbarState = {
    isOpen: boolean;
    message?: string;
    severity?: "success" | "error";
    autoHideDuration?: number;
};

const SnackbarContext = createContext<React.Dispatch<React.SetStateAction<SnackbarState>> | undefined>(undefined);

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
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                open={snackbarState.isOpen}
                transitionDuration={500}
                autoHideDuration={snackbarState.autoHideDuration ?? 4000}
                onClose={() => setSnackbarState({...snackbarState, isOpen: false })}
                TransitionComponent={Slide}
            >
                <Alert
                    onClose={() => setSnackbarState({...snackbarState, isOpen: false })}
                    severity={snackbarState.severity ?? "info"}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbarState.message ?? ""}
                </Alert>
            </Snackbar>
        </SnackbarContext.Provider>
    );
};

export { SnackbarContext, SnackbarProvider };