/**
 * SnackbarContext on React conteksti, jonka avulla voidaan luoda
 * ilmoitusviestejä.
 */

import { Alert, Snackbar } from '@mui/material';
import React, { createContext, useContext, useState } from 'react';

type SnackbarState = {
    isOpen: boolean;
    message?: string;
    severity?: "success" | "error";
    autoHideDuration?: number;
};

const SnackbarContext = createContext<React.Dispatch<React.SetStateAction<SnackbarState>> | undefined>(undefined);

/** 
 * Hook, jolla voi käyttää Snackbarin tilaa komponentissa.
 */
const useSnackbar = () => {
    return useContext(SnackbarContext);
};

/**
 * Määrittää ilmoitusviestien tilan ja tarjoaa sen sovelluksen laajuiseen käyttöön
 * käyttäen useSnackbar-hookia.
 */
const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [snackbarState, setSnackbarState] = useState<SnackbarState>({ isOpen: false });

    return (
        <SnackbarContext.Provider value={ setSnackbarState }>
            {children}
            <Snackbar
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                open={snackbarState.isOpen}
                autoHideDuration={snackbarState.autoHideDuration ?? 3000}
                onClose={() => setSnackbarState({ isOpen: false })}
            >
                <Alert
                    onClose={() => setSnackbarState({ isOpen: false })}
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

export { useSnackbar, SnackbarProvider };