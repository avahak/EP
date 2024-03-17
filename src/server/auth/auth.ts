/**
 * Reittejä ja middleware määritelmiä käyttäjän autentikointiin liittyen.
 * 
 * Perusidea JWT token autentikoinnissa on, että JWT token on merkkijono, joka 
 * koodaa dataa. Sen voi lukea kuka tahansa mutta sen muuttaminen on rajoitettu 
 * kryptografisesti, joten palvelin voi aina tietää, onko se itse luonut sille
 * annetun tokenin. Tämä ominaisuus tekee JWT tokenista luotettavan tavan todentaa
 * käyttäjän identiteetti.
 *     Kun käyttäjä kirjautuu sisään, palvelin luo ja lähettää käyttäjälle
 * JWT tokenin. Käyttäjä tallettaa tämän local storageen ja esittää sen palvelimelle
 * digitaalisena "henkilökorttina" suojattuja API-reittejä käytettäessä. Palvelin 
 * tarkistaa tokenin ja varmistaa, että se on voimassa ja palvelimen luoma.
 *     Käytännössä käytetään kahta JWT tokenia: refresh token ja access token.
 * Molemmat sisältävät tiedot käyttäjän identifikaatioon mutta niitä käytetään eri tavalla. 
 * Access token on lyhytikäinen token, joka välitetään serverille Authorization
 * headerissa suojatuilla API-reiteillä ja palvelin tunnistaa käyttäjän tämän 
 * perusteella. Refresh token on pitkäikäinen token, ja sitä käytetään uusien 
 * access tokenien luomiseen kun se välitetään palvelimelle. Syy kahden tokenin 
 * käyttämiseen on se, että näin lievitetään yhtä JWT tokenien heikkoutta: 
 * kun token on annettu, sen antamista on vaikea peruuttaa nopeasti. 
 * Refresh token on pitkäikäinen, jotta käyttäjän ei tarvitse kirjautua 
 * uudelleen sisään usein. Access token on lyhytikäinen, jotta se ei olisi 
 * voimassa kauan sen mahdollisen peruuttamisen jälkeen.
 * Lisää tietoa: https://en.wikipedia.org/wiki/JSON_Web_Token
 */

import express, { Router, Request, Response, NextFunction } from "express";
import { logger } from '../serverErrorHandler.js';
import { encodeJWT, verifyJWT } from "./jwt.js";
import { AuthTokenPayload, isAuthTokenPayload, roleIsAtLeast } from "../../shared/commonTypes.js";
import { myQuery } from "../database/dbGeneral.js";
import { pool } from "../database/dbConnections.js";

const HOUR_s = 3600;
const DAY_s = 24*HOUR_s;

/**
 * Refresh tokenin kesto.
 */
const REFRESH_TOKEN_DURATION = 90*DAY_s;
/**
 * Access tokenin kesto.
 */
const ACCESS_TOKEN_DURATION = 1*HOUR_s;

const router: Router = express.Router();

/**
 * Lisää Request objektiin auth kentän, johon JWT token payload voidaan 
 * tarvittaessa tallettaa.
 */
interface RequestWithAuth extends Request {
    auth?: AuthTokenPayload | null; 
};

/**
 * Middleware, joka lukee JWT tokenin Authorization headerista. Jos token on olemassa ja
 * vahvistetaan oikeaksi, se talletetaan req.auth kenttään. Muutoin asetetaan
 * req.auth = null.
 */
const injectAuth = (req: RequestWithAuth, _res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    req.auth = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const payload = verifyJWT(token);
        if (isAuthTokenPayload(payload)) {
            // Lisää payload req objektiin:
            req.auth = payload;
        }
    }

    next();
};

/**
 * Palauttaa middlewaren, joka vaatii käyttäjän autentikaatiota ja valinnaisesti
 * tiettyä käyttäjän roolia pyynnön etenemiseksi.
 * Huom! Tätä ennen on käytettävä injectAuth middlewarea req.auth asettamiseksi.
 */
const requireAuth = (requiredRole: string | null = null) => {
    return (req: RequestWithAuth, res: Response, next: NextFunction) => {
        let isVerified = false;
        if ("auth" in req && req.auth && typeof req.auth === 'object' && "role" in req.auth) {
            if (roleIsAtLeast(req.auth.role as string, requiredRole))
                isVerified = true;
        }
        if (!isVerified) 
            return res.status(401).send('Unauthorized request.');
    
        next();
    };
};

/**
 * JWT token testaukseen, luo JWT refresh tokenin.
 * HUOM! Vain testaukseen, poista production versiossa. Silloin tämä tehdään 
 * vain PHP puolella.
 */
router.post('/create_refresh_token', async (req: Request, res: Response) => {
    try {
        const name = req.body.name;
        const team = req.body.team;
        const role = req.body.role;
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + 90*DAY_s;
        const payload: AuthTokenPayload = { name, team, role, iat, exp };
        console.log("creating refresh token with payload:", payload);
        const token = encodeJWT(payload);
        res.json({ token });
    } catch (error) {
        logger.error('Error.', error);
        res.status(500).send('Error.');
    }
});

/**
 * Tarkistaa onko käyttäjä tietokannan taulussa userpw.
 */
async function findUserInDatabase(name: string, team: string) {
    const query = "SELECT * FROM userpw WHERE Nimi=? AND Joukkue=?";
    return myQuery(pool, query, [name, team]);
}

/**
 * Luo uuden access tokenin annetun refresh tokenin pohjalta.
 * Palauttaa myös uuden refresh tokenin ("Refresh Token Rotation").
 * Ks. https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation
 */
router.post('/create_access_token', async (req: Request, res: Response) => {
    console.log("/create_access_token");
    console.log("req.body.refresh_token", req.body.refresh_token);
    try {
        if (!req.body.refresh_token || typeof req.body.refresh_token !== 'string')
            return res.status(400).send("Missing token.");
        const oldRefreshToken = req.body.refresh_token;
        const oldRefreshTokenPayload = verifyJWT(oldRefreshToken);
        if (!isAuthTokenPayload(oldRefreshTokenPayload))
            return res.status(401).send("Unable to verify token.");

        // Tarkistetaan käyttäjä tietokannasta. Jos ei löydy, poistetaan
        // remember token ja access token frontend puolella:
        const rows = await findUserInDatabase(oldRefreshTokenPayload.name, oldRefreshTokenPayload.team);
        if (!Array.isArray(rows) || rows.length === 0)
            return res.status(403).send("Forbidden.");

        const now = Math.floor(Date.now() / 1000);

        const newRefreshTokenPayload = { ...oldRefreshTokenPayload, iat: now, exp: now + REFRESH_TOKEN_DURATION };
        const accessTokenPayload = { ...oldRefreshTokenPayload, iat: now, exp: now + ACCESS_TOKEN_DURATION };

        const newRefreshToken = encodeJWT(newRefreshTokenPayload);
        const accessToken = encodeJWT(accessTokenPayload);
        console.log("/create_access_token done with", { refresh_token: newRefreshToken, access_token: accessToken });
        res.json({ refresh_token: newRefreshToken, access_token: accessToken });
    } catch (error) {
        logger.error('Error.', error);
        res.status(500).send('Error.');
    }
});

export type { RequestWithAuth };
export { router as authRouter, injectAuth, requireAuth };