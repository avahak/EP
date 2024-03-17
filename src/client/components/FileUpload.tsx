import { Link } from 'react-router-dom';
import React, { ChangeEvent, FormEvent, useContext, useState } from 'react';
import axios from 'axios';
import { getBackendUrl } from "../utils/apiUtils";
import { AuthenticationContext } from '../contexts/AuthenticationContext';

/**
 * Komponentti tiedostojen lataamiseen palvelimelle.
 * HUOM! Ei käytössä tuotantoversiossa, vain primitiivinen kehitystyökalu.
 */
const FileUpload: React.FC = () => {
    const authenticationState = useContext(AuthenticationContext);
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
            const apiUrl = `${getBackendUrl()}/api/upload`;
            const token = (await authenticationState.getAccessToken()) ?? "";
            const response = await axios.post(apiUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
            });
            setMessage(response.data);
        } catch (error) {
            console.error('Error uploading file:', error);
            setMessage(`Error uploading file: ${error}`);
        }
    };

    return (
        <>
        <Link to="/">Back</Link>
        <div style={{padding: "10px"}}>
            <h1>Upload image/file</h1>
            <form onSubmit={onFormSubmit}>
                <input type="file" onChange={handleFileChange} />
                <button type="submit">Upload</button>
                {message && <p>{message}</p>}
            </form>
        </div>
        </>);
};

export default FileUpload;
