/**
 * AuthenticationContext on React conteksti, joka pitää kirjaa käyttäjän
 * sisäänkirjautumisesta.
 */

import React, { createContext, useEffect, useState } from 'react';
import { decodeToken } from "react-jwt";
import { getBackendUrl } from '../utils/apiUtils';
import { AuthTokenPayload } from '../../shared/commonTypes';

type AuthenticationState = {
    isAuthenticated: boolean;
    refreshToken: string | null;
    name: string | null;
    team: string | null;
    role: string | null;
    setFromRefreshToken: (token: string | null) => void;
    getAccessToken: () => Promise<string | null>;
    isTokenChecked: boolean; // seuraa onko tokenin olemassaoloa vielä tarkistettu, aluksi false
};

const dummyAuthenticationState: AuthenticationState = {
    isAuthenticated: false,
    refreshToken: null,
    name: null,
    team: null,
    role: null,
    setFromRefreshToken: () => {},
    getAccessToken: () => { return new Promise((resolve) => { resolve(null) }) },
    isTokenChecked: false,
};

const AuthenticationContext = createContext<AuthenticationState>(dummyAuthenticationState);

const AuthenticationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(dummyAuthenticationState.isAuthenticated);
    const [refreshToken, setRefreshToken] = useState<string | null>(dummyAuthenticationState.refreshToken);
    const [name, setName] = useState<string | null>(dummyAuthenticationState.name);
    const [team, setTeam] = useState<string | null>(dummyAuthenticationState.team);
    const [role, setRole] = useState<string | null>(dummyAuthenticationState.role);
    const [isTokenChecked, setIsTokenChecked] = useState<boolean>(dummyAuthenticationState.isTokenChecked);

    /**
     * Alustetaan autentikaatiotila local storage JWT refresh tokenin mukaan:
     */
    useEffect(() => {
        console.log("AuthenticationProvider getting refresh token from local storage");
        const localStorageToken = window.localStorage.getItem("refreshToken");
        setFromRefreshToken(localStorageToken);
        setIsTokenChecked(true);
    }, []);

    /**
     * Tyhjää autentikaation jos newToken on null tai lukee uuden tilan 
     * annetusta JWT tokenista.
     */
    const setFromRefreshToken = (newToken: string | null) => {
        const payload = newToken ? decodeToken(newToken) : null;
        if (payload && typeof payload === 'object' && "name" in payload && "team" in payload && "role" in payload) {
            setIsAuthenticated(true);
            setRefreshToken(newToken);
            setName(payload.name as string);
            setTeam(payload.team as string);
            setRole(payload.role as string);
            console.log("Autentikaatio asetettu.", newToken);
        } else {
            setIsAuthenticated(false);
            setRefreshToken(null);
            setName(null);
            setTeam(null);
            setRole(null);
            window.localStorage.removeItem("refreshToken");
            window.localStorage.removeItem("accessToken");
            console.log("Autentikaatio poistettu.");
        }
    };

    /**
     * Palauttaa access JWT tokenin. Jos sitä ei vielä ole tai se on vanhentunut,
     * niin pyytää serveriä luomaan uuden.
     */
    const getAccessToken = async () => {
        if (!isAuthenticated)
            return null;
        const now = Math.floor(Date.now() / 1000);
        const oldAccessToken = window.localStorage.getItem("accessToken");
        const payload = oldAccessToken ? decodeToken(oldAccessToken) as AuthTokenPayload : null;

        let tokenIsValid = true;
        if (!payload || typeof payload !== "object" || !("exp" in payload)) 
            tokenIsValid = false;
        else if (payload.exp < now+10)
            tokenIsValid = false;

        if (tokenIsValid) {
            console.log("getAccessToken: using old access token");
            return oldAccessToken;
        }

        // access token ei ollut talletettuna local storagessa, joten haetaan uusi:

        const fetchResponse = await fetch(`${getBackendUrl()}/auth/create_access_token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (fetchResponse.status === 403) {
            // Käyttäjää ei löytynyt tietokannasta - poistetaan kirjautuminen
            setFromRefreshToken(null);
            return null;
        }
        if (!fetchResponse.ok)
            return null;
        const jsonResponse = await fetchResponse.json();
        window.localStorage.setItem("accessToken", jsonResponse.access_token);
        setFromRefreshToken(jsonResponse.refresh_token);
        console.log("getAccessToken: create_access_token used to get new access token");
        return jsonResponse.access_token;
    }

    return (
        <AuthenticationContext.Provider
            value={{ isAuthenticated, refreshToken, name, team, role, setFromRefreshToken, getAccessToken, isTokenChecked }}
        >
            {children}
        </AuthenticationContext.Provider>
    );
};

export type { AuthenticationState };
export { AuthenticationContext, AuthenticationProvider };
