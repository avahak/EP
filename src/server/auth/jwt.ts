/**
 * JWT token luonti ja tarkistus käyttäen kirjastoa jsonwebtoken.
 */

import jwt from 'jsonwebtoken';
import { isAuthTokenPayload } from '../../shared/commonTypes';

const SECRET_KEY = process.env.SECRET_KEY ?? "";

/**
 * Luo uuden JWT tokenin käyttäen salaista avainta SECRET_KEY 
 * koodaten payload datan.
 */
function encodeJWT(payload: any) {
    return jwt.sign(payload, SECRET_KEY, { algorithm: 'HS256' });
}

/**
 * Vahvistaa, että annettu JWT token on luotu samalla SECRET_KEY, joka
 * serverillä on käytössä. Tarkistaa myös että se ei ole vanhentunut ja sisältää 
 * oikeat kentät.
 */
function verifyJWT(token: string) {
    let payload = null;
    try {
        const now = Math.floor(Date.now() / 1000);
        payload = jwt.verify(token, SECRET_KEY);
        if (!payload || !isAuthTokenPayload(payload))
            return null;
        const exp = payload.exp;
        if (exp < now)
            return null;
    } catch (err) {
        return null;
    }
    return payload;
}

export { encodeJWT, verifyJWT };