/**
 * ThumbnailSelector is a scrollable container of thumbnails that can be clicked.
 * TODO The thumbnails should be loaded lazily.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl, thumbnailToImageName } from "../utils/apiUtils";

type ThumbnailSelectorProps = {
    selectionCallback: (name: string) => void;
}

const apiUrl = getApiUrl();

const ThumbnailSelector: React.FC<ThumbnailSelectorProps> = ({ selectionCallback }) => {
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    
    useEffect(() => {
        const fetchThumbnails = async () => {
            try {
                const response = await axios.get(`${apiUrl}/thumbnails`);
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
                    <img key={index} src={`${apiUrl}/thumbnails/${thumbnail}`} alt={`${thumbnail}`} onClick={() => selectionCallback(thumbnailToImageName(thumbnail))} />
                ))}
            </div>
        </div>
    );
};
            
export default ThumbnailSelector;
            