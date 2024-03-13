/**
 * Reittejä konenäköön liittyen.
 */

import express, { Router, Request, Response } from "express";
import { logger } from '../serverErrorHandler.js';
import { testDecode, testEncode } from "./jwt.js";

const router: Router = express.Router();

/**
 * Reitti Hough-muunnoksen testaamiseksi.
 * testing: http://localhost:3001/test/auth/test
 */
router.get('/test',  async (_req: Request, res: Response) => {
    try {
        testEncode();
        testDecode();
        res.send("See console log" + Date.now());
    } catch (error) {
        logger.error('Fail.', error);
        res.status(500).send('Fail.');
    }
});

export default router;