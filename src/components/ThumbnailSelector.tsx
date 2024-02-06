/**
 * ThumbnailSelector is a scrollable container of thumbnails that can be clicked.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const port = (window.location.hostname == "localhost") ? ":3001" : "";
const backendUrl = `${window.location.protocol}//${window.location.hostname}${port}`;

type ThumbnailSelectorProps = {
    selectionCallback: (thumbnail: string) => void;
}

const ThumbnailSelector: React.FC<ThumbnailSelectorProps> = ({ selectionCallback }) => {
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    
    useEffect(() => {
        const fetchThumbnails = async () => {
            try {
                const response = await axios.get(`${backendUrl}/thumbnails`);
                setThumbnails(response.data.thumbnails);
            } catch (error) {
                console.error('Error fetching thumbnails:', error);
            }
        };
        
        fetchThumbnails();
    }, []);
    
    return (
        <div style={{ display: 'flex', height: '100%' }}>
            <div style={{ width: '200px', height: '100%', overflowY: 'scroll', border: '1px solid #ccc' }}>
                <ul>
                    {thumbnails.map((thumbnail, index) => (
                        <li key={index} onClick={() => selectionCallback(thumbnail)}>
                            <img src={`${backendUrl}/thumbnails/${thumbnail}`} alt={`${thumbnail}`} />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
            
export default ThumbnailSelector;
            