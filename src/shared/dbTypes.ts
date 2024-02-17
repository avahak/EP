/**
 * Typescript tyypit SQL-tauluille. Vastaavuus ei ole yksi yhteen.
 * HUOM: Ei käytössä tällä hetkellä
 */

/** SQL:
 * `id` int(10) unsigned NOT NULL,
 * `peli` int(10) unsigned NOT NULL,
 * `era1` varchar(2) NOT NULL,
 * `era2` varchar(2) NOT NULL,
 * `era3` varchar(2) NOT NULL,
 * `era4` varchar(2) NOT NULL,
 * `era5` varchar(2) NOT NULL,
 */
type ep_erat = {
    id: number;
    peli: number;
    erat: ("K1" | "K2" | "K3" | "K4" | "K5" | "K6" | "V0" | "V1" | "V2" | "V3" | "V4" | "V5" | "V6")[];
}

/** SQL:
 * `id` int(11) unsigned NOT NULL,
 * `ottelu` int(11) unsigned NOT NULL,
 * `kp` int(11) DEFAULT NULL,
 * `vp` int(11) DEFAULT NULL,
 * `ktulos` tinyint(3) DEFAULT NULL,
 * `vtulos` tinyint(3) DEFAULT NULL,
 */
type ep_peli = {
    id: number;
    ottelu: number;
    kp: number;
    vp: number;
    ktulos: number;
    vtulos: number;
}

/** SQL: 
 * `id` int(10) unsigned NOT NULL,
 * `lohko` tinyint(3) NOT NULL,
 * `paiva` date DEFAULT NULL,
 * `koti` smallint(6) DEFAULT NULL,
 * `vieras` smallint(6) DEFAULT NULL,
 * `ktulos` tinyint(4) DEFAULT NULL,
 * `vtulos` tinyint(4) DEFAULT NULL,
 * `status` varchar(1) COLLATE utf8_swedish_ci NOT NULL,
 */
type ep_ottelu = {
    id: number;
    lohko: number;      // ep_lohko
    paiva: Date;
    koti: number;       // ep_joukkue
    vieras: number;     // ep_joukkue
    ktulos: number;
    vtulos: number;
    status: "H" | "M" | "V" | "K" | "T";
}

/** SQL:
 * `id` smallint(6) unsigned NOT NULL AUTO_INCREMENT,
 * `lyhenne` varchar(3) NOT NULL,
 * `nimi` varchar(15) NOT NULL,
 * `kausi` tinyint(4) unsigned NOT NULL,
 * `lohko` tinyint(3) DEFAULT NULL,
 * `ravintola` tinyint(3) unsigned NOT NULL,
 * `yhdhenk` varchar(40) DEFAULT NULL,
 * `yhdpuh` varchar(15) DEFAULT NULL,
 * `kapt` varchar(20) DEFAULT NULL,
 * `kpuh` varchar(15) DEFAULT NULL,
 * `varakapt` varchar(25) DEFAULT NULL,
 * `vkpuh` varchar(15) DEFAULT NULL,
 */
type ep_joukkue = {
    id: number;
    lyhenne: string;
    nimi: string;
    kausi: number;      // ep_kausi
    lohko: number;      // ep_lohko
    ravintola: number;  // ep_rafla
    yhdhenk: string;
    yhdpuh: string;
    kapt: string;
    kpuh: string;
    varakapt: string;
    vkpuh: string;
}

/**
 * SQL: 
 * `id` int(11) NOT NULL AUTO_INCREMENT,
 * `nimi` varchar(15) CHARACTER SET utf8 COLLATE utf8_swedish_ci DEFAULT NULL COMMENT 'kaudella nimi',
 * `joukkue` smallint(6) unsigned NOT NULL,
 * `jasen` smallint(6) DEFAULT NULL,
 * `pelit` tinyint(4) NOT NULL DEFAULT '0',
 * `v_era` smallint(6) NOT NULL DEFAULT '0',
 * `h_era` smallint(6) NOT NULL DEFAULT '0',
 * `e_era` smallint(6) NOT NULL DEFAULT '0',
 * `h_peli` tinyint(4) NOT NULL DEFAULT '0',
 * `e_peli` tinyint(4) NOT NULL DEFAULT '0',
 * `v_peli` tinyint(4) NOT NULL DEFAULT '0',
 * `sukupuoli` varchar(1) NOT NULL,
 */
type ep_pelaaja = {
    id: number;
    nimi: number;
    joukkue: number;        // ep_joukkue
    jasen: number;          // ep_jasen
    sukupuoli: "" | "M" | "N";
}

/** SQL:
 * `id` smallint(6) NOT NULL AUTO_INCREMENT,
 * `jasenno` smallint(6) DEFAULT NULL,
 * `etunimi` varchar(10) CHARACTER SET utf8 COLLATE utf8_swedish_ci DEFAULT NULL,
 * `suku` varchar(15) CHARACTER SET utf8 COLLATE utf8_swedish_ci DEFAULT NULL,
 * `pelaaja` varchar(12) CHARACTER SET utf8 COLLATE utf8_swedish_ci DEFAULT NULL,
 */
type ep_jasen = {
    id: number;
    jasenno: number;
    etunimi: string;
    suku: string;
    pelaaja: string;
}

/** SQL:
 * `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
 * `vuosi` tinyint(4) unsigned NOT NULL COMMENT 'kauden no',
 * `kausi` char(9) NOT NULL,
 * `Laji` varchar(1) CHARACTER SET utf8 COLLATE utf8_swedish_ci NOT NULL COMMENT 'r=runko, p=pudotus',
 */
type ep_kausi = {
    id: number;
    vuosi: number;
    kausi: string;
    laji: "r" | "p";
}

/** SQL:
 * `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
 * `kausi` tinyint(4) unsigned NOT NULL,
 * `tunnus` char(2) NOT NULL,
 * `selite` text NOT NULL,
 */
type ep_lohko = {
    id: number;
    kausi: number;      // ep_kausi
    tunnus: string;
    selite: string;
}

/**
 * SQL:
 * `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
 * `lyhenne` varchar(3) CHARACTER SET utf8 COLLATE utf8_swedish_ci NOT NULL,
 * `nimi` varchar(20) NOT NULL,
 * `osoite` varchar(30) CHARACTER SET utf8 COLLATE utf8_swedish_ci DEFAULT NULL,
 * `postosoite` varchar(30) CHARACTER SET utf8 COLLATE utf8_swedish_ci DEFAULT NULL,
 * `kauposa` varchar(20) CHARACTER SET utf8 COLLATE utf8_swedish_ci DEFAULT NULL,
 * `yhdhenk` varchar(30) CHARACTER SET utf8 COLLATE utf8_swedish_ci DEFAULT NULL,
 * `yhdpuh` varchar(15) CHARACTER SET utf8 COLLATE utf8_swedish_ci DEFAULT NULL,
 */
type ep_rafla = {
    id: number;
    lyhenne: string;
    nimi: string;
    osoite: string;
    postosoite: string;
    kaupsa: string;
    yhdhenk: string;
    yhdpuh: string;
}

/** SQL:
 * `Nimi` varchar(12) CHARACTER SET latin1 NOT NULL,
 * `Joukkue` varchar(3) CHARACTER SET latin1 NOT NULL,
 * `MD5` varchar(50) COLLATE utf8_swedish_ci NOT NULL,
 */
type userpw = {
    Nimi: string;
    Joukkue: string;
    MD5: string;
}