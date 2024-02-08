import { useEffect, useState } from 'react';
// import Draw from './DrawHough.js';
import { getApiUrl } from "../utils/apiUtils";
import ThumbnailSelector from './ThumbnailSelector';
import { Link } from 'react-router-dom';

const Hough = () => {
    const [imageName, setImageName] = useState<string>("card.png");
    const [images, setImages] = useState<any[]>([]);
    
    const fetchHough = async () => {
        try {
            console.log("imageName", imageName);
            
            const apiUrl = `${getApiUrl()}/hough`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imgName: imageName }),
            });
        
            if (response.ok) {
                const jsonResponse = await response.json();
                const newImages = jsonResponse.images.map((base64Url: string) => ({
                    img: new Image(),
                    dataUrl: base64Url,
                }));
                setImages(newImages);
            } else {
                console.error('Error:', response.statusText);
            }
        } catch(error) {
            console.error('Error:', error);
        }
    };

    useEffect(() => {
        fetchHough();
    }, [imageName]);

    return (
        <>
        <Link to="/">Back</Link>
        <br />
        Alla on (osittain keskeneräinen) esimerkki <Link to="https://en.wikipedia.org/wiki/Hough_transform">Hough-muunnoksesta</Link>, jolla 
        löydetään viivoja kuvista. Koska pöytäkirjoissa on vahvat viivat
        kenttiä rajaamassa, ne voidaan löytää täytetystä pöytäkirjasta
        ja pöytäkirjan mallista. Jos tämän jälkeen löydetään vastaavuus
        vahvimpien löydettyjen viivojen välillä, niin kuvattu pöytäkirja
        voidaan palauttaa pöytäkirjan malliin ja edetä Homografian avulla
        kuten piirteiden tapauksessa.
        <br />
        Alla voi valita vasemmalla pöytäkirjan (voi scrollata) ja 
        oikealla piirretään vahvimmat löydetyt viivat punaisilla viivoilla
        (algoritmi ei ole optimoitu ja se löytää "vääriä" viivoja).
        <br />
        <div style={{display: 'flex'}}>
            <ThumbnailSelector selectionCallback={(name) => setImageName(name)}/>
            <div>
                {images.map((image, index) => (
                <img key={index} src={image.dataUrl} alt={`Image ${index}`} />
                ))}
            </div>
        </div>
        </>
        );
};
    
export default Hough;
    