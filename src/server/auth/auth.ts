/**
 * Reittejä ja middleware määritelmiä käyttäjän autentikointiin liittyen.
 * 
 * Perusidea JWT-token autentikoinnissa on, että JWT-token on merkkijono, joka 
 * koodaa dataa. Sen voi lukea kuka tahansa mutta sen muuttaminen on rajoitettu 
 * kryptografisesti, joten palvelin voi aina varmista siitä, onko se itse luonut
 * annetun tokenin. Tämä ominaisuus tekee JWT tokenista luotettavan tavan todentaa
 * käyttäjän identiteetti.
 *     Kun käyttäjä kirjautuu sisään, palvelin luo ja lähettää käyttäjälle
 * JWT-tokenin. Käyttäjän selain tallettaa tämän local storageen ja esittää sen 
 * palvelimelle digitaalisena "henkilökorttina" suojattuja API-reittejä käytettäessä. 
 * Palvelin tarkistaa tokenin varmistaen, että se on voimassa ja palvelimen luoma.
 *     Käytännössä käytetään kahta JWT-tokenia: refresh token ja access token.
 * Molemmat sisältävät tiedot käyttäjän identifikaatioon mutta niitä käytetään eri tavalla. 
 * Access token on lyhytikäinen (esim. 1h) token, joka välitetään palvelimelle 
 * Authorization headerissa suojatuilla API-reiteillä. Palvelin tunnistaa 
 * käyttäjän access tokenin perusteella. Refresh token on pitkäikäinen (esim. 3kk), 
 * ja sitä käytetään uusien access tokenien luomiseen, kun se välitetään palvelimelle. 
 *     Kahden tokenin käyttäminen auttaa suojaamaan sovellusta: access tokenin 
 * lyhytikäisyys vähentää riskejä, jos se joutuu vääriin käsiin, ja refresh tokenin 
 * pitkäikäisyys tarjoaa käyttäjälle mukavuutta, kun hänen ei tarvitse kirjautua 
 * uudelleen sisään usein. Yhdellä tokenilla molemmat edut eivät olisi mahdollisia
 * samanaikaisesti.
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
 * Middleware, joka lukee JWT-tokenin Authorization headerista. Jos token on olemassa ja
 * vahvistetaan oikeaksi, se talletetaan req.auth kenttään. Muutoin asetetaan
 * req.auth = null.
 */
const injectAuth = (req: RequestWithAuth, res: Response, next: NextFunction) => {
    let authPayload: AuthTokenPayload|null = null;
    try {
        const authHeader = req.headers['authorization'];

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            const verifyResult = verifyJWT(token);
            if (verifyResult.message == "Expired") {
                // Access token on vanhentunut - hylätään pyyntö jo tässä vaiheessa
                if (!res.headersSent) {
                    // Lähetetään custom viesti, jotta React puolella tiedetään, että
                    // access token on vanhentunut.
                    res.setHeader('X-Token-Expired', 'true');  // custom header
                    res.setHeader('Access-Control-Expose-Headers', 'X-Token-Expired');
                    return res.status(401).send("Expired access token");
                }
                return;
            }
            if (verifyResult.payload) {
                authPayload = verifyResult.payload;
                Object.freeze(authPayload);
            }
        }
    } catch (error) {
        logger.error("Error during injectAuth", error);
    }
    // Lisää authPayload req objektiin niin, että sitä ei voi enää muuttaa:
    Object.defineProperty(req, 'auth', {
        value: authPayload,
        writable: false,
        configurable: false,
        enumerable: true
    });

    next();
};

/**
 * Palauttaa middlewaren, joka vaatii käyttäjän autentikaatiota ja valinnaisesti
 * tiettyä käyttäjän roolia pyynnön etenemiseksi.
 * Huom! Tätä ennen on käytettävä injectAuth middlewarea req.auth asettamiseksi.
 */
const requireAuth = (requiredRole: string|null = null) => {
    return (req: RequestWithAuth, res: Response, next: NextFunction) => {
        let isVerified = false;
        try {
            if (isAuthTokenPayload(req.auth)) {
                if (roleIsAtLeast(req.auth.role, requiredRole))
                    isVerified = true;
            }
        } catch (error) {
            logger.error("Error in requireAuth", error);
        }
        if (!isVerified) {
            if (!res.headersSent)
                return res.status(401).send('Unauthorized request.');
            return;
        }
        if (isVerified)
            next();
    };
};

/**
 * JWT token testaukseen, luo JWT refresh tokenin.
 * HUOM! Vain testaukseen, poista production versiossa. Silloin tämä tehdään 
 * vain PHP puolella.
 */
router.post('/create_refresh_token', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const name = req.body.name;
        const team = req.body.team;
        const role = req.body.role;
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + 90*DAY_s;
        const payload: AuthTokenPayload = { name, team, role, iat, exp };
        // console.log("creating refresh token with payload:", payload);
        const token = encodeJWT(payload);
        if (!res.headersSent)
            res.json({ token });
    } catch (error) {
        logger.error('Error creating refresh token.', error);
        next();
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
router.post('/create_access_token', async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body.refresh_token || typeof req.body.refresh_token !== 'string') {
            logger.info("/create_access_token missing token");
            if (!res.headersSent)
                return res.status(400).send("Missing token.");
            return;
        }
        const oldRefreshToken = req.body.refresh_token;
        const oldRefreshTokenPayload = verifyJWT(oldRefreshToken).payload;
        if (!isAuthTokenPayload(oldRefreshTokenPayload)) {
            logger.info("/create_access_token invalid token");
            if (!res.headersSent)
                return res.status(401).send("Unable to verify token.");
            return;
        }

        // Tarkistetaan käyttäjä tietokannasta. Jos ei löydy, poistetaan
        // remember token ja access token frontend puolella:
        const rows = await findUserInDatabase(oldRefreshTokenPayload.name, oldRefreshTokenPayload.team);
        if (!Array.isArray(rows) || rows.length !== 1) {
            logger.warn("/create_access_token no user in database");
            if (!res.headersSent)
                return res.status(403).send("Forbidden.");
            return;
        }

        const now = Math.floor(Date.now() / 1000);

        const newRefreshTokenPayload = { ...oldRefreshTokenPayload, iat: now, exp: now+REFRESH_TOKEN_DURATION };
        const accessTokenPayload = { ...oldRefreshTokenPayload, iat: now, exp: now+ACCESS_TOKEN_DURATION };

        const newRefreshToken = encodeJWT(newRefreshTokenPayload);
        const accessToken = encodeJWT(accessTokenPayload);
        logger.info("/create_access_token issued new tokens");
        if (!res.headersSent)
            res.json({ refresh_token: newRefreshToken, access_token: accessToken });
    } catch (error) {
        next(error);
    }
});

export type { RequestWithAuth };
export { router as authRouter, injectAuth, requireAuth };