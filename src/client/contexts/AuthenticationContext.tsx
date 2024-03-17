/**
 * AuthenticationContext on React conteksti, joka pitää kirjaa käyttäjän
 * sisäänkirjautumistilasta AuthenticationState muodossa.
 */

import React, { createContext, useEffect, useState } from 'react';
import { getBackendUrl } from '../utils/apiUtils';
import { getAuthTokenPayload } from '../../shared/commonTypes';

/**
 * Autentikaation tila, name ja team vastaavat ep_userpw.Nimi, ep_userpw.Joukkue.
 * Käyttäjän rooli on role: "admin" tai "mod" ja muut arvot ovat tavallisia käyttäjiä.
 * Kontekstin tilaa voi muttaa kutsumalla setFromRefreshToken ja uuden access
 * tokenin saa kutsumalla getAccessToken. Boolean isTokenChecked seuraa onko 
 * tokenin olemassaoloa vielä tarkistettu.
 */
type AuthenticationState = {
    isAuthenticated: boolean;
    refreshToken: string | null;
    name: string | null;
    team: string | null;
    role: string | null;
    setFromRefreshToken: (token: string | null) => void;
    getAccessToken: () => Promise<string | null>;
    isTokenChecked: boolean;
};

/** 
 * Tätä tilaa ei käytetä jos kontekstia käytetään oikein, se on vain 
 * alkuarvo, kunnes konteksti on otettu käyttöön.
 */
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

/**
 * Tarkistaa täsmäävätkö name, team, role kahdessa tokenissa.
 */
function payloadsMatchIgnoringTimestamps(token1: any, token2: any) {
    const payload1 = getAuthTokenPayload(token1);
    const payload2 = getAuthTokenPayload(token2);
    if (!payload1 || !payload2)
        return false;
    return (payload1.name === payload2.name 
        && payload1.team === payload2.team
        && payload1.role === payload2.role);
}

/**
 * AuthenticationContext on React conteksti, joka pitää kirjaa käyttäjän
 * sisäänkirjautumistilasta AuthenticationState muodossa.
 */
const AuthenticationContext = createContext<AuthenticationState>(dummyAuthenticationState);

/**
 * Tarjoaa AuthenticationContext tilan sen sisällä olevien komponenttien käyttöön.
 */
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
     * Tyhjää autentikaation jos newToken on null tai asettaa tilan annetusta JWT tokenista.
     */
    const setFromRefreshToken = (newToken: string | null) => {
        const payload = getAuthTokenPayload(newToken);
        if (newToken && payload) {
            // Pidetään access token tallessa jos sen payload vastaa uutta refresh tokenia:
            if (!payloadsMatchIgnoringTimestamps(window.localStorage.getItem("accessToken"), newToken))
                window.localStorage.removeItem("accessToken");

            window.localStorage.setItem("refreshToken", newToken);
            setIsAuthenticated(true);
            setRefreshToken(newToken);
            setName(payload.name as string);
            setTeam(payload.team as string);
            setRole(payload.role as string);
            console.log("Autentikaatio asetettu.", newToken);
        } else {
            window.localStorage.removeItem("refreshToken");
            window.localStorage.removeItem("accessToken");
            setIsAuthenticated(false);
            setRefreshToken(null);
            setName(null);
            setTeam(null);
            setRole(null);
            console.log("Autentikaatio poistettu.");
        }
    };

    /**
     * Palauttaa access tokenin local storagesta. Jos sitä ei vielä ole talletettu 
     * local storageen tai se on vanhentunut, niin pyytää palvelinta luomaan uuden. 
     * Access token on lyhytikäinen (luokkaa 1 tunti), joten käyttäjän autentikaatio 
     * tarkistetaan tietokannasta vähintään kerran tunnissa (olettaen elinikä 1 tunti).
     * Kun access token saatu palvelimelta, se talletetaan local storageen seuraavaa
     * käyttöä varten.
     */
    const getAccessToken = async () => {
        try {
            if (!isAuthenticated || !refreshToken)
                return null;
            const now = Math.floor(Date.now() / 1000);
            const oldAccessToken = window.localStorage.getItem("accessToken");
            const payload = getAuthTokenPayload(oldAccessToken);

            // Jos token olemassa ja vähintään 10sec jäljellä, käytetään sitä:
            if (payload && (payload.exp > now+10)) {
                console.log("getAccessToken: local storage used");
                return oldAccessToken;
            }

            // Access token ei ollut talletettuna local storagessa tai ei kelpaa, 
            // joten haetaan uusi:

            const fetchResponse = await fetch(`${getBackendUrl()}/auth/create_access_token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });
            if (fetchResponse.status === 403) {
                // Käyttäjää ei löytynyt tietokannasta. Näin tapahtuu kun käyttäjä on estetty.
                // Poistetaan kirjautuminen:
                setFromRefreshToken(null);
                return null;
            }
            if (!fetchResponse.ok)
                return null;
            const jsonResponse = await fetchResponse.json();

            // Tarkistetaan että refresh token ei ole muuttunut 
            // palvelinpyynnön käsittelyn aikana:
            if (!payloadsMatchIgnoringTimestamps(refreshToken, jsonResponse.refresh_token))
                return null;
            
            setFromRefreshToken(jsonResponse.refresh_token);
            window.localStorage.setItem("accessToken", jsonResponse.access_token);
            console.log("getAccessToken: create_access_token used");
            return jsonResponse.access_token;
        } catch (error) {
            return null;
        }
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