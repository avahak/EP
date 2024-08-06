/**
 * Testauksessa käytettävän testidatan generointi ja syöttö tietokantaan.
 * Apuna käytetään faker-kirjastoa (https://fakerjs.dev/) keksimään esim. nimiä.
 * HUOM! Tätä käytetään ainoastaan testausvaiheessa, tuotantoversiossa ei tarpeen.
 * HUOM! Älä käytä faker-kirjastoa React puolella, se vie paljon tilaa.
 */

import mysql from 'mysql2/promise';
import { faker } from '@faker-js/faker';
import { dateToYYYYMMDD, pickRandomDistinctElements, randomIntBetween } from "../../shared/generalUtils.js";

const RAVINTOLAT = 5;       // max 7
const MIN_KAUSI = 37;
const MAX_KAUSI = 38;
const MAX_TEAMS_IN_RAVINTOLA = 6;
const MIN_PLAYERS_IN_TEAM = 3;
const MAX_PLAYERS_IN_TEAM = 6;

/**
 * Luodaan testauksessa käytettävää sisältöä ep_rafla tauluun.
 */
function generate_raflat() {
    let names = [['Tunnelin Tupa', 'TT'], ['Kohtaamispaikka', 'KP'], ['Flux', 'FX'], ['Avoin Areena', 'AA'], ['Mirage', 'MG'], ['Tähtipaikka', 'TP'], ['Sumuspot', 'SS']];
    names = names.slice(0, Math.min(RAVINTOLAT, names.length));

    const raflat: any[] = [];
    names.forEach(([name, shortName]) => {
        const rafla = { 
            index: raflat.length,
            lyhenne: shortName, 
            nimi: name, 
            osoite: `${faker.location.streetAddress()} ${faker.location.secondaryAddress()}`,
            kauposa: 'Itis',
            postosoite: `${faker.location.zipCode()} ${faker.location.city()}`,
            yhdhenk: faker.person.fullName(),
            yhdpuh: faker.phone.number()
        };
        raflat.push(rafla);
    });
    return raflat;
}

/**
 * Luodaan testauksessa käytettävää sisältöä ep_kausi tauluun.
 */
function generate_kaudet() {
    let kaudet: any[] = [];
    for (let k = /*1*/MIN_KAUSI; k <= MAX_KAUSI; k++) {
        const vuosi = Math.ceil(k/2);
        const kausi = {
            index: kaudet.length,
            vuosi: vuosi,
            kausi: `${vuosi+2004}-${vuosi+2005}`,
            Laji: (k % 2 == 0) ? 'r' : 'p',
        };
        kaudet.push(kausi);
    }
    return kaudet;
}

/**
 * Luodaan testauksessa käytettävää sisältöä ep_lohko tauluun.
 */
function generate_lohkot(kaudet: any[]) {
    const lohkot: any[] = [];
    kaudet.forEach((kausi) => {
        lohkot.push({ 
            index: lohkot.length,
            kausi: kausi.index, 
            tunnus: '-',
            selite: `kauden ${kausi.index+1} lohko`
        });
    });
    return lohkot;
}

/**
 * Luodaan testauksessa käytettävää sisältöä ep_joukkue tauluun.
 * Luodaan jokaisesta joukkueesta myös rivi ep_sarjat tauluun.
 */
function generate_joukkueet(raflat: any[], lohkot: any[]) {
    const joukkueet: any[] = [];
    const sarjat: any[] = [];
    lohkot.forEach((lohko) => {
        raflat.forEach((rafla) => {
            let count = randomIntBetween(1, MAX_TEAMS_IN_RAVINTOLA);
            for (let k = 1; k <= count; k++) {
                const joukkue = {
                    index: joukkueet.length,
                    lyhenne: `${rafla.lyhenne}${k}`,
                    nimi: `${rafla.nimi} ${k}`,
                    kausi: lohko.kausi,
                    lohko: lohko.index,
                    ravintola: rafla.index,
                    yhdhenk: faker.person.fullName(),
                    yhdpuh: faker.phone.number(),
                    kapt: faker.person.fullName(),
                    kpuh: faker.phone.number(),
                    varakapt: faker.person.fullName(),
                    vkpuh: faker.phone.number()
                };
                joukkueet.push(joukkue);
                
                const sarja = {
                    index: sarjat.length,
                    nimi: joukkue.nimi,
                    joukkue: joukkue.index,
                    lyhenne: joukkue.lyhenne,
                    lohko: joukkue.lohko
                };
                sarjat.push(sarja);
            }
        });
    });
    return [joukkueet, sarjat];
}

/**
 * Luodaan testauksessa käytettävää sisältöä ep_pelaaja, ep_jasen, userpw tauluihin.
 * HUOM: Tässä pelaajat, jasenet taulukot vastaavat 1-1 toisiansa.
 */
function generate_pelaajat_jasenet_users(joukkueet: any[]) {
    const pelaajat: any[] = [];
    const jasenet: any[] = [];
    const users: any[] = [];
    
    // lisätään pelaaja ja jasen samalla:
    let jasenno = 1;
    joukkueet.forEach((joukkue, joukkueIndex) => {
        const pelaajienLkm = randomIntBetween(MIN_PLAYERS_IN_TEAM, MAX_PLAYERS_IN_TEAM);
        const newPelaajat: any[] = [];
        for (let k = 0; k < pelaajienLkm; k++) {
            jasenno = (jasenno*29) % 9973;
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const jasen = {
                index: jasenet.length,
                jasenno: jasenno,
                etunimi: firstName,
                suku: lastName,
                pelaaja: `${firstName} ${lastName.slice(0, 1)}`
            };
            const pelaaja = {
                index: pelaajat.length,
                nimi: Math.random() < 0.75 ? `${firstName}` : `${firstName} ${lastName.slice(0, 1)}`,
                joukkue: joukkueIndex,
                jasen: jasen.index,
                sukupuoli: ['-', 'M', 'N'][Math.floor(3*Math.random())]
            };
            pelaajat.push(pelaaja);
            jasenet.push(jasen);

            if (joukkue.kausi+1 == (process.env.KULUVA_KAUSI ?? 2))
                newPelaajat.push(pelaaja);
        }

        // Lisätään tunnukset pelaajille, jotka käyttävät verkkosivua:
        const websiteUsingPelaajat = pickRandomDistinctElements(newPelaajat, randomIntBetween(1, Math.min(3, pelaajat.length)));
        for (let player of websiteUsingPelaajat) {
            const user = {
                index: users.length,
                Nimi: player.nimi,
                Joukkue: joukkue.lyhenne,
                MD5: faker.string.alphanumeric(50)
            }
            users.push(user);
        }
    });
    return [pelaajat, jasenet, users];
}

/**
 * Luodaan testauksessa käytettävää sisältöä ep_ottelu tauluun.
 * Merkinnät:
 *      T = Tuleva 
 *      K = Kotijoukkueen ilmoittama,
 *      V = Vierasjoukkueen korjaama,
 *      M = Molempien hyväksymä
 *      H = Tulosvastaavan hyväksymä (lopullinen tulos)
 */
function generate_ottelut(joukkueet: any[], kaudet: any[], lohkot: any[]) {
    // Idea: ryhmitetään joukkueet lohkon mukaan. Lohkon sisällä kaikki
    // pelaavat toisiansa vastaan kaksi kertaa

    // kuvaus lohkon järjestysnumerosta listaan sen joukkueista
    let lohkoJoukkueMap: Map<number, any[]> = new Map();
    joukkueet.forEach((joukkue) => {
        const currentValue = lohkoJoukkueMap.get(joukkue.lohko) || [];
        lohkoJoukkueMap.set(joukkue.lohko, [...currentValue, joukkue]);
    });

    const ottelut: any[] = [];
    const currentDate = new Date();
    const currentDateMinusHalfYear = new Date();
    currentDateMinusHalfYear.setMonth(currentDate.getMonth()-6);

    // käydään kaikki lohkot läpi:
    for (let [lohko, lohkonJoukkueet] of lohkoJoukkueMap.entries()) {
        const year = kaudet[lohkot[lohko].kausi].vuosi + 2004;
        const startDate = new Date(`${year}-06-01`);
        const endDate = new Date(`${year+1}-04-01`); 
        lohkonJoukkueet.forEach((koti) => {
            lohkonJoukkueet.forEach((vieras) => {
                if (koti == vieras)
                    return;
                // Asetetaan status tuleville otteluille 'T', vanhoille 'H' 
                // ja viimeaikaisille satunnaisesti T, M, V, K:
                const matchDate = new Date(startDate.getTime()+Math.random()*(endDate.getTime()-startDate.getTime()));
                let status = 'T';
                if (matchDate < currentDate) {
                    if (matchDate < currentDateMinusHalfYear)
                        status = 'H';
                    else 
                        status = ['T', 'M', 'V', 'K'][Math.floor(4*Math.random())];
                }
                // ['H', 'M', 'V', 'K', 'T'][Math.floor(5*Math.random())]

                const ottelu = {
                    index: ottelut.length,
                    lohko: lohko,
                    paiva: matchDate, 
                    koti: koti.index, 
                    vieras: vieras.index,
                    status: status
                };
                ottelut.push(ottelu);
            });
        });
    }
    return ottelut;
}

/**
 * Luodaan testauksessa käytettävää sisältöä ep_peli, ep_erat tauluihin.
 */
function generate_pelit(ottelut: any[], pelaajat: any[]) {

    // kuvaus joukkueen indeksistä sen pelaajiin
    const joukkuePelaajaMap: Map<number, any[]> = new Map();
    pelaajat.forEach((pelaaja) => {
        const currentValue = joukkuePelaajaMap.get(pelaaja.joukkue) || [];
        joukkuePelaajaMap.set(pelaaja.joukkue, [...currentValue, pelaaja]);
    });

    const pelit: any[] = [];
    const erat: any[] = [];
    ottelut.forEach((ottelu) => {
        // Jos status on 'T', ei ottelua ole vielä käyty.
        if (ottelu.status == 'T')
            return;
        // Valitaan 3 pelaajaa kummankin joukkueen pelaajista:
        const kotiPelaajat = pickRandomDistinctElements(joukkuePelaajaMap.get(ottelu.koti)!, 3);
        const vierasPelaajat = pickRandomDistinctElements(joukkuePelaajaMap.get(ottelu.vieras)!, 3);
        for (let k = 0; k < 9; k++) {
            const kp = kotiPelaajat[Math.floor(k/3)];
            const vp = vierasPelaajat[k%3];
            const peli = {
                index: pelit.length,
                ottelu: ottelu.index,
                kp: kp.index,
                vp: vp.index
            };
            pelit.push(peli);

            const tulokset = ['V0', 'V0', 'V0', 'V0', 'V0'];
            let voitotKoti = 0;
            let voitotVieras = 0;
            for (let k = 0; k < 5; k++) {
                let tulos = 'V0';
                const rnd =  Math.random();
                const breakpoints: [number, string][] = [
                    [0.25, 'K1'], [0.3, 'K2'], [0.35, 'K3'], 
                    [0.4, 'K4'], [0.45, 'K5'], [0.5, 'K6'], 
                    [0.75, 'V1'], [0.8, 'V2'], [0.85, 'V3'], 
                    [0.9, 'V4'], [0.95, 'V5'], [1, 'V6']
                ];
                for (const [threshold, result] of breakpoints) {
                    if (rnd < threshold) {
                        tulos = result;
                        break;
                    }
                }
                tulokset[k] = tulos;
                if (tulos[0] == 'K')
                    voitotKoti += 1;
                else
                    voitotVieras += 1;
                if (voitotKoti >= 3 || voitotVieras >= 3)
                    break;
            }
            const era = {
                index: erat.length,
                peli: peli.index,
                era1: tulokset[0],
                era2: tulokset[1], 
                era3: tulokset[2],
                era4: tulokset[3], 
                era5: tulokset[4]
            };
            erat.push(era);
        }
    });
    return [pelit, erat];
}

/**
 * Luodaan testidata ja kootaan se yhteen olioon.
 */
function generateFakeData() {
    const raflat = generate_raflat();
    const kaudet = generate_kaudet();
    const lohkot = generate_lohkot(kaudet);
    const [joukkueet, sarjat] = generate_joukkueet(raflat, lohkot);
    const [pelaajat, jasenet, users] = generate_pelaajat_jasenet_users(joukkueet);
    const ottelut = generate_ottelut(joukkueet, kaudet, lohkot);
    const [pelit, erat] = generate_pelit(ottelut, pelaajat);

    const data = { raflat, kaudet, lohkot, joukkueet, sarjat, pelaajat, jasenet, users, ottelut, pelit, erat };
    return data;
}

/**
 * Lisää generateFakeData antaman datan tietokannan riveiksi.
 */
async function generateAndInsertToDatabase(pool: mysql.Pool) {
    const data = generateFakeData();
    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        try {
            // Lisää tauluun ep_rafla:
            let sql = `INSERT INTO ep_rafla (lyhenne, nimi, osoite, postosoite, kauposa, yhdhenk, yhdpuh) VALUES ?`;
            let batch = data.raflat.map((rafla) => {
                return [
                    rafla.lyhenne.slice(0, 3), 
                    rafla.nimi.slice(0, 20), 
                    rafla.osoite.slice(0, 30), 
                    rafla.postosoite.slice(0, 30), 
                    rafla.kauposa.slice(0, 20), 
                    rafla.yhdhenk.slice(0, 30), 
                    rafla.yhdpuh.slice(0, 15)
                ];
            });
            await connection.query(sql, [batch]);
            console.log(`ep_raflat batch n=${batch.length}, first: ${batch[0]}`);

            // Lisää tauluun ep_kausi:
            sql = `INSERT INTO ep_kausi (vuosi, kausi, Laji) VALUES ?`;
            batch = data.kaudet.map((kausi) => {
                return [
                    kausi.vuosi, 
                    kausi.kausi.slice(0, 9),
                    kausi.Laji
                ];
            });
            await connection.query(sql, [batch]);
            console.log(`ep_kausi batch n=${batch.length}, first: ${batch[0]}`);

            // Lisää tauluun ep_lohko:
            sql = `INSERT INTO ep_lohko (kausi, tunnus, selite) VALUES ?`;
            batch = data.lohkot.map((lohko) => {
                return [
                    lohko.kausi+1, 
                    lohko.tunnus,
                    lohko.selite
                ];
            });
            await connection.query(sql, [batch]);
            console.log(`ep_lohko batch n=${batch.length}, first: ${batch[0]}`);

            // Lisää tauluun ep_joukkue:
            sql = `INSERT INTO ep_joukkue (lyhenne, nimi, kausi, lohko, ravintola, yhdhenk, yhdpuh, kapt, kpuh, varakapt, vkpuh) VALUES ?`;
            batch = data.joukkueet.map((joukkue) => {
                return [
                    joukkue.lyhenne.slice(0, 3),
                    joukkue.nimi.slice(0, 15),
                    joukkue.kausi+1,
                    joukkue.lohko+1,
                    joukkue.ravintola+1,
                    joukkue.yhdhenk.slice(0, 40),
                    joukkue.yhdpuh.slice(0, 15), 
                    joukkue.kapt.slice(0, 20),
                    joukkue.kpuh.slice(0, 15), 
                    joukkue.varakapt.slice(0, 25),
                    joukkue.vkpuh.slice(0, 15)
                ];
            });
            await connection.query(sql, [batch]);
            console.log(`ep_joukkue batch n=${batch.length}, first: ${batch[0]}`);

            // Lisää tauluun ep_sarjat:
            sql = `INSERT INTO ep_sarjat (nimi, joukkue, lyhenne, lohko) VALUES ?`;
            batch = data.sarjat.map((sarja) => {
                return [
                    // sarja.index+1,
                    sarja.nimi.slice(0, 15),
                    sarja.joukkue+1,
                    sarja.lyhenne.slice(0, 3),
                    sarja.lohko+1
                ];
            });
            await connection.query(sql, [batch]);
            console.log(`ep_sarjat batch n=${batch.length}, first: ${batch[0]}`);

            // Lisää tauluun ep_jasen:
            sql = `INSERT INTO ep_jasen (jasenno, etunimi, suku, pelaaja) VALUES ?`;
            batch = data.jasenet.map((jasen) => {
                return [
                    jasen.jasenno,
                    jasen.etunimi.slice(0, 10),
                    jasen.suku.slice(0, 15),
                    jasen.pelaaja.slice(0, 12)
                ];
            });
            await connection.query(sql, [batch]);
            console.log(`ep_jasen batch n=${batch.length}, first: ${batch[0]}`);

            // Lisää tauluun ep_pelaaja:
            sql = `INSERT INTO ep_pelaaja (nimi, joukkue, jasen, sukupuoli) VALUES ?`;
            batch = data.pelaajat.map((pelaaja) => {
                return [
                    pelaaja.nimi.slice(0, 15),
                    pelaaja.joukkue+1,
                    pelaaja.jasen+1,
                    pelaaja.sukupuoli
                ];
            });
            await connection.query(sql, [batch]);
            console.log(`ep_pelaaja batch n=${batch.length}, first: ${batch[0]}`);

            // Lisää tauluun ep_userpw:
            sql = `INSERT INTO userpw (Nimi, Joukkue, MD5) VALUES ? ON DUPLICATE KEY UPDATE MD5=MD5`;
            batch = data.users.map((user) => {
                return [
                    user.Nimi.slice(0, 12),
                    user.Joukkue.slice(0, 3),
                    user.MD5.slice(0, 50)
                ];
            });
            await connection.query(sql, [batch]);
            console.log(`userpw batch n=${batch.length}, first: ${batch[0]}`);

            // Lisää tauluun ep_ottelu:
            sql = `INSERT INTO ep_ottelu (lohko, paiva, koti, vieras, status) VALUES ?`;
            batch = data.ottelut.map((ottelu) => {
                return [
                    // ottelu.index+1,
                    ottelu.lohko+1,
                    dateToYYYYMMDD(ottelu.paiva),
                    ottelu.koti+1,
                    ottelu.vieras+1,
                    ottelu.status
                ];
            });
            await connection.query(sql, [batch]);
            console.log(`ep_ottelu batch n=${batch.length}, first: ${batch[0]}`);

            // Lisää tauluun ep_peli:
            sql = `INSERT INTO ep_peli (ottelu, kp, vp) VALUES ?`;
            batch = data.pelit.map((peli) => {
                return [
                    // peli.index+1,
                    peli.ottelu+1,
                    peli.kp+1,
                    peli.vp+1
                ];
            });
            await connection.query(sql, [batch]);
            console.log(`ep_peli batch n=${batch.length}, first: ${batch[0]}`);

            // Lisää tauluun ep_erat:
            sql = `INSERT INTO ep_erat (peli, era1, era2, era3, era4, era5) VALUES ?`;
            batch = data.erat.map((era) => {
                return [
                    // era.index+1,
                    era.peli+1,
                    era.era1,
                    era.era2,
                    era.era3,
                    era.era4,
                    era.era5
                ];
            });
            await connection.query(sql, [batch]);
            console.log(`ep_erat batch n=${batch.length}, first: ${batch[0]}`);

            // Kutsu procedure_update_all_old_from_all_erat_slow, joka päivittää
            // johdettuja tuloskenttiä:
            sql = `CALL procedure_update_all_old_from_all_erat_slow`;
            await connection.query(sql);
            console.log(`\"CALL procedure_update_all_old_from_all_erat_slow\" finished`);

            await connection.commit();
            console.log("generateAndInsertToDatabase success");
        } catch (error) {
            console.error("Error during generateAndInsertToDatabase:", error);
            await connection.rollback();
        } finally {
            connection.destroy();       // TEHOTONTA! Käytetään vain Azure SQL ongelmien takia
            // connection.release();
        }
    } catch (error) {
        console.error("Error during generateAndInsertToDatabase.", error);
        return;
    }
}

export { generateFakeData, generateAndInsertToDatabase };