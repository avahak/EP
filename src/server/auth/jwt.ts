/**
 * JWT token luonti ja tarkistus.
 */

import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY ?? "";

/**
 * Luo uuden JWT tokenin käyttäen salaista avainta SECRET_KEY 
 * koodaten payload datan.
 */
function encode(payload: any) {
    return jwt.sign(payload, SECRET_KEY, { algorithm: 'HS256' });
}

/**
 * Vahvistaa, että annettu JWT token on luotu samalla SECRET_KEY mikä
 * serverillä on käytössä.
 */
function verify(token: string) {
    let payload = null;
    try {
        payload = jwt.verify(token, SECRET_KEY);
    } catch (err) {
        return null;
    }
    return payload;
}

// function testEncode() {
//     console.log("Testing encode.");
//     const payload = { name: "Test_Nicole", team: "SS2", role: "-" };
//     const token = encode(payload);
//     console.log("payload:", payload);
//     console.log("token:", token);
//     console.log();
// }

// function testDecode() {
//     console.log("Testing decode.");
//     const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiTWF1cmljZSIsInRlYW0iOiJBQTEiLCJyb2xlIjoibW9kIiwiaWF0IjoxNzEwNDcwMjkwfQ.WSux1bIIK462M3lMHirVaLPRz7KD1XNkS3eZgNkSy_w";
//     console.log("token:", token);
//     const payload = verify(token);
//     console.log("payload:", payload);
//     console.log();
// }

// function testDecode2() {
//     console.log("Testing decode 2.");
//     const payloadIn = { name: "Test_Nicole", team: "SS2", role: "-" };
//     const token = encode(payloadIn);
//     console.log("token:", token);
//     const payloadOut = verify(token);
//     console.log("payload:", payloadOut);
//     console.log();
// }

export { encode, verify };