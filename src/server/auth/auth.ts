/**
 * Middleware määritelmiä käyttäjän autentikointiin liittyen.
 */

import express, { Router, Request, Response, NextFunction } from "express";
import { logger } from '../serverErrorHandler.js';
import { encode, verify } from "./jwt.js";
import { AuthTokenPayload, roleIsAtLeast } from "../../shared/commonAuth.js";

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
        const payload = verify(token);
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
 * JWT token testaukseen, luo JWT tokenin.
 * HUOM! Poista production versiossa.
 */
router.post('/create_token', async (req: Request, res: Response) => {
    try {
        const name = req.body.name;
        const team = req.body.team;
        const role = req.body.role;
        const payload: AuthTokenPayload = { name, team, role };
        console.log("creating token with payload:", payload);
        const token = encode(payload);
        res.json({ token });
    } catch (error) {
        logger.error('Error.', error);
        res.status(500).send('Error.');
    }
});

export type { RequestWithAuth };
export { router as authRouter, injectAuth, requireAuth };