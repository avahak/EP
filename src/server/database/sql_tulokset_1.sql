-- Automaattisesti kutsuttavia (triggers) proseduureja päivittämään _tulokset
-- taulujen kenttiä.

-- Tässä tiedostossa määritellään proseduuri "procedure_update_all_tulokset_from_erat",
-- joka on toiminnaltaan hyvin samankaltainen kuin "procedure_update_all_from_erat",
-- joka määriteltiin tiedostossa "sql_procedures.sql" mutta nyt muutetaan 
-- _tulokset tauluja varsinaisten taulujen sijasta. Lisäksi muutoksia tehdään
-- ainoastaan jos ottelun status on 'H'. Tämän tiedoston proseduureja ei
-- kutsuta manuaalisesti vaan niitä kutsutaan tiedostossa "sql_tulokset_2.sql"
-- määritellyissä triggereissä kun erätuloksia tai muita varsinaisten taulujen rivejä
-- muutetaan.

DELIMITER //

-- Lisää kt/vt yhdellä jos erä on koti/vieras voitto.
DROP PROCEDURE IF EXISTS procedure_count_round_win //
CREATE PROCEDURE procedure_count_round_win(IN era VARCHAR(2), INOUT kt INT, INOUT vt INT)
BEGIN
    IF era IS NOT NULL THEN
        IF era REGEXP 'K[1-6]$' THEN
            SET kt = kt + 1;
        ELSEIF era != 'V0' THEN
            SET vt = vt + 1;
        END IF;
    END IF;
END //

-- Laskee pelin tuloksen laskemalla erävoitot yhteen.
DROP PROCEDURE IF EXISTS procedure_calculate_peli_result //
CREATE PROCEDURE procedure_calculate_peli_result(
    IN era1 VARCHAR(2),
    IN era2 VARCHAR(2),
    IN era3 VARCHAR(2),
    IN era4 VARCHAR(2),
    IN era5 VARCHAR(2),
    OUT ktulos INT,
    OUT vtulos INT
)
BEGIN
    DECLARE new_ktulos INT DEFAULT 0;
    DECLARE new_vtulos INT DEFAULT 0;

    CALL procedure_count_round_win(era1, new_ktulos, new_vtulos);
    CALL procedure_count_round_win(era2, new_ktulos, new_vtulos);
    CALL procedure_count_round_win(era3, new_ktulos, new_vtulos);
    CALL procedure_count_round_win(era4, new_ktulos, new_vtulos);
    CALL procedure_count_round_win(era5, new_ktulos, new_vtulos);

    SET ktulos = new_ktulos;
    SET vtulos = new_vtulos;
END //

-- Ottaa vastaan pelin uuden tuloksen ja päivittää tauluja
-- ep_peli_tulokset, ep_ottelu_tulokset, ep_pelaaja_tulokset, ep_joukkue_tulokset 
-- kumoamalla vanhan tuloksen vaikutukset ja ottamalla uusi tulos huomioon.
DROP PROCEDURE IF EXISTS procedure_update_all_tulokset_from_peli //
CREATE PROCEDURE procedure_update_all_tulokset_from_peli(
    IN peli_id INT,
    IN new_peli_ktulos INT,
    IN new_peli_vtulos INT
)
BEGIN
    -- Muuttujia säilyttämään id-kenttiä:
    DECLARE ottelu_id INT;
    DECLARE koti_pelaaja_id INT;
    DECLARE vieras_pelaaja_id INT;
    DECLARE koti_joukkue_id INT;
    DECLARE vieras_joukkue_id INT;

    -- Muuttuja ottelun statukselle:
    DECLARE ottelu_status VARCHAR(1);

    -- Vanha ktulos, vtulos ep_peli_tulokset taulussa:
    DECLARE old_peli_ktulos INT;
    DECLARE old_peli_vtulos INT;

    -- Vanha ja uusi ktulos, vtulos ep_ottelu_tulokset taulussa:
    DECLARE old_ottelu_ktulos INT;
    DECLARE old_ottelu_vtulos INT;
    DECLARE new_ottelu_ktulos INT;
    DECLARE new_ottelu_vtulos INT;

    -- Vanha ja uusi tieto pelin voittajasta, kukin näistä on 0/1:
    -- HUOM. molemmat x_home_win, x_away_win voivat olla nollia jos tuloksia ei vielä ole.
    -- Tämän takia tarvitaan erillisit muuttujat.
    DECLARE old_is_peli_home_win INT;
    DECLARE old_is_peli_away_win INT;
    DECLARE new_is_peli_home_win INT;
    DECLARE new_is_peli_away_win INT;

    -- Vanha ja uusi tieto ottelun voittajasta, kukin näistä on 0/1:
    DECLARE old_is_ottelu_home_win INT;
    DECLARE old_is_ottelu_away_win INT;
    DECLARE new_is_ottelu_home_win INT;
    DECLARE new_is_ottelu_away_win INT;

    -- Alustetaan ottelu_id, koti_pelaaja_id, vieras_pelaaja_id:
    SELECT ottelu, kp, vp INTO ottelu_id, koti_pelaaja_id, vieras_pelaaja_id
        FROM ep_peli
        WHERE id = peli_id;

    -- Alustetaan ottelu_status, koti_joukkue_id, vieras_joukkue_id:
    SELECT status, koti, vieras INTO ottelu_status, koti_joukkue_id, vieras_joukkue_id
        FROM ep_ottelu
        WHERE id = ottelu_id;

    -- Jos status ei ole 'H', niin ei tehdä mitään (tuloksia ei vielä ole vahvistettu):
    IF ottelu_status = 'H' THEN 

        -- Alustetaan old_peli_ktulos, old_peli_vtulos:
        SELECT COALESCE(ktulos, 0), COALESCE(vtulos, 0) 
            INTO old_peli_ktulos, old_peli_vtulos
            FROM ep_peli_tulokset
            WHERE peli = peli_id;

        -- Alustetaan old_ottelu_ktulos, old_ottelu_vtulos:
        SELECT COALESCE(ktulos, 0), COALESCE(vtulos, 0) 
            INTO old_ottelu_ktulos, old_ottelu_vtulos
            FROM ep_ottelu_tulokset
            WHERE ottelu = ottelu_id;

        -- Asetetaan pelin koti- ja vierasvoitosta kertovat muttujat:
        SET old_is_peli_home_win = IF(old_peli_ktulos > old_peli_vtulos, 1, 0);
        SET old_is_peli_away_win = IF(old_peli_vtulos > old_peli_ktulos, 1, 0);
        SET new_is_peli_home_win = IF(new_peli_ktulos > new_peli_vtulos, 1, 0);
        SET new_is_peli_away_win = IF(new_peli_vtulos > new_peli_ktulos, 1, 0);

        -- Lasketaan ottelun uusi tulos:
        SET new_ottelu_ktulos = old_ottelu_ktulos + new_is_peli_home_win - old_is_peli_home_win;
        SET new_ottelu_vtulos = old_ottelu_vtulos + new_is_peli_away_win - old_is_peli_away_win;

        -- Asetetaan ottelun koti- ja vierasvoitosta kertovat muttujat:
        SET old_is_ottelu_home_win = IF(old_ottelu_ktulos > old_ottelu_vtulos, 1, 0);
        SET old_is_ottelu_away_win = IF(old_ottelu_vtulos > old_ottelu_ktulos, 1, 0);
        SET new_is_ottelu_home_win = IF(new_ottelu_ktulos > new_ottelu_vtulos, 1, 0);
        SET new_is_ottelu_away_win = IF(new_ottelu_vtulos > new_ottelu_ktulos, 1, 0);

        -- Päivitetään ep_peli_tulokset:
        UPDATE ep_peli_tulokset
            SET ktulos = new_peli_ktulos, vtulos = new_peli_vtulos
            WHERE peli = peli_id;

        -- Päivitetään ep_ottelu_tulokset:
        UPDATE ep_ottelu_tulokset 
            SET ktulos = new_ottelu_ktulos, vtulos = new_ottelu_vtulos
            WHERE ottelu = ottelu_id;
                
        -- Päivitetään ep_pelaaja_tulokset kotipelaajalle:
        UPDATE ep_pelaaja_tulokset
            SET v_era = v_era + new_peli_ktulos - old_peli_ktulos,
                h_era = h_era + new_peli_vtulos - old_peli_vtulos,
                v_peli = v_peli + new_is_peli_home_win - old_is_peli_home_win,
                h_peli = h_peli + new_is_peli_away_win - old_is_peli_away_win
            WHERE pelaaja = koti_pelaaja_id;
        
        -- Päivitetään ep_pelaaja_tulokset vieraspelaajalle:
        UPDATE ep_pelaaja_tulokset
            SET v_era = v_era + new_peli_vtulos - old_peli_vtulos,
                h_era = h_era + new_peli_ktulos - old_peli_ktulos,
                v_peli = v_peli + new_is_peli_away_win - old_is_peli_away_win,
                h_peli = h_peli + new_is_peli_home_win - old_is_peli_home_win
            WHERE pelaaja = vieras_pelaaja_id;

        -- Päivitetään ep_joukkue_tulokset kotijoukkueelle:
        UPDATE ep_joukkue_tulokset
            SET v_era = v_era + new_peli_ktulos - old_peli_ktulos,
                h_era = h_era + new_peli_vtulos - old_peli_vtulos,
                v_peli = v_peli + new_is_peli_home_win - old_is_peli_home_win,
                h_peli = h_peli + new_is_peli_away_win - old_is_peli_away_win,
                voitto = voitto + new_is_ottelu_home_win - old_is_ottelu_home_win,
                tappio = tappio + new_is_ottelu_away_win - old_is_ottelu_away_win
            WHERE joukkue = koti_joukkue_id;

        -- Päivitetään ep_joukkue_tulokset vierasjoukkueelle:
        UPDATE ep_joukkue_tulokset
            SET v_era = v_era + new_peli_vtulos - old_peli_vtulos,
                h_era = h_era + new_peli_ktulos - old_peli_ktulos,
                v_peli = v_peli + new_is_peli_away_win - old_is_peli_away_win,
                h_peli = h_peli + new_is_peli_home_win - old_is_peli_home_win,
                voitto = voitto + new_is_ottelu_away_win - old_is_ottelu_away_win,
                tappio = tappio + new_is_ottelu_home_win - old_is_ottelu_home_win
            WHERE joukkue = vieras_joukkue_id;
    END IF;
END //

-- Ottaa vastaan ep_peli id ja päivittää tauluja
-- ep_peli_tulokset, ep_ottelu_tulokset, ep_pelaaja_tulokset, ep_joukkue_tulokset 
-- kumoamalla vanhat pelin vaikutukset ja ottamalla erätulokset huomioon.
DROP PROCEDURE IF EXISTS procedure_update_all_tulokset_from_erat //
CREATE PROCEDURE procedure_update_all_tulokset_from_erat(
    IN peli_id INT
)
BEGIN
    -- Muuttujat ep_erat riville kentille:
    DECLARE era1_value VARCHAR(2);
    DECLARE era2_value VARCHAR(2);
    DECLARE era3_value VARCHAR(2);
    DECLARE era4_value VARCHAR(2);
    DECLARE era5_value VARCHAR(2);

    -- Muuttujat uudelle pelin tulokselle:
    DECLARE ktulos INT DEFAULT 0;
    DECLARE vtulos INT DEFAULT 0;

    -- Alustetaan muttujia:
    SELECT era1, era2, era3, era4, era5
        INTO era1_value, era2_value, era3_value, era4_value, era5_value
        FROM ep_erat
        WHERE peli = peli_id;

    -- Lasketaan uusi pelin tulos (ktulos, vtulos):
    CALL procedure_calculate_peli_result(era1_value, era2_value, era3_value, era4_value, era5_value, ktulos, vtulos);

    -- Päivitetään tuloksia useassa taulussa ottaen huomioon uuden pelin tuloksen:
    CALL procedure_update_all_tulokset_from_peli(peli_id, ktulos, vtulos);
END //


DELIMITER ;