/**
 * Palauttaa annetun päivämäärän merkkijonona muodossa YYYY-MM-DD.
 */
const getTodayDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

export { getTodayDateString, pickRandomDistinctElements };