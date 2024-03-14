/**
 * Reittejä konenäköön liittyen.
 */

import express, { Router, Request, Response } from "express";
import { logger } from '../serverErrorHandler.js';
import { encode } from "./jwt.js";

const router: Router = express.Router();

/**
 * JWT token testaukseen
 */
router.post('/create_token', async (req: Request, res: Response) => {
    try {
        const name = req.body.name;
        const team = req.body.team;
        console.log("name", name, "team", team);
        const token = encode({ Nimi: name, Joukkue: team });
        res.json({ token });
    } catch (error) {
        logger.error('Fail.', error);
        res.status(500).send('Fail.');
    }
});

export default router;