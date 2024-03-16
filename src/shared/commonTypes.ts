/**
 * Yhteisiä tietorakenteita ja apufunktioita. 
 */

/**
 * Tyyppi, jota käytetään live otteluiden listassa kun se lähetetään serveriltä.
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
} | null;

/**
 * Virheilmoitus, jota voidaan käyttää kun käyttäjän antama
 * autentikaatio ei vastaa pyyntöä.
 */
class AuthError extends Error {
    constructor(message: string = "Missing authentication.") {
        super(message);
        this.name = this.constructor.name;
    }
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
export { roleIsAtLeast, AuthError };