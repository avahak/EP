/**
 * Sekalaisia reittejä (tässä lähinnä tiedostojen latausta).
 */

import path from 'path';
import fs from 'fs';
import multer from 'multer';

import util from 'util';
import express, { Router, Request, Response } from 'express';
import { createThumbnail } from './imageTools';
const baseUploadDirectory = process.env.BASE_UPLOAD_DIRECTORY || "/home/userdata";
const imageDirectory = `${baseUploadDirectory}/images`;
const thumbnailDirectory = `${baseUploadDirectory}/images/thumbnails`;
const miscDirectory = `${baseUploadDirectory}/misc`;

const router: Router = express.Router();

// Tiedojen lataukseen serverille tarvitaan alustaa multer:
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Muodostetaan lupaus fs.writeFile:sta:
const writeFileAsync = util.promisify(fs.writeFile);

/**
 * Lataa tiedoston serverille. Jos tiedosto on kuva, muodostetaan myös
 * esikatselukuva ja tallennetaan molemmat.
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) {
        res.status(400).send('No file uploaded.');
        return;
    }

    // Tallennushakemistot:
    const imagePath = path.join(imageDirectory, file.originalname);
    const thumbnailPath = path.join(thumbnailDirectory, `thumbnail_${file.originalname}.jpeg`);
    const miscPath = path.join(miscDirectory, file.originalname);
    console.log("BASE_UPLOAD_DIRECTORY", process.env.BASE_UPLOAD_DIRECTORY);
    console.log("miscDirectory", miscDirectory);
    // Tarkistetaan, että kaikki hakemistot ovat olemassa:
    if (!fs.existsSync(imageDirectory) || !fs.existsSync(thumbnailDirectory) || !fs.existsSync(miscDirectory)) {
        const errorMessage = `Upload directory does not exist.`;
        console.error(errorMessage);
        res.status(500).send(errorMessage);
        return;
    }

    try {
        const thumbnailBuffer = await createThumbnail(file.buffer);
        if (thumbnailBuffer) {
            // Tiedosto on kuva:
            await writeFileAsync(imagePath, file.buffer);
            await writeFileAsync(thumbnailPath, thumbnailBuffer);
        } else {
            // Tiedosto ei ole kuva:
            await writeFileAsync(miscPath, file.buffer);
        }
        console.log(`File saved to: ${thumbnailBuffer ? imagePath : miscPath}`);
        res.status(200).send(`Received and saved: ${file.originalname}, size: ${file.size}`);
    } catch (error) {
        console.error('Error saving file or thumbnail:', error);
        res.status(500).send(`Error saving file or thumbnail: ${error}`);
    }
});

// Palauttaa listan esikatselukuvista:
router.get('/thumbnails', (_req, res) => {
    try {
        if (!fs.existsSync(thumbnailDirectory))
            throw Error("No thumbnail directory");
        // Luetaan thumbnailDirectory hakemiston sisältö:
        const thumbnailFiles = fs.readdirSync(thumbnailDirectory);
        res.json({ thumbnails: thumbnailFiles });
    } catch (error) {
        console.error('Error listing thumbnails:', error);
        res.status(500).send('Error listing thumbnails.');
    }
});

/**
 * Palvelee tiedoston pyynnön perusteella baseDirectory hakemistosta.
 */
const serveFile = (req: Request, res: Response, baseDirectory: string) => {
    const filename = req.params.filename;
    const filePath = path.join(baseDirectory, filename);
    try {
        // Jos tiedosto on olemassa, välitetään se:
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).send('File not found.');
        }
    } catch (error) {
        console.error('Error serving file:', error);
        res.status(500).send('Error serving file.');
    }
};

// Välitetään kuvia:
router.get('/images/:filename', (req, res) => serveFile(req, res, imageDirectory));
// Välitetään esikatselukuvia:
router.get('/thumbnails/:filename', (req, res) => serveFile(req, res, thumbnailDirectory));
// Välitetään muita tiedostoja:
router.get('/misc/:filename', (req, res) => serveFile(req, res, miscDirectory));

export default router;