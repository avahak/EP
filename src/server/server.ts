/**
 * Express.js serveri Reactille ja SQL-kyselyille. Api-rajapinnan 
 * reittien esiliitteenä on /api.
 */

import util from 'util';
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { Homography } from './homography.js';
// import { test } from './test.js';
import { HoughTransform } from './hough.js';
import multer from 'multer';
import { createThumbnail } from './imageTools.js';

dotenv.config();

// interface User extends RowDataPacket {
//     id: number;
//     email: string;
// }

const app = express();
const PORT = 3001;
const baseUploadDirectory = process.env.BASE_UPLOAD_DIRECTORY || "/home/userdata";
const imageDirectory = `${baseUploadDirectory}/images`;
const thumbnailDirectory = `${baseUploadDirectory}/images/thumbnails`;
const miscDirectory = `${baseUploadDirectory}/misc`;

const __dirname = process.cwd();

// Välitä staattisia tiedostoja 'dist' hakemistosta
app.use(express.static(path.join(__dirname, 'dist')));

// Kaikki reitit käyttävät CORS-politiikkaa:
app.use(cors());
// Määritetään middleware JSON-parsija.
app.use(express.json());

// Tiedojen lataukseen serverille tarvitaan alustaa multer:
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Muodostetaan lupaus fs.writeFile:sta:
const writeFileAsync = util.promisify(fs.writeFile);

// @ts-ignore
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// @ts-ignore
const poolEP = mysql.createPool({
    host: process.env.EP_DB_HOST,
    port: parseInt(process.env.EP_DB_PORT || '3306'),
    user: process.env.EP_DB_USER,
    password: process.env.EP_DB_PASSWORD,
    database: process.env.EP_DB_NAME
});

/**
 * Reitti homografian testaukseen.
 */
app.post('/api/homography', async (req: Request, res: Response) => {
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
        console.error('Hough transform failed.', error);
        res.status(500).send('Hough transform failed.');
    }
});

/**
 * Reitti Hough-muunnoksen testaamiseksi.
 */
app.post("/api/hough",  async (req: Request, res: Response) => {
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
        console.error('Hough transform failed.', error);
        res.status(500).send('Hough transform failed.');
    }
});

/**
 * Lataa tiedoston serverille. Jos tiedosto on kuva, muodostetaan myös
 * esikatselukuva ja tallennetaan molemmat.
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
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
app.get('/api/thumbnails', (_req, res) => {
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
app.get('/api/images/:filename', (req, res) => serveFile(req, res, imageDirectory));
// Välitetään esikatselukuvia:
app.get('/api/thumbnails/:filename', (req, res) => serveFile(req, res, thumbnailDirectory));
// Välitetään muita tiedostoja:
app.get('/api/misc/:filename', (req, res) => serveFile(req, res, miscDirectory));

/**
 * SQL-tietokannan testausta (ei käytössä)
 */
app.get('/api/schema', async (_req, res) => {
    // res.json({ 
    //     DB_HOST: process.env.DB_HOST,
    //     DB_PORT: process.env.DB_PORT,
    //     DB_NAME: process.env.DB_NAME,
    //     EP_DB_HOST: process.env.EP_DB_HOST,
    //     EP_DB_PORT: process.env.EP_DB_PORT,
    //     EP_DB_NAME: process.env.EP_DB_NAME,
    // });

    try {
        const [rows] = await poolEP.query<any>('SHOW TABLES');

        res.json({ rows });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * Muissa reiteissä käytetään Reactin omaa reititystä.
 */
app.get('*', (_req, res) => {
    console.log("*:", _req.url);
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Käynnistetään express.js serveri:
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
