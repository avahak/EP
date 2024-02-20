-- NOTE: Johdettava:
-- ep_peli: ktulos, vtulos
-- ep_ottelu: ktulos, vtulos
-- ep_pelaaja: pelit, v_era, h_era, e_era, h_peli, e_peli, v_peli, pelit


CREATE DATABASE IF NOT EXISTS testaus_ep CHARACTER SET utf8 COLLATE utf8_swedish_ci;
USE testaus_ep;

-- ep_rafla (ravintolat)
DROP TABLE IF EXISTS ep_rafla;
CREATE TABLE ep_rafla (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lyhenne VARCHAR(3) NOT NULL,
    nimi VARCHAR(20) NOT NULL,
    osoite VARCHAR(30) DEFAULT NULL,
    postosoite VARCHAR(30) DEFAULT NULL,
    kauposa VARCHAR(20) DEFAULT NULL,
    yhdhenk VARCHAR(30) DEFAULT NULL,
    yhdpuh VARCHAR(15) DEFAULT NULL
) ENGINE=InnoDB;

-- ep_kausi
DROP TABLE IF EXISTS ep_kausi;
CREATE TABLE ep_kausi (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vuosi INT NOT NULL COMMENT 'kauden no',
    kausi VARCHAR(9) NOT NULL,
    Laji ENUM('r', 'p') NOT NULL COMMENT 'r=runko, p=pudotus'
) ENGINE=InnoDB;

-- ep_lohko
DROP TABLE IF EXISTS ep_lohko;
CREATE TABLE ep_lohko (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kausi INT NOT NULL,
    tunnus VARCHAR(2) NOT NULL,
    selite TEXT NOT NULL,
    FOREIGN KEY (kausi) REFERENCES ep_kausi(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ep_joukkue
DROP TABLE IF EXISTS ep_joukkue;
CREATE TABLE ep_joukkue (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lyhenne VARCHAR(3) NOT NULL,
    nimi VARCHAR(15) NOT NULL,
    kausi INT NOT NULL,
    lohko INT DEFAULT NULL,
    ravintola INT NOT NULL,
    yhdhenk VARCHAR(40) DEFAULT NULL,
    yhdpuh VARCHAR(15) DEFAULT NULL,
    kapt VARCHAR(20) DEFAULT NULL,
    kpuh VARCHAR(15) DEFAULT NULL,
    varakapt VARCHAR(25) DEFAULT NULL,
    vkpuh VARCHAR(15) DEFAULT NULL,
    FOREIGN KEY (kausi) REFERENCES ep_kausi(id) ON DELETE CASCADE,
    FOREIGN KEY (lohko) REFERENCES ep_lohko(id) ON DELETE CASCADE,
    FOREIGN KEY (ravintola) REFERENCES ep_rafla(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ep_jasen
DROP TABLE IF EXISTS ep_jasen;
CREATE TABLE ep_jasen (
    id INT PRIMARY KEY AUTO_INCREMENT,
    jasenno INT DEFAULT NULL,
    etunimi VARCHAR(10) DEFAULT NULL,
    suku VARCHAR(15) DEFAULT NULL,
    pelaaja VARCHAR(12) DEFAULT NULL
) ENGINE=InnoDB;

-- ep_pelaaja
DROP TABLE IF EXISTS ep_pelaaja;
CREATE TABLE ep_pelaaja (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nimi VARCHAR(15) DEFAULT NULL COMMENT 'kaudella nimi',
    joukkue INT NOT NULL,
    jasen INT DEFAULT NULL,
    pelit INT NOT NULL DEFAULT 0,
    v_era INT NOT NULL DEFAULT 0,
    h_era INT NOT NULL DEFAULT 0,
    h_peli INT NOT NULL DEFAULT 0,
    v_peli INT NOT NULL DEFAULT 0,
    sukupuoli ENUM('-', 'M', 'N') DEFAULT '-',
    FOREIGN KEY (joukkue) REFERENCES ep_joukkue(id) ON DELETE CASCADE,
    FOREIGN KEY (jasen) REFERENCES ep_jasen(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ep_ottelu
DROP TABLE IF EXISTS ep_ottelu;
CREATE TABLE ep_ottelu (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lohko INT NOT NULL,
    paiva DATE DEFAULT NULL,
    koti INT DEFAULT NULL,
    vieras INT DEFAULT NULL,
    ktulos INT DEFAULT NULL,
    vtulos INT DEFAULT NULL,
    status ENUM('H', 'M', 'V', 'K', 'T') NOT NULL,
    FOREIGN KEY (lohko) REFERENCES ep_lohko(id) ON DELETE CASCADE,
    FOREIGN KEY (koti) REFERENCES ep_joukkue(id) ON DELETE CASCADE,
    FOREIGN KEY (vieras) REFERENCES ep_joukkue(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ep_peli
DROP TABLE IF EXISTS ep_peli;
CREATE TABLE ep_peli (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ottelu INT NOT NULL,
    kp INT DEFAULT NULL,
    vp INT DEFAULT NULL,
    ktulos INT DEFAULT NULL,
    vtulos INT DEFAULT NULL,
    FOREIGN KEY (ottelu) REFERENCES ep_ottelu(id) ON DELETE CASCADE,
    FOREIGN KEY (kp) REFERENCES ep_pelaaja(id) ON DELETE CASCADE,
    FOREIGN KEY (vp) REFERENCES ep_pelaaja(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ep_erat
-- erien mahdolliset tulokset: V0-V6, K1-K6
-- K1: 1, K2: A, K3: 9, K4: K, K5: C, K6: V
DROP TABLE IF EXISTS ep_erat;
CREATE TABLE ep_erat (
    id INT PRIMARY KEY AUTO_INCREMENT,
    peli INT NOT NULL,
    era1 VARCHAR(2) DEFAULT 'V0',
    era2 VARCHAR(2) DEFAULT 'V0',
    era3 VARCHAR(2) DEFAULT 'V0',
    era4 VARCHAR(2) DEFAULT 'V0',
    era5 VARCHAR(2) DEFAULT 'V0',
    FOREIGN KEY (peli) REFERENCES ep_peli(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- userpw
DROP TABLE IF EXISTS userpw;
CREATE TABLE userpw (
    Nimi VARCHAR(12) NOT NULL,
    Joukkue VARCHAR(3) NOT NULL,
    MD5 VARCHAR(50) NOT NULL,
    PRIMARY KEY (Nimi, Joukkue)
) ENGINE=InnoDB;