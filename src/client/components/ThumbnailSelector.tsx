import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getBackendUrl, thumbnailToImageName } from "../utils/apiUtils";

type ThumbnailSelectorProps = {
    selectionCallback: (name: string) => void;
}

/**
 * ThumbnailSelector on primitiivinen vieritettävä esikatselukuvien osio, 
 * jossa kuvia voi valita klikkaamalla.
 * TODO Esikatselukuvat tulisi ladata tarpeen mukaan, ei kaikkia kerralla.
 * HUOM! Ei käytössä tuotantoversiossa.
 */
const ThumbnailSelector: React.FC<ThumbnailSelectorProps> = ({ selectionCallback }) => {
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    
    useEffect(() => {
        const fetchThumbnails = async () => {
            try {
                const response = await axios.get(`${getBackendUrl()}/api/thumbnails`);
                setThumbnails(response.data.thumbnails);
            } catch (error) {
                console.error('Error fetching thumbnails:', error);
            }
        };
        
        fetchThumbnails();
    }, []);
    
    return (
        <div style={{ display: 'flex', height: '90vh' }}>
            <div style={{ width: '215px', height: '100%', overflowX: 'hidden', overflowY: 'scroll', border: '1px solid #ccc' }}>
                {thumbnails.map((thumbnail, index) => (
                    <img key={index} crossOrigin="anonymous" src={`${getBackendUrl()}/api/thumbnails/${thumbnail}`} alt={`${thumbnail}`} onClick={() => selectionCallback(thumbnailToImageName(thumbnail))} />
                ))}
            </div>
        </div>
    );
};
            
export default ThumbnailSelector;
            