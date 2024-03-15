/**
 * AuthenticationContext on React conteksti, joka pitää kirjaa käyttäjän
 * sisäänkirjautumisesta.
 */

import React, { createContext, useEffect, useState } from 'react';
import { decodeToken } from "react-jwt";

/**
 * Palauttaa data osuuden JWT tokenista jos mahdollista, muutoin null.
 * Huom! Tässä ei validoida tokenia! Tämä tehdään vain 
 * serveripuolella ja tässä oletetaan, että validointi onnistuu.
 * Verkkosivun toiminta tulee olla yhteensopiva tämän kanssa.
 */
// function decodeTokenWithoutVerifying(token: string) {
//     let payload = null;
//     try {
//         payload = decodeToken(token);
//     } catch (err) {
//         return null;
//     }
//     return payload;
// }

type AuthenticationState = {
    isAuthenticated: boolean;
    token: string | null;
    name: string | null;
    team: string | null;
    role: string | null;
    setFromToken: (token: string | null) => void;
    isTokenChecked: boolean; // seuraa onko tokenin olemassaoloa vielä tarkistettu, aluksi false
};

const dummyAuthenticationState: AuthenticationState = {
    isAuthenticated: false,
    token: null,
    name: null,
    team: null,
    role: null,
    setFromToken: () => {},
    isTokenChecked: false,
};

const AuthenticationContext = createContext<AuthenticationState>(dummyAuthenticationState);

const AuthenticationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(dummyAuthenticationState.isAuthenticated);
    const [token, setToken] = useState<string | null>(dummyAuthenticationState.token);
    const [name, setName] = useState<string | null>(dummyAuthenticationState.name);
    const [team, setTeam] = useState<string | null>(dummyAuthenticationState.team);
    const [role, setRole] = useState<string | null>(dummyAuthenticationState.role);
    const [isTokenChecked, setIsTokenChecked] = useState<boolean>(dummyAuthenticationState.isTokenChecked);

    /**
     * Alustetaan autentikaatiotila local storage JWT tokenin mukaan:
     */
    useEffect(() => {
        console.log("AuthenticationProvider getting token from local storage");
        const localStorageToken = window.localStorage.getItem("jwtToken");
        setFromToken(localStorageToken);
        setIsTokenChecked(true);
    }, []);

    /**
     * Tyhjää autentikaation jos newToken on null tai lukee uuden tilan 
     * annetusta JWT tokenista.
     */
    const setFromToken = (newToken: string | null) => {
        const payload = newToken ? decodeToken(newToken) : null;
        console.log("payload", payload);
        if (payload && typeof payload === 'object' && "name" in payload && "team" in payload && "role" in payload) {
            setIsAuthenticated(true);
            setToken(newToken);
            setName(payload.name as string);
            setTeam(payload.team as string);
            setRole(payload.role as string);
            console.log("Autentikaatio asetettu.", newToken);
        } else {
            setIsAuthenticated(false);
            setToken(null);
            setName(null);
            setTeam(null);
            setRole(null);
            window.localStorage.removeItem("jwtToken");
            console.log("Autentikaatio poistettu.");
        }
    };

    return (
        <AuthenticationContext.Provider
            value={{ isAuthenticated, token, name, team, role, setFromToken, isTokenChecked }}
        >
            {children}
        </AuthenticationContext.Provider>
    );
};

export { AuthenticationContext, AuthenticationProvider };
