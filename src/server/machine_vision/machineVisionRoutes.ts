/**
 * Reittejä konenäköön liittyen.
 * HUOM! Ei käytössä - nämä voi poistaa tuotantoversiossa.
 */

import express, { Router, Request, Response } from "express";
import { Homography } from './homography.js';
import { HoughTransform } from './hough.js';
import { logger } from '../serverErrorHandler.js';

const router: Router = express.Router();

const baseUploadDirectory = process.env.BASE_UPLOAD_DIRECTORY || "/home/userdata";
const imageDirectory = `${baseUploadDirectory}/images`;

/**
 * Reitti homografian testaukseen.
 */
router.post('/homography', async (req: Request, res: Response) => {
    try {
        const imgPath1 = `${imageDirectory}/${req.body.imgName1}`;
        const imgPath2 = `${imageDirectory}/${req.body.imgName2}`;
        console.log("imgPath1", imgPath1);
        console.log("imgPath2", imgPath2);
        const h = new Homography(imgPath1, imgPath2);

        const x = Math.random();

        console.time(`h.execute_${x}`);
        await h.execute();
        console.timeEnd(`h.execute_${x}`);

        console.log("h.data.matches.length", h.data.matches.length);
        res.json({"data": h.data});
    } catch (error) {
        logger.error('Hough transform failed.', error);
        // console.error('Hough transform failed.', error);
        res.status(500).send('Hough transform failed.');
    }
});

/**
 * Reitti Hough-muunnoksen testaamiseksi.
 */
router.post('/hough',  async (req: Request, res: Response) => {
    try {
        console.log("req.body", req.body);
        const imgPath = `${imageDirectory}/${req.body.imgName}`;
        console.log("imgPath", imgPath);
        const hough = await HoughTransform.hough(imgPath);

        // Koodaa kuvat base64-datana URL-osoitteiksi:
        const image1 = `data:image/png;base64,${hough[0].toString('base64')}`;
        const image2 = `data:image/png;base64,${hough[1].toString('base64')}`;

        // Lähetä kuvat JSON-muodossa vastauksessa:
        res.json({ images: [image1, image2] });
    } catch (error) {
        logger.error('Hough transform failed.', error);
        res.status(500).send('Hough transform failed.');
    }
});

export default router;