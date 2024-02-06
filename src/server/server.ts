import util from 'util';
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
// import mysql, { RowDataPacket } from 'mysql2/promise';
import dotenv from 'dotenv';
import { Homography } from './homography.js';
import { test } from './test.js';
import { HoughTransform } from './hough.js';
import multer from 'multer';
import { createThumbnail } from './imageTools.js';

// interface User extends RowDataPacket {
//     id: number;
//     email: string;
// }

const app = express();
const PORT = 3001;
const imageDirectory = '/home/userdata/images';
const thumbnailDirectory = '/home/userdata/images/thumbnails';

const __dirname = process.cwd();

dotenv.config();

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve static files from the 'public' directory
// app.use('public', express.static(path.join(__dirname, 'public')));

// Enable CORS for all routes
app.use(cors());
// Middleware to parse JSON bodies
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Promisify fs.writeFile
const writeFileAsync = util.promisify(fs.writeFile);

// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     port: parseInt(process.env.DB_PORT || '3306', 10),
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME
// });

// app.get('/api/anecdotes', (_req: Request, res: Response) => {
//     try {
//         // Load anecdotes from data.json
//         const data = fs.readFileSync(path.join(__dirname, 'data.json'), 'utf-8');
//         const anecdotes = JSON.parse(data);
//         res.json(anecdotes);
//     } catch (error: any) {
//         console.error('Error reading data.json:', error.message);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// app.get('/users', async (_req: Request, res: Response) => {
//     try {
//         const [rows] = await pool.query<User[]>('SELECT * FROM users');

//         const userListHtml = rows.map(user => {
//             return `<li>${user.id}: ${user.email}</li>`;
//         }).join('');

//         const html = `<ul>${userListHtml}</ul>`;
//         res.send(html);
//     } catch (error) {
//         console.error('Error executing query:', error);
//         res.status(500).send('Internal Server Error');
//     }
// });

app.post('/homography', async (req: Request, res: Response) => {
    const imgUrl1 = `./public/${req.body.imgUrl1}`;
    const imgUrl2 = `./public/${req.body.imgUrl2}`;
    console.log("imgUrl1", imgUrl1);
    console.log("imgUrl2", imgUrl2);
    const h = new Homography(imgUrl1, imgUrl2);

    const x = Math.random();

    console.time(`h.execute_${x}`);
    await h.execute();
    console.timeEnd(`h.execute_${x}`);

    console.log("h.data.matches.length", h.data.matches.length);
    res.json({"data": h.data});
});

app.get("/opencv", async (_req: Request, _res: Response) => {
    test();
});

app.post("/hough",  async (req: Request, res: Response) => {
    console.log("req.body", req.body);
    const imgUrl = `./public/${req.body.imgUrl}`;
    console.log("imgUrl", imgUrl);
    const hough = await HoughTransform.hough(imgUrl);

    // Encode the images as base64 data URLs
    const image1 = `data:image/png;base64,${hough[0].toString('base64')}`;
    const image2 = `data:image/png;base64,${hough[1].toString('base64')}`;

    // Send the images as JSON in the response
    res.json({ images: [image1, image2] });
});

/**
 * Upload an image to the server. It creates a thumbnail of the image¨
 * and stores both the image and the thumbnail on the file system.
 */
app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) {
        res.status(400).send('No file uploaded.');
        return;
    }

    // Directory to save the file in:
    const imagePath = path.join(imageDirectory, file.originalname);
    const thumbnailPath = path.join(thumbnailDirectory, `thumbnail_${file.originalname}.jpeg`);
    // Check if the target directory exists
    if (!fs.existsSync(imageDirectory) || !fs.existsSync(thumbnailDirectory)) {
        const errorMessage = `Image directory does not exist.`;
        console.error(errorMessage);
        res.status(500).send(errorMessage);
        return;
    }

    try {
        await writeFileAsync(imagePath, file.buffer);
        const thumbnailBuffer = await createThumbnail(file.buffer);
        if (!thumbnailBuffer) {
            res.status(500).send("Creating thumbnail failed.");
            return;
        }
        await writeFileAsync(thumbnailPath, thumbnailBuffer);
        console.log(`File saved to: ${imagePath}`);
        res.status(200).send(`Received and saved thumbnail and image: ${file.originalname}, size: ${file.size}`);
    } catch (error) {
        console.error('Error saving file or thumbnail:', error);
        res.status(500).send(`Error saving file or thumbnail: ${error}`);
    }
});

// List all thumbnails
app.get('/thumbnails', (_req, res) => {
    try {
        if (!fs.existsSync(thumbnailDirectory))
            throw Error("No thumbnail directory");
        // Read the contents of the thumbnails directory
        const thumbnailFiles = fs.readdirSync(thumbnailDirectory);
        res.json({ thumbnails: thumbnailFiles });
    } catch (error) {
        console.error('Error listing thumbnails:', error);
        res.status(500).send('Error listing thumbnails.');
    }
});

// Serve a specific thumbnail
app.get('/thumbnails/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(thumbnailDirectory, filename);
    try {
        // If the file exists, serve it:
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).send('Thumbnail not found.');
        }
    } catch (error) {
        console.error('Error serving thumbnail:', error);
        res.status(500).send('Error serving thumbnail.');
    }
});

// Serve a specific image
app.get('/images/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(imageDirectory, filename);
    try {
        // If the file exists, serve it:
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).send('Image not found.');
        }
    } catch (error) {
        console.error('Error serving image:', error);
        res.status(500).send('Error serving image.');
    }
});

// For any other routes, serve the React app
app.get('*', (_req, res) => {
    console.log("*:", _req.url);
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
