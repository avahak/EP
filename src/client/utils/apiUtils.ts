/**
 * Apufunktioita frontend ja backend väliseen kommunikointiin.
 */

import { useCallback, useEffect, useState } from 'react';

type Method = "GET" | "POST";

type Props = {
    route: string;
    method?: Method;
    params?: any;
    dataProcessor?: (data: any) => any;
};

type InitialServerFetchResponse = {
    status: {
        ok: boolean;
        message?: any;
    };
    data: any;
};

/**
 * Hakee dataa serveriltä vain sivun lataamisen yhteydessä. 
 */
const useInitialServerFetch = ({ route, method, params, dataProcessor }: Props) => {
    const [response, setResponse] = useState<InitialServerFetchResponse>({
        status: { ok: false, message: "Haetaan dataa.." },
        data: null
    });

    const fetchData = useCallback(async () => {
        try {
            let apiUrl = `${getApiUrl()}${route}`;
            let fetchResponse;
            if (method == "POST") {
                fetchResponse = await fetch(apiUrl, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: !!params ? JSON.stringify({ ...params }) : "",
                });
            } else {
                if (!!params) {
                    const searchParams = new URLSearchParams(params);
                    apiUrl = `${apiUrl}${route}?${searchParams.toString()}`;
                }
                fetchResponse = await fetch(apiUrl);
            }

            if (!fetchResponse.ok) 
                throw new Error(`HTTP error! Status: ${fetchResponse.status}`);

            const jsonData = await fetchResponse.json();
            const processedData = dataProcessor ? dataProcessor(jsonData) : jsonData;
            setResponse({ status: { ok: true }, data: processedData });
        } catch (error) {
            console.error("Error fetching data", error);
            setResponse({ status: { ok: false, message: "Error fetching data" }, data: null });
        }
    }, []);
    // [route, method, JSON.stringify(params)]);
    // HUOM! Tässä JSON.stringify(params) on tehoton mutta toimiva tapa selvittää 
    // onko muutoksia tapahtunut.

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return response;
};


/**
 * Lisää reittiin serverin osoitteen ja kutsuu fetch.
 */
const serverFetch = (route: string, options?: any) => {
    if (options)
        return fetch(`${getApiUrl()}${route}`, options);
    return fetch(`${getApiUrl()}${route}`);
}

/**
 * Apufunktio palvelimen osoitteen muodostamiseksi.
 */
const getApiUrl = () => {
    const port = window.location.hostname === 'localhost' ? ':3001' : '';
    return `${window.location.protocol}//${window.location.hostname}${port}/api`;
};

/**
 * Muuttaa esikatselukuvan nimen varsinaisen kuvan nimeksi poistamalle siitä
 * etu- ja jälkiliitteet.
 */
function thumbnailToImageName(thumbnailName: string) {
    // Regex, joka poistaa alusta "thumbnail_" ja lopusta viimeisen "." jälkeen tulevan osan.
    const regex = /^thumbnail_(.+)\.[a-zA-Z0-9]+$/;
    const match = thumbnailName.match(regex);
    
    if (match && match[1]) {
        return match[1];
    } else {
        // Regex ei osunut - palauta alkuperäinen nimi.
        return thumbnailName;
    }
}

export { getApiUrl, thumbnailToImageName, useInitialServerFetch, serverFetch };