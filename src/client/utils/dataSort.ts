/**
 * Luo triviaalin järjestyksen, joka ei muuta mitään.
 */
function createTrivialOrder<T>(data: T[]) {
    return Array.from({ length: data.length }, (_, i) => i);
};

/**
 * Yhdistää kaksi järjestystä.
 */
function composedOrder(order1: number[], order2: number[]) {
    const order = [];
    for (const j of order2)
        order.push(order1[j]);
    return order;
};

/**
 * Vertaa kahta riviä kentän sortingKey perusteella.
 */
// function compareRows<T>(rowA: T, rowB: T, sortingKey: keyof T) {
//     const valueA = rowA[sortingKey];
//     const valueB = rowB[sortingKey];
//     if (typeof valueA == "number" && typeof valueB == "number")
//         return valueA - valueB;
//     if (typeof valueA == "string" && typeof valueB == "string")
//         return valueA.localeCompare(valueB);
//     return 0;
// };

/**
 * Järjestää tietoja `sortingKey`-avaimen perusteella ja luo uuden järjestysindeksin.
 * Jos `order` annetaan, käytetään sitä alkuperäisen järjestyksen määrittämiseen 
 * ennen lajittelua. Lopuksi palauttaa uuden järjestyksen alkuperäisille tiedoille.
 */
function sortBy<T>(data: T[], comparator: (rowA: T, rowB: T) => number, order?: number[]) {
    const oldOrder = order ?? createTrivialOrder(data);
    const sortOrder = createTrivialOrder(data);

    sortOrder.sort((a, b) => {
        const rowA = data[oldOrder[sortOrder[a]]];
        const rowB = data[oldOrder[sortOrder[b]]];
        return comparator(rowA, rowB);
    });

    return composedOrder(oldOrder, sortOrder);
};

/**
 * Vertaa kahta riviä niiden merkkijono tyyppisen sarakkeen sortingKey perusteella.
 */
function stringColumnComparator<T, K extends keyof T>(sortingKey: K, order: "asc" | "desc" = "asc") {
    const sign = order == "asc" ? +1 : -1;
    return (rowA: T, rowB: T) => sign*((rowA[sortingKey] as string).localeCompare(rowB[sortingKey] as string));
};

/**
 * Vertaa kahta riviä niiden luku tyyppisen sarakkeen sortingKey perusteella.
 */
function numberColumnComparator<T, K extends keyof T>(sortingKey: K, order: "asc" | "desc" = "asc") {
    const sign = order == "asc" ? +1 : -1;
    return (rowA: T, rowB: T) => sign*((rowA[sortingKey] as number)-(rowB[sortingKey] as number));
};

/**
 * Lisää tietoihin uuden sarakkeen, joka kuvaa rivin sijoitusta monen lajittelusarakkeen 
 * perusteella. Tasatilanteessa oleville riveille annetaan sama sijoitus.
 * Lisää myös newColumnName + "_dense" sarakkeen, missä on vastaava "dense rank".
 * @param sortKeys Järjestämiseen käytettävät sarakkeet, nousevassa tärkeysjärjestyksessä.
 */
function addMultiSortRankColumn<T>(data: T[], newColumnName: string, comparators: ((rowA: T, rowB: T) => number)[], addDenseColumn: boolean = false) {
    let order = createTrivialOrder(data);
    for (const comparator of comparators)
        order = sortBy(data, comparator, order);

    let rank = 1;
    let denseRank = 1;
    for (let k = 0; k < data.length; k++) {
        const row = data[order[k]];
        if (k > 0) {
            let lastRow = data[order[k-1]];
            let advanceRank = false;
            for (const comparator of comparators)
                if (comparator(row, lastRow) != 0)
                    advanceRank = true;
            if (advanceRank) {
                rank = k+1;
                denseRank += 1;
            }
        }
        (row as Record<string, any>)[newColumnName] = rank;
        if (addDenseColumn)
            (row as Record<string, any>)[newColumnName + "_dense"] = denseRank;
    }
}

export { sortBy, addMultiSortRankColumn, stringColumnComparator, numberColumnComparator };