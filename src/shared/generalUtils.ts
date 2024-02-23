/**
 * Palauttaa annetun Date olion merkkijonona muodossa YYYY-MM-DD.
 */
const dateToISOString = (date: Date) => {
    // return date.toISOString().split('T')[0];     // ei oikein (aikavyöhykkeet)!
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
};

/**
 * Muuttaa muodossa YYYY-MM-DD annetun merkkijonon Date olioksi.
 */
const ISOStringToDate = (dateString: string) => {
    return new Date(dateString);
}

/**
 * Palauttaa viikonpäivän nimen annetulle ajalle.
 */
const getDayOfWeekStrings = (date: Date) => {
    const names = [['Sunnuntai', 'Su'], ['Maanantai', 'Ma'], ['Tiistai', 'Ti'], ['Keskiviikko', 'Ke'], ['Torstai', 'To'], ['Perjantai', 'Pe'], ['Lauantai', 'La']];
    return { long: names[date.getDay()][0], short: names[date.getDay()][1] };
}

/**
 * Palauttaa päivämäärän muodossa DD.MM.YYYY.
 */
const toDDMMYYYY = (date: Date) => {
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
    // sekoitetaaan shuffledArray täysin satunnaiseen järjestykseen:
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    // palautetaan count ensimmäistä:
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

export { dateToISOString, ISOStringToDate, pickRandomDistinctElements, 
    getDayOfWeekStrings, toDDMMYYYY, extractKeys, getComparator };
export type { Order };