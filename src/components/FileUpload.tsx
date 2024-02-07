/**
 * File upload tool for internal use only.
 */

import React, { ChangeEvent, FormEvent, useState } from 'react';
import axios from 'axios';

const FileUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState('');
    
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };
    
    const onFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!file) {
            setMessage('No file selected.');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const port = (window.location.hostname == "localhost") ? ":3001" : "";
            const apiUrl = `${window.location.protocol}//${window.location.hostname}${port}/api/upload`;
            const response = await axios.post(apiUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setMessage(response.data);
        } catch (error) {
            console.error('Error uploading file:', error);
            setMessage(`Error uploading file: ${error}`);
        }
    };

    return (
        <div>
        <h1>Upload image/file</h1>
        <form onSubmit={onFormSubmit}>
        <input type="file" onChange={handleFileChange} />
        <button type="submit">Upload</button>
        {message && <p>{message}</p>}
        </form>
        </div>
        );
};

export default FileUpload;
