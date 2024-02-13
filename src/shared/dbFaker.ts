/**
 * Testauksessa käytettävän tietokannan luonti ja testidatan generointi.
 * Apuna käytetään faker-kirjastoa (https://fakerjs.dev/).
 * NOTE: Älä käytä faker-kirjastoa tuotantoversiossa, se vie paljon tilaa.
 */

// import { faker } from '@faker-js/faker';

function testFaker() {
    // const name = faker.person.fullName();
    // const email = faker.internet.email();
    const name = "";
    const email = "";
    return { name, email };
}

export { testFaker };