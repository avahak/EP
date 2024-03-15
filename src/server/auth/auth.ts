/**
 * Middleware määritelmiä käyttäjän autentikointiin liittyen.
 */

import express, { Router, Request, Response, NextFunction } from "express";
import { logger } from '../serverErrorHandler.js';
import { encodeJWT, verifyJWT } from "./jwt.js";
import { AuthTokenPayload, roleIsAtLeast } from "../../shared/commonAuth.js";
import { findUserInDatabase } from "../database/dbSpecific.js";

const HOUR_s = 3600;
const DAY_s = 24*HOUR_s;

const router: Router = express.Router();

/**
 * Lisää Request objektiin auth kentän, johon JWT token payload voidaan tallettaa.
 */
interface RequestWithAuth extends Request {
    auth?: AuthTokenPayload; 
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
        if (payload && typeof payload === 'object') {
            // Lisää payload req objektiin:
            req.auth = payload as AuthTokenPayload;
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
 * HUOM! Poista production versiossa. Silloin tämä tehdään vain PHP puolella.
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
        const oldRefreshTokenPayload = verifyJWT(oldRefreshToken) as AuthTokenPayload;
        if (!oldRefreshTokenPayload)
            return res.status(401).send("Unable to verify token.");

        // Tarkistetaan käyttäjä tietokannasta. Jos ei löydy, poistetaan
        // remember token ja access token frontend puolella:
        const rows = await findUserInDatabase(oldRefreshTokenPayload.name, oldRefreshTokenPayload.team);
        if (!Array.isArray(rows) || rows.length === 0)
            return res.status(403).send("Forbidden.");

        const now = Math.floor(Date.now() / 1000);

        const newRefreshTokenPayload = { ...oldRefreshTokenPayload, iat: now, exp: now + 90*DAY_s };
        const accessTokenPayload = { ...oldRefreshTokenPayload, iat: now, exp: now + 1*HOUR_s };

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