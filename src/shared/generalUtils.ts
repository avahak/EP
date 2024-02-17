/**
 * Palauttaa annetun Date olion merkkijonona muodossa YYYY-MM-DD.
 */
const dateToISOString = (date: Date) => {
    // return date.toISOString().split('T')[0];
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

export { dateToISOString, ISOStringToDate, pickRandomDistinctElements, getDayOfWeekStrings, toDDMMYYYY };