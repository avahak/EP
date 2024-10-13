/**
 * Yhteisiä tietorakenteita ja apufunktioita. 
 */

import { decodeToken } from "react-jwt";

/**
 * Tyyppi, jota käytetään live-otteluiden listassa kun se lähetetään serveriltä.
 */
type LiveMatchEntry = {
    matchId: number;
    home: string;
    away: string
    score: number[];
    // submitter: string;
    submitStartTime: string;
};

/**
 * Tyyppi JWT token payloadille. Tätä käytetään refresh ja access tokeneissa.
 */
type AuthTokenPayload = {
    name: string,
    team: string,
    role: string,       // käyttäjän rooli, voi olla "admin", "mod", tai muu
    iat: number,        // aikaleima, jolloin token annettu
    exp: number,        // aikaleima, jolloin token vanhentuu
};

/** 
 * Tarkistetaan, että payload on AuthTokenPayload.
 */
function isAuthTokenPayload(payload: any): payload is AuthTokenPayload {
    return (
        !!payload && 
        typeof payload === "object" &&
        typeof payload.name === "string" &&
        typeof payload.team === "string" &&
        typeof payload.role === "string" &&
        typeof payload.iat === "number" &&
        typeof payload.exp === "number"
    );
}

/**
 * Palauttaa tokenin payload jos token on validi ja sisältää oikeat kentät.
 * HUOM! Ei varmenna tokenia, lukee vain sen payloadin.
 * HUOM! Muista pitää tämä ajan tasalla jos token muuttuu.
 */
function getAuthTokenPayload(token: any): AuthTokenPayload | null {
    if (!token || typeof token !== "string")
        return null;
    try {
        const payload = decodeToken(token);
        if (isAuthTokenPayload(payload))
            return payload;
    } catch (error) {
        return null;
    }
    return null;
}

/**
 * Apufunktio, joka tarkistaa onko annettu käyttäjän rooli vähintään minimirooli.
 * Tässä järjestys on "admin" > "mod" > kaikki muut arvot.
 */
function roleIsAtLeast(role: string | null, minRole: string | null) {
    if (minRole === null)
        return true;
    if (minRole === "mod")
        if (role === "mod" || role === "admin")
            return true;
    if (minRole === "admin")
        if (role === "admin")
            return true;
    return false;
}

export type { AuthTokenPayload, LiveMatchEntry };
export { roleIsAtLeast, isAuthTokenPayload, getAuthTokenPayload };