/**
 * Sekalaisia yleiseen käyttöön tarkoitettuja apufunktioita, esimerkiksi
 * päivämäärämuunnoksia.
 */

import { isObject, isEqual } from 'lodash';
import { useEffect, useRef } from 'react';

const DAY_NAMES = [
    ['Sunnuntai', 'Su'], 
    ['Maanantai', 'Ma'], 
    ['Tiistai', 'Ti'], 
    ['Keskiviikko', 'Ke'], 
    ['Torstai', 'To'], 
    ['Perjantai', 'Pe'], 
    ['Lauantai', 'La']
];

/**
 * Palauttaa Suomen ajan merkkijonona.
 */
const currentTimeInFinlandString = () => {
    return new Date().toLocaleString('en-FI', { 
        timeZone: 'Europe/Helsinki', 
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Palauttaa annetun Date olion merkkijonona muodossa YYYY-MM-DD.
 */
const dateToYYYYMMDD = (date: Date) => {
    // return date.toISOString().split('T')[0];     // ei oikein (aikavyöhykkeet)!
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
};

/**
 * Muuttaa muodossa YYYY-MM-DD annetun merkkijonon Date olioksi.
 */
const dateFromYYYYMMDD = (dateString: string) => {
    return new Date(dateString);
};

/**
 * Muodostaa kopion sarjallistuvasta oliosta.
 * Tämän voi toteuttaa tehokkaammin tarvittaessa, tässä käytetään vain JSON trikkiä.
 */
function deepCopy<T>(object: T): T {
    return JSON.parse(JSON.stringify(object)) as T;
}

/**
 * Palauttaa viikonpäivän nimen annetulle ajalle.
 */
const getDayOfWeekStrings = (date: Date) => {
    return { long: DAY_NAMES[date.getDay()][0], short: DAY_NAMES[date.getDay()][1] };
};

/**
 * Palauttaa päivämäärän muodossa DD.MM.YYYY.
 */
const dateToDDMMYYYY = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
};

/**
 * Palauttaa päivämäärän muodossa Day DD.MM.
 */
const dateToDayDDMM = (date: Date) => {
    const shortDayName = DAY_NAMES[date.getDay()][1];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${shortDayName} ${day}.${month}`;
};

/**
 * Apufunktio, valitsee count erillistä alkiota taulukosta.
 */
function pickRandomDistinctElements(arr: any[], count: number) {
    const shuffledArray = [...arr];
    // Sekoitetaaan shuffledArray täysin satunnaiseen järjestykseen:
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    // Palautetaan count ensimmäistä:
    return shuffledArray.slice(0, count);
}

/**
 * Palauttaa taulukossa annettujen olioiden avaimet ja niiden tyypit.
 */
function extractKeys(objectArray: any[]) {
    const uniqueKeys = new Map<string, string>();
    for (const obj of objectArray)
        for (const key in obj)
            uniqueKeys.set(key, typeof obj[key])
    return Array.from(uniqueKeys.entries());
}

/**
 * Olioiden arvojen vertailufunktio kentän orderBy mukaan.
 * Lähde: Material UI esimerkkikoodi.
 */
function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) 
        return -1;
    if (b[orderBy] > a[orderBy]) 
        return 1;
    return 0;
}

/**
 * Nouseva tai laskeva järjestys.
 */
type Order = 'asc' | 'desc';

/**
 * Palauttaa vertailufunktion kentän orderBy mukaan järjestyksessä order.
 * Lähde: Material UI esimerkkikoodi.
 */
function getComparator<Key extends keyof any>(order: Order, orderBy: Key): (
    a: { [key in Key]: number|string },
    b: { [key in Key]: number|string },
) => number {
     return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

/**
 * Primitiivinen hash-funktio serializable objekteille.
 * HUOM! Vain testauskäyttöön, parempia toteutuksia löytyy kirjastoista.
 */
function crudeHash(obj: any) {
    const s = JSON.stringify(obj);
    let hash = 0;
    for (let k = 0; k < s.length; k++) {
        const char = s.charCodeAt(k);
        hash = (hash << 5) - hash + char;
    }
    hash = Math.abs(hash);
    return hash.toString();
}

/**
 * Muutetaan serializable objekti JSON muotoon ja koodataan base64.
 * Tätä voi käyttää Reactissa.
 */
function base64JSONStringify(obj: any): string {
    const s = JSON.stringify(obj);
    return btoa(s);
}

/**
 * Muutetaan serializable objekti JSON muotoon ja koodataan base64.
 * Tätä voi käyttää Node.js koodissa.
 */
function base64JSONStringifyNode(obj: any): string {
    const s = JSON.stringify(obj);
    return Buffer.from(s).toString('base64');
}

/**
 * Palauttaa base64JSONStringify muunnetun objektin takaisin alkuperäiseksi.
 * Tätä voi käyttää Reactissa.
 */
function base64JSONparse(s64: string): any {
    const s = new TextDecoder('utf-8').decode(Uint8Array.from(atob(s64), c => c.charCodeAt(0)));
    // const s = atob(s64);
    return JSON.parse(s);
}

/**
 * Palauttaa base64JSONStringifyNode muunnetun objektin takaisin alkuperäiseksi.
 * Tätä voi käyttää Node.js koodissa.
 */
function base64JSONparseNode(s64: string): any {
    const s = Buffer.from(s64, 'base64').toString('utf8');
    return JSON.parse(s);
}

/**
 * Palauttaa uniikin merkkijonon.
 * HUOM! Käytä tämän sijasta esim. crypto.randomUUID() jos käyttötarkoitus on tärkeä.
 */
function createRandomUniqueIdentifier(length: number=12): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result: string[] = [];
    for (let k = 0; k < length; k++) {
        const index = Math.floor(Math.random()*characters.length);
        result.push(characters.charAt(index));
    }
    return result.join('');
}

/**
 * Palauttaa satunnaisen kokonaisluvun annetulta kokonaislukuväliltä.
 */
function randomIntBetween(minValue: number, maxValue: number) {
    if (!Number.isInteger(minValue) || !Number.isInteger(maxValue) || minValue > maxValue)
        throw Error("Invalid range.");
    return minValue + Math.floor(Math.random()*(1+maxValue-minValue));
}

/**
 * Vertaa annettua ajanhetkeä nykyhetkeen ja palauttaa niiden erotusta kuvaavan merkkijonon.
 */
function formatTimeDifference(timestamp: number): string {
    const currentTime = Math.floor(Date.now() / 1000);
    const differenceInSeconds = timestamp - currentTime;

    const direction = differenceInSeconds < 0 ? '-' : '+';
    const absoluteDifference = Math.abs(differenceInSeconds);

    let timeUnit: string;
    let formattedTime: number;

    if (absoluteDifference < 60) {
        timeUnit = 's';
        formattedTime = absoluteDifference;
    } else if (absoluteDifference < 3600) {
        timeUnit = 'm';
        formattedTime = absoluteDifference / 60;
    } else if (absoluteDifference < 86400) {
        timeUnit = 'h';
        formattedTime = absoluteDifference / 3600;
    } else {
        timeUnit = 'd';
        formattedTime = absoluteDifference / 86400;
    }

    return `${direction}${formattedTime.toFixed(1)}${timeUnit}`;
}

/**
 * Poistaa html erikoismerkkejä merkkijonosta.
 * HUOM! TODO Korvaa tämä tätä tarkoitusta varten tehdyllä kirjastolla kun
 * käyttötarkoitus laajenee!
 */
function removeSpecialChars(str: string) {
    return str.replace(/[&"<>\/\\`]/g, "");
}

/**
 * Palauttaa ensimmäisen indeksin, missä merkkijonot poikkeavat toisistaan.
 * Jos merkkijonot ovat samat, palauttaa -1.
 */
function findStringDifference(s1: string, s2: string) {
    const minLength = Math.min(s1.length, s2.length);
    
    for (let i = 0; i < minLength; i++)
        if (s1[i] !== s2[i])
            return i;
    
    if (s1.length !== s2.length)
        return minLength;
    
    return -1;
}

/**
 * Vertaa kahta JSON objektia.
 */
function compareJsonObjects(obj1: any, obj2: any, path: string[] = []): string[] {
    const differences: string[] = [];

    function compareSubObjects(o1: any, o2: any, currentPath: string[]) {
        // Get all unique keys from both objects
        for (const key of new Set([...Object.keys(o1), ...Object.keys(o2)])) {
            const newPath = [...currentPath, key];
            const value1 = o1[key];
            const value2 = o2[key];

            // If both values are objects, recursively compare them
            if (isObject(value1) && isObject(value2)) {
                compareSubObjects(value1, value2, newPath);
            } else if (!isEqual(value1, value2)) {
                // Record differences in the path
                differences.push(`Difference at ${newPath.map(p => `[${p}]`).join('')}`);
            }
        }
    }

    compareSubObjects(obj1, obj2, path);
    return differences;
}

/**
 * Hylkää promisen jos aikaa menee liian kauan
 */
const rejectAfterTimeout = (ms: number, timeoutHandle: { id: any }): Promise<never> =>
    new Promise((_, reject) => {
        timeoutHandle.id = setTimeout(() => {
            reject(new Error('Request timed out'));
        }, ms);
});

/**
 * Viive ms millisekuntia.
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Custom hook, joka debounceaa annetun callback-funktion,
 * viivyttäen sen suorittamista, kunnes tietty aika on kulunut
 * viimeisestä kutsusta. Funktion kutsu voidaan peruuttaa tarvittaessa viiveen aikana.
 */
function useDebounce<T extends (...args: any[]) => void>(cb: T, delay: number) {
    const timer = useRef<NodeJS.Timeout>();
    const lastCall = useRef<number>(0);
  
    const debouncedFunction = (...args: Parameters<T>) => {
        const now = performance.now();
        clearTimeout(timer.current);

        if (now > lastCall.current+delay) {
            // Kutsutaan heti
            lastCall.current = now;
            cb(...args);
            return;
        }
        timer.current = setTimeout(() => {
            cb(...args);
            timer.current = undefined;
        }, delay);
    };

    /**
     * Peruuta debounced-funktion odottava suoritus.
     * Palauttaa true, jos peruutus tapahtui, false jos suoritus ei ollut odotettavissa.
     */
    debouncedFunction.cancel = () => {
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = undefined;
            return true;
        }
        return false;
    };

    // Loppusiivous
    useEffect(() => {
        return () => {
            clearTimeout(timer.current);
            timer.current = undefined;
        };
    }, []);
  
    return debouncedFunction as (T & { cancel: () => boolean; });
}

export type { Order };
export { dateToDayDDMM, dateToYYYYMMDD, dateFromYYYYMMDD, pickRandomDistinctElements, 
    getDayOfWeekStrings, dateToDDMMYYYY, extractKeys, getComparator, deepCopy, crudeHash,
    base64JSONStringify, base64JSONparse, base64JSONStringifyNode, base64JSONparseNode,
    createRandomUniqueIdentifier, randomIntBetween, formatTimeDifference, 
    removeSpecialChars, findStringDifference, compareJsonObjects, 
    currentTimeInFinlandString, delay, useDebounce, rejectAfterTimeout };