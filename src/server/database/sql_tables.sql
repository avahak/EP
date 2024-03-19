-- Kaavio tietokannalle takaisku_testaus_ep

CREATE DATABASE IF NOT EXISTS `takaisku_testaus_ep` CHARACTER SET utf8 COLLATE utf8_swedish_ci;
USE `takaisku_testaus_ep`;

-- ep_rafla (ravintolat)
DROP TABLE IF EXISTS `ep_rafla`;
CREATE TABLE `ep_rafla` (
    `id` TINYINT(3) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `lyhenne` VARCHAR(3) NOT NULL,
    `nimi` VARCHAR(20) NOT NULL,
    `osoite` VARCHAR(30) DEFAULT NULL,
    `postosoite` VARCHAR(30) DEFAULT NULL,
    `kauposa` VARCHAR(20) DEFAULT NULL,
    `yhdhenk` VARCHAR(30) DEFAULT NULL,
    `yhdpuh` VARCHAR(15) DEFAULT NULL
) ENGINE=InnoDB;

-- ep_kausi
DROP TABLE IF EXISTS `ep_kausi`;
CREATE TABLE `ep_kausi` (
    `id` TINYINT(4) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `vuosi` TINYINT(4) UNSIGNED NOT NULL COMMENT 'kauden no',
    `kausi` VARCHAR(9) NOT NULL,
    `Laji` VARCHAR(1) NOT NULL COMMENT 'r=runko, p=pudotus'
) ENGINE=InnoDB;

-- ep_lohko
DROP TABLE IF EXISTS `ep_lohko`;
CREATE TABLE `ep_lohko` (
    `id` TINYINT(3) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `kausi` TINYINT(4) UNSIGNED NOT NULL,
    `tunnus` CHAR(2) NOT NULL,
    `selite` TEXT NOT NULL,
    FOREIGN KEY (`kausi`) REFERENCES ep_kausi(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ep_joukkue
DROP TABLE IF EXISTS `ep_joukkue`;
CREATE TABLE `ep_joukkue` (
    `id` SMALLINT(6) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `lyhenne` VARCHAR(3) NOT NULL,
    `nimi` VARCHAR(15) NOT NULL,
    `kausi` TINYINT(4) UNSIGNED NOT NULL,
    `lohko` TINYINT(3) UNSIGNED DEFAULT NULL,
    `ravintola` TINYINT(3) UNSIGNED NOT NULL,
    `yhdhenk` VARCHAR(40) DEFAULT NULL,
    `yhdpuh` VARCHAR(15) DEFAULT NULL,
    `kapt` VARCHAR(20) DEFAULT NULL,
    `kpuh` VARCHAR(15) DEFAULT NULL,
    `varakapt` VARCHAR(25) DEFAULT NULL,
    `vkpuh` VARCHAR(15) DEFAULT NULL,
    FOREIGN KEY (`kausi`) REFERENCES ep_kausi(`id`),
    FOREIGN KEY (`lohko`) REFERENCES ep_lohko(`id`),
    FOREIGN KEY (`ravintola`) REFERENCES ep_rafla(`id`)
) ENGINE=InnoDB;

-- ep_jasen
DROP TABLE IF EXISTS `ep_jasen`;
CREATE TABLE `ep_jasen` (
    `id` SMALLINT(6) PRIMARY KEY AUTO_INCREMENT,
    `jasenno` SMALLINT(6) DEFAULT NULL,
    `etunimi` VARCHAR(10) DEFAULT NULL,
    `suku` VARCHAR(15) DEFAULT NULL,
    `pelaaja` VARCHAR(12) DEFAULT NULL
) ENGINE=InnoDB;

-- ep_pelaaja
DROP TABLE IF EXISTS `ep_pelaaja`;
CREATE TABLE `ep_pelaaja` (
    `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
    `nimi` VARCHAR(15) DEFAULT NULL COMMENT 'kaudella nimi',
    `joukkue` SMALLINT(6) UNSIGNED NOT NULL,
    `jasen` SMALLINT(6) DEFAULT NULL,
    `pelit` TINYINT(4) NOT NULL DEFAULT 0,
    `v_era` SMALLINT(6) NOT NULL DEFAULT 0,
    `h_era` SMALLINT(6) NOT NULL DEFAULT 0,
    `e_era` SMALLINT(6) NOT NULL DEFAULT 0,
    `h_peli` TINYINT(4) NOT NULL DEFAULT 0,
    `v_peli` TINYINT(4) NOT NULL DEFAULT 0,
    `e_peli` TINYINT(4) NOT NULL DEFAULT 0,
    `sukupuoli` VARCHAR(1) NOT NULL,
    FOREIGN KEY (`joukkue`) REFERENCES ep_joukkue(`id`),
    FOREIGN KEY (`jasen`) REFERENCES ep_jasen(`id`)
) ENGINE=InnoDB;

-- ep_ottelu
DROP TABLE IF EXISTS `ep_ottelu`;
CREATE TABLE `ep_ottelu` (
    `id` INT(10) UNSIGNED PRIMARY KEY,
    `lohko` TINYINT(3) NOT NULL,
    `paiva` DATE DEFAULT NULL,
    `koti` SMALLINT(6) DEFAULT NULL,
    `vieras` SMALLINT(6) DEFAULT NULL,
    `ktulos` TINYINT(4) DEFAULT NULL,
    `vtulos` TINYINT(4) DEFAULT NULL,
    `status` VARCHAR(1) NOT NULL
) ENGINE=MyISAM;

-- ep_sarjat
-- Nämä ovat tilastoja joukkueelle
DROP TABLE IF EXISTS `ep_sarjat`;
CREATE TABLE `ep_sarjat` (
    `id` SMALLINT(6) PRIMARY KEY,
    `nimi` VARCHAR(15) DEFAULT NULL COMMENT 'kaudella nimi',
    `joukkue` SMALLINT(6) UNSIGNED NOT NULL,
    `lyhenne` TEXT NOT NULL,
    `lohko` TINYINT(3) DEFAULT NULL,
    `ottelu` SMALLINT(4) NOT NULL DEFAULT 0,
    `voitto` TINYINT(4) NOT NULL DEFAULT 0,
    `tappio` TINYINT(4) NOT NULL DEFAULT 0,
    `v_era` SMALLINT(6) NOT NULL DEFAULT 0,
    `h_era` SMALLINT(6) NOT NULL DEFAULT 0,
    `h_peli` SMALLINT(6) NOT NULL DEFAULT 0,
    `v_peli` SMALLINT(6) NOT NULL DEFAULT 0
) ENGINE=MyISAM;

-- ep_peli
DROP TABLE IF EXISTS `ep_peli`;
CREATE TABLE `ep_peli` (
    `id` INT(11) UNSIGNED PRIMARY KEY,
    `ottelu` INT(11) UNSIGNED NOT NULL,
    `kp` INT(11) DEFAULT NULL,
    `vp` INT(11) DEFAULT NULL,
    `ktulos` TINYINT(3) DEFAULT NULL,
    `vtulos` TINYINT(3) DEFAULT NULL
) ENGINE=MyISAM;

-- ep_erat
-- erien mahdolliset tulokset: V0-V6, K0-K6
-- K0: -, K1: 1, K2: A, K3: 9, K4: K, K5: C, K6: V
DROP TABLE IF EXISTS `ep_erat`;
CREATE TABLE `ep_erat` (
    `id` INT(10) UNSIGNED PRIMARY KEY,
    `peli` INT(10) UNSIGNED NOT NULL,
    `era1` VARCHAR(2) NOT NULL,
    `era2` VARCHAR(2) NOT NULL,
    `era3` VARCHAR(2) NOT NULL,
    `era4` VARCHAR(2) NOT NULL,
    `era5` VARCHAR(2) NOT NULL
) ENGINE=MyISAM;

-- userpw
DROP TABLE IF EXISTS `userpw`;
CREATE TABLE `userpw` (
    `Nimi` VARCHAR(12) NOT NULL,
    `Joukkue` VARCHAR(3) NOT NULL,
    `MD5` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`Nimi`, `Joukkue`)
) ENGINE=InnoDB;

-- ep_peli_tulokset
DROP TABLE IF EXISTS `ep_peli_tulokset`;
CREATE TABLE `ep_peli_tulokset` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `peli` INT NOT NULL,
    `ktulos` INT DEFAULT 0,
    `vtulos` INT DEFAULT 0
    -- FOREIGN KEY (`peli`) REFERENCES ep_peli(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ep_ottelu_tulokset
DROP TABLE IF EXISTS `ep_ottelu_tulokset`;
CREATE TABLE `ep_ottelu_tulokset` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `ottelu` INT NOT NULL,
    `ktulos` INT DEFAULT 0,
    `vtulos` INT DEFAULT 0
    -- FOREIGN KEY (`ottelu`) REFERENCES ep_ottelu(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ep_pelaaja_tulokset
DROP TABLE IF EXISTS `ep_pelaaja_tulokset`;
CREATE TABLE `ep_pelaaja_tulokset` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `pelaaja` INT NOT NULL,
    `v_era` INT DEFAULT 0,
    `h_era` INT DEFAULT 0,
    `v_peli` INT DEFAULT 0,
    `h_peli` INT DEFAULT 0
    -- FOREIGN KEY (`pelaaja`) REFERENCES ep_pelaaja(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ep_joukkue_tulokset
DROP TABLE IF EXISTS `ep_joukkue_tulokset`;
CREATE TABLE `ep_joukkue_tulokset` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `joukkue` INT NOT NULL,
    `v_era` INT DEFAULT 0,
    `h_era` INT DEFAULT 0,
    `v_peli` INT DEFAULT 0,
    `h_peli` INT DEFAULT 0,
    `voitto` INT DEFAULT 0,
    `tappio` INT DEFAULT 0
    -- FOREIGN KEY (`joukkue`) REFERENCES ep_joukkue(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;