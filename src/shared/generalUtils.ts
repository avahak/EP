/**
 * Sekalaisia yleiseen käyttöön tarkoitettuja apufunktioita, esimerkiksi
 * päivämäärämuunnoksia.
 */

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
function deepCopy(object: any) {
    return JSON.parse(JSON.stringify(object));
}

/**
 * Palauttaa viikonpäivän nimen annetulle ajalle.
 */
const getDayOfWeekStrings = (date: Date) => {
    const names = [['Sunnuntai', 'Su'], ['Maanantai', 'Ma'], ['Tiistai', 'Ti'], ['Keskiviikko', 'Ke'], ['Torstai', 'To'], ['Perjantai', 'Pe'], ['Lauantai', 'La']];
    return { long: names[date.getDay()][0], short: names[date.getDay()][1] };
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
    a: { [key in Key]: number | string },
    b: { [key in Key]: number | string },
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
 * Muutetaan serializable objekti JSON muotoon ja käytetään koodataan base64.
 */
function base64JSONStringify(obj: any) {
    const s = JSON.stringify(obj);
    return btoa(s);
}

/**
 * Palauttaa base64JSONStringify muunnetun objektin takaisin alkuperäiseksi.
 */
function base64JSONparse(s64: string) {
    const s = atob(s64);
    return JSON.parse(s);
}

/**
 * Palauttaa uniikin merkkijonon.
 * HUOM! Käytä tämän sijasta esim. crypto.randomUUID() jos käyttötarkoitus on tärkeä.
 */
function createRandomUniqueIdentifier() {
    return Date.now().toString() + Math.random().toString().slice(2);
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

export type { Order };
export { dateToYYYYMMDD, dateFromYYYYMMDD, pickRandomDistinctElements, 
    getDayOfWeekStrings, dateToDDMMYYYY, extractKeys, getComparator, deepCopy,
    crudeHash, base64JSONStringify, base64JSONparse, createRandomUniqueIdentifier,
    randomIntBetween, formatTimeDifference, removeSpecialChars };