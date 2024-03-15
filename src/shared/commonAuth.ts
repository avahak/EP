/**
 * Tyyppi JWT tokenin payloadille. Tätä käytetään sekä refresh, että access tokeneissa.
 */
type AuthTokenPayload = {
    name: string,
    team: string,
    role: string,
    iat: number,
    exp: number,
} | null;

/**
 * Kustomoitu virheilmoitus, jota voidaan käyttää kun käyttäjän antama
 * autentikaatio ei vastaa pyyntöä.
 */
class AuthError extends Error {
    constructor(message: string = "Missing authentication.") {
        super(message);
        this.name = this.constructor.name;
    }
}

/**
 * Apufunktio, joka tarkistaa onko annettu rooli vähintään minimirooli.
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

export type { AuthTokenPayload };
export { roleIsAtLeast, AuthError };