import { useEffect, useState } from 'react';
// import Draw from './DrawHough.js';
import { getApiUrl } from "../utils/apiUtils";

const Hough = () => {
    const [images, setImages] = useState<any[]>([]);
    
    const fetchHough = async () => {
        try {
            const imageUrl = './test_image.jpg';
            
            const apiUrl = `${getApiUrl()}/hough`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imgUrl: imageUrl }),
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
    }, []);

    return (
        <div>
            {images.map((image, index) => (
            <img key={index} src={image.dataUrl} alt={`Image ${index}`} />
            ))}
        </div>
        );
};
    
export default Hough;
    