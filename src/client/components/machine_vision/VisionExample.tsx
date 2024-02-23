import axios from 'axios';
import { useEffect, useRef } from "react";
import { getApiUrl } from "../../utils/apiUtils";
import { Link } from 'react-router-dom';

const apiUrl = getApiUrl();
// Google Vision API palauttama json-tiedosto, tämä korvataan varsinaisessa käytössä
// api-kutsun vastauksella
const exampleName = `google_vision_api_IMG-20231128-WA0002.json`;
// Esimerkkinä oleva kuva:
const imageName = `IMG-20231128-WA0002.jpg`;

/**
 * Piirretään esimerkki pöytäkirjan lukemisesta Google Vision API:lla.
 */
const VisionExample: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const fetchExampleJson = async () => {
        const x = await axios.get(`${apiUrl}/misc/${exampleName}`);
        const annotations = x.data.textAnnotations;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const image = new Image();
        image.src = `${apiUrl}/images/${imageName}`;
        image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            ctx.font = '20px Arial';

            annotations.forEach((annotation: any, index: number) => {
                if (index == 0)
                    return;
                const bbVertices = annotation.boundingPoly.vertices;
                // console.log(bbVertices);
                const text = annotation.description;

                // Draw bounding box for the annotation:
                ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
                ctx.beginPath();
                ctx.moveTo(bbVertices[0].x, bbVertices[0].y);
                let textPos = {...bbVertices[0]};
                for (let k = 1; k < bbVertices.length; k++) {
                    ctx.lineTo(bbVertices[k].x, bbVertices[k].y);
                    textPos.x += bbVertices[k].x;
                    textPos.y = Math.min(textPos.y, bbVertices[k].y);
                }
                textPos.x = textPos.x / bbVertices.length;
                ctx.closePath();
                ctx.fill();

                const textMetrics = ctx.measureText(text);
                textPos.x = textPos.x - textMetrics.width/2;
                textPos.y = textPos.y - 2;

                // Draw text for the annotation:
                ctx.fillStyle = 'rgb(0, 0, 255)';
                ctx.fillText(text, textPos.x, textPos.y);
            });
        };
    };

    useEffect(() => {
        fetchExampleJson();
    }, []);

    return (
        <>
        <div style={{padding: '10px'}}>
            <Link to="/">Back</Link>
            <br />
            Alla on esimerkki <Link to="https://cloud.google.com/vision?hl=en">Google Vision API</Link> tekstintunnistuksesta.
            Se palauttaa JSON tiedostossa löydetyt tekstit (sinisellä) 
            ja niiden koordinaatit (bounding box on punaisella). Kuten näkyy,
            tuloksia joutuu tulkitsemaan vähän (esim V on luettu symbolina "&gt;") ja
            jotain virheitä löytyy (Oruo vs Orvo) ja suoria viivoja ei ole tulkittu
            numerona 1. Tulos alla on kuitenkin hyvä ja sitä voisi käyttää (prosessoituna).
        </div>
        <div>
        <canvas ref={canvasRef} />
        <h1>Original image:</h1>
        <img src={`${apiUrl}/images/IMG-20231128-WA0002.jpg`} />
        </div>
        </>
    );
};
            
export default VisionExample;
            