/**
 * Testauksessa käytettävän tietokannan luonti ja testidatan generointi.
 * Apuna käytetään faker-kirjastoa (https://fakerjs.dev/).
 * NOTE: Älä käytä faker-kirjastoa tuotantoversiossa, se vie paljon tilaa.
 */

// Ladataan faker dynaamisesti, jotta sitä ei tarvitse sisällyttää React .js tiedostoon.
// import { faker } from '@faker-js/faker';

function testFaker(faker: any) {
    const name = faker.person.fullName();
    const email = faker.internet.email();
    return { name, email };
}

export { testFaker };