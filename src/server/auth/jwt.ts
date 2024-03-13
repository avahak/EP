/**
 * From php (Marcus, FX2): 
 * eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJOaW1pIjoiTmljb2xlIiwiSm91a2t1ZSI6IlNTMiIsImlhdCI6MTcxMDI5NDMwMX0.TdNa8UJTfz-r3LgDQZYAIhXh8c9uM7MWKLstcoTJ7g4
 */

import jwt from 'jsonwebtoken';

const SECRET_KEY = "secret_sauce_1234";

function encode(payload: any) {
    return jwt.sign(payload, SECRET_KEY, { algorithm: 'HS256' });
}

function decode(token: string) {
    let payload = null;
    try {
        payload = jwt.verify(token, SECRET_KEY);
    } catch (err) {
        return null;
    }
    return payload;
}

function testEncode() {
    console.log("Testing encode.");
    const payload = { Nimi: "Nicole", Joukkue: "SS2" };
    const token = encode(payload);
    console.log("payload:", payload);
    console.log("token:", token);
    console.log();
}

function testDecode() {
    console.log("Testing decode.");
    const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJOaW1pIjoiTWFyY3VzIiwiSm91a2t1ZSI6IkZYMiJ9.2eXO3AgXsfTPN6tSytGkX__sQaq-s0cuLCRSyh1t4ec";
    console.log("token:", token);
    const payload = decode(token);
    console.log("payload:", payload);
    console.log();
}

export { encode, decode, testEncode, testDecode };