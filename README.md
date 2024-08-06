Express.js, React, ja MySQL koodia biljardiliigan verkkosivuille.  
  
## Tietokannasta

Tietokantaan on lisätty taulut
* `ep_peli_tulokset`
* `ep_ottelu_tulokset`
* `ep_pelaaja_tulokset`
* `ep_joukkue_tulokset`

Nämä taulut sisältävät samat johdetut tuloskentät kuin takaisku_ep vastaavat varsinaiset taulut (tässä `ep_joukkue_tulokset` ja `ep_sarjat` vastaavat toisiaan). SQL-proseduurit ja triggerit määritelty tiedostoissa `sql_tulokset_1.sql` ja `sql_tulokset_2.sql` on tarkoitus pitää näitä tauluja automaattisesti ajan tasalla kun `ep_erat` tietoja muutetaan, lisätään, tai poistetaan.

Johdetut tuloskentät on siis nyt talletettu sekä varsinaisissa tauluissa, että näissä `_tulokset` tauluissa. Kun tuloksia ilmoitetaan, niin `_tulokset` taulut päivittyvät automaattisesti kun `ep_erat` rivejä lisätään. Varsinaisissa tauluissa olevia tuloskenttiä voi päivittää kutsumalla `sql_procedures.sql` tiedostossa määriteltyä proseduuria `procedure_update_all_old_from_erat`, joka laskee annetun pelin vaikutuksen varsinaisten taulujen tuloskenttiin ja päivittää niitä. Tämä proseduuri on räätälöity toimimaan ottelun ilmoitustilanteessa ja ei välttämättä toimi muissa tilanteissa.

## Tietoturva ja käyttäjien autentikaatio

Frontendiltä tuleviin pyyntöihin ei voi tarkistamatta luottaa koska on mahdotonta täysin kontrolloida käyttäjän selaimen tilaa tai palvelimelle lähetettäviä pyyntöjä. Tästä syystä palvelimelle tuleva data tulee validoida vaikka se olisikin jo validoitu React-puolella ja käyttäjä tulee autentikoida palvelinpuolella jos tähän on tarvetta.

Frontend-puolella validointi ja autentikaatio on siis käyttäjäkokemusta varten, backend-puolella validointi ja autentikaatio on tietoturvaa ja tietojen eheyttä varten.

##### JWT-token

Perusidea JWT-token autentikoinnissa on, että JWT-token on merkkijono, joka koodaa dataa. Sen voi lukea kuka tahansa mutta sen muuttaminen on rajoitettu kryptografisesti, joten palvelin voi aina varmista siitä, onko se itse luonut annetun tokenin. Tämä ominaisuus tekee JWT tokenista luotettavan tavan todentaa käyttäjän identiteetti.

Kun käyttäjä kirjautuu sisään, palvelin luo ja lähettää käyttäjälle JWT-tokenin. Käyttäjän selain tallettaa tämän local storageen ja esittää sen palvelimelle digitaalisena "henkilökorttina" suojattuja API-reittejä käytettäessä. Palvelin tarkistaa tokenin varmistaen, että se on voimassa ja palvelimen luoma.

Käytännössä käytetään kahta JWT-tokenia: refresh token ja access token. Molemmat sisältävät tiedot käyttäjän identifikaatioon mutta niitä käytetään eri tavalla. Access token on lyhytikäinen (esim. 1h), joka välitetään palvelimelle Authorization  headerissa suojatuilla API-reiteillä. Palvelin tunnistaa käyttäjän access tokenin perusteella. Refresh token on pitkäikäinen (esim. 3kk), ja sitä käytetään uusien access tokenien luomiseen, kun se välitetään palvelimelle.

Kahden tokenin käyttäminen auttaa suojaamaan sovellusta: access tokenin lyhytikäisyys vähentää riskejä, jos se joutuu vääriin käsiin, ja refresh tokenin pitkäikäisyys tarjoaa käyttäjälle mukavuutta, kun hänen ei tarvitse kirjautua uudelleen sisään usein. Yhdellä tokenilla molemmat edut eivät olisi mahdollisia samanaikaisesti.

## Tunnettuja puutteita ja ongelmia

* Kaikkea koodia ei ole testattu tarpeeksi. Esimerkiksi tietokantaproseduurien ja triggerien toimintaa kannattaa seurata. Näiden tulisi toimia moitteetta kun tuloksia ilmoitetaan React frontend käyttäen mutta tietokannan tietoja voi muttaa monella tavalla ja kaikkia näitä ei ole testattu. 

* Masters pörssi ei ole mukana html taulukoissa.

* Taulujen muutos InnoDB:stä MyISAM moottoriin hidasti merkittävästi rivien lisäystä. InnoDB käyttäen 10000 pelin tietokannan perustaminen kesti noin 10sec, nyt MyISAM käyttäen siinä meni noin 2min. Perimmäinen syy tähän ei ole selvä mutta InnoDB on selvästi useasta syystä parempi ratkaisu kaikkiin tauluihin.

# Kayttöönottoon tarvittavat askeleet

Seuraavassa on käyttöönottoon vaadittavia askelia. Tämän on kuvaa antava karkea lista ja on varmasti puutteellinen. 

##### Esityö:

1. Tietokannan varmuuskopiointi.
2. Korvaa `BannerBox` elementit mainoksilla.
3. Varmistetaan, että käyttöön tuleva "base url" on "/test/". Jos ei ole, niin tulee seuraavat muutokset ennen uudelleenrakentamista (`npm run build`):
* Tiedosto `SideNavigation.tsx` linkit
* Tiedosto `vite.config.ts` muuttuja `base`
* Tiedosto `AppRouter.tsx` prop `basename`
* Tiedosto `apiUtils.ts` funktio `getBackendUrl()` palautusarvo

##### Tietokantamuutokset:

1. `_tulokset` taulujen lisäys tietokantaan: `sql_tables.sql` lopussa olevat taulut.
2. Johdettujen tulosten kopiointi varsinaisista tauluista _tulokset tauluihin:
* `INSERT INTO ep_peli_tulokset (peli, ktulos, vtulos) SELECT id, ktulos, vtulos FROM ep_peli;`, 
* `INSERT INTO ep_ottelu_tulokset (ottelu, ktulos, vtulos) SELECT id, ktulos, vtulos FROM ep_ottelu;`
* `INSERT INTO ep_pelaaja_tulokset (pelaaja, v_era, h_era, v_peli, h_peli) SELECT id, v_era, h_era, v_peli, h_peli FROM ep_pelaaja;`
* `INSERT INTO ep_joukkue_tulokset (joukkue, v_era, h_era, v_peli, h_peli, voitto, tappio) SELECT joukkue, v_era, h_era, v_peli, h_peli, voitto, tappio FROM ep_sarjat;`
3. Proseduurien ja triggerien lisäys tietokantaan `takaisku_ep`:
`sql_procedures.sql`, `sql_tulokset_1.sql`, `sql_tulokset_2.sql` ajo.

##### PHP koodin muutokset

1. Lisätään PHP palvelimelle ympäristömuuttuja `SECRET_KEY`, joka on sama kuin .env tiedostossa Express.js palvelimelle määriteltävä.
2. Asennetaan `firebase/php-jwt` kirjasto käyttäen composer.
3. Lisätään JWT (refresh) tokenin luonti ja talletus local storageen käyttäjän tarkistuksen yhteyteen tiedostossa `tarkista.php`. HUOM! Tässä oletetaan, että React sivut ovat `eastpool.fi` alla, koska muutoin ne eivät käytä samaa local storage tilaa. Jos näin ei ole, tulee käytettyä ratkaisua muuttaa.
4. Lisätään PHP redirect sivu `login_redirect.php`, jonne navigoidaan React puolelta kun JWT refresh token puuttuu.
5. Muutetaan tulosten ilmoituslinkki PHP puolella osoittamaan React sivulle.
6. Lisätään linkki live otteluiden seuraamiseksi jonnekin sopivaan paikkaan.

##### Express.js palvelimen käynnistys:

1. Päivitetään .env tiedosto ympäristömuuttujat (tietokantayhteys, `SECRET_KEY`, `PORT`, `KULUVA_KAUSI`, jne.)
2. Asennetaan tarvittavat paketit ajamalla "npm install".
3. Käynnistetään Express.js palvelin.

---
## Tiedostot ja hakemistot:  
```
index.html - React sovelluksen lataava html tiedosto
  
src/ - Lähdekoodin hakemisto

src/shared/ - Yhteinen kansio Express.js ja Reactille
        commonTypes.ts - Yhteisiä tietorakenteita ja apufunktioita. 
        generalUtils.ts - Sekalaisia yleiseen käyttöön tarkoitettuja apufunktioita,
                esimerkiksi päivämäärämuunnoksia.
        parseMatch.ts - Funktiot ottelupöytäkirjan datan muuntamiseen serverillä
                käytettävään muotoon ja sen validoimiseen serverillä.
        /typescript/ - Sisältää .d.ts tiedostoja, joita tarvitaan   
                TypeScript-yhteensopivuuden mahdollistamiseksi vanhemmille JavaScript-kirjastoille. 

src/server/ - Palvelinpuolen koodin hakemisto  
        generalRoutes.ts - Sekalaisia reittejä (tässä lähinnä tiedostojen latausta).
        imageTools.ts - GrayscaleImage luokka mustavalkoisten kuvien käsittelemiseen 
                ja funktio createThumbnail esikatselukuvan luomiseksi.
        liveScoreRoutes.ts - Live tulospalveluun liittyvät reitit ja muu tarvittava 
                palvelimella.
        serverErrorHandler.ts - Virheenkäsittelyä ja lokitiedoston kirjoitusta serverille.
        server.ts - Express.js serverin luonti. Serveri välittää staattiset tiedostot,
                mukaanlukien React frontendin. Se vastaa myös API-pyyntöihin
                tietokantadatan välittämiseksi frontendille.
        /auth/ - Palvelimen käyttäjien autentikointikoodi
                auth.ts - Reittejä ja middleware määritelmiä käyttäjän 
                        autentikointiin liittyen.
                jwt.ts - JWT token luonti ja tarkistus käyttäen kirjastoa jsonwebtoken.
        /database/ - Palvelimen tietokantaan liittyvä koodi
                sql_tables.sql - Kaavio tietokannalle takaisku_testaus_ep
                sql_procedures.sql - Manuaalisesti kutsuttavia proseduureja päivittämään
                        varsinaisten taulujen tuloskenttiä.
                sql_tulokset_1.sql - Automaattisesti kutsuttavia (triggers) proseduureja 
                        päivittämään _tulokset taulujen kenttiä.
                sql_tulokset_2.sql - Triggereitä laukaisemaan muutoksia 
                        _tulokset tauluissa.
                dbRoutes.ts - Reittejä SQL-kyselyille.
                dbConnections.ts - Kokoelma kierrätettäviä tietokantayhteyksiä.
                dbGeneral.ts - Tietokannan yleiseen käsittelyyn ja luontiin 
                        liittyviä funktioita.
                dbSpecific.ts - Kokoelma tietokantaan kohdistuvia kyselyitä, 
                        joita React app tarvitsee.
                dbFakeData.ts - Testauksessa käytettävän testidatan generointi 
                        ja syöttö tietokantaan.
        /machine_vision/ - Konenäköön liittyviä tiedostoja
                homography.ts - löytää homografian kahden kuvan välillä 
                        niiden piirteiden perusteella.
                hough.ts - Luokka Hough-muunnoksien laskemisksi annetusta 
                        mustavalkoisesta kuvasta.
                machineVisionRoutes.ts - Reittejä konenäköön liittyen.
                
src/client/ - Hakemisto frontend React koodille
        main.tsx - Liittää React sisällön html sivulle.
        
src/client/router/ - Hakemisto React reiteille
        AppRouter.tsx - AppRouter määrittelee kaikki Reactin käytössä olevat reitit.

src/client/utils - Sekalaisia apufunktioita React koodin käyttöön
        apiUtils.ts - Apufunktioita palvelimelle tehtävien API-kutsujen tekemiseen.
        dataSort.ts - Funktio addMultiSortRankColumn ja siihen liittyvä apufunktiot. 
                Se lisää taulumuotoiseen dataan järjestyssarakkeita, joiden avulla 
                data voidaan järjestää prioriteettijärjestelmällä usean sarakkeen mukaan.
        matchTools.ts - Kokoelma ottelupöytäkirjoja käsitteleviä apufunktioita,
                missä ottelupöytäkirja on ScoresheetFields muodossa. Sisältää
                funktioita ottelupöytäkirjan tarkistamiseen, pisteiden laskuun, ja
                funktioita API-kutsuille pelaajien ja tulosten hakemiseen.

src/client/contexts/ - React konteksteja, (="globaaleja tiloja Reactissa").
        AuthenticationContext.tsx - AuthenticationContext on React conteksti, 
                joka pitää kirjaa käyttäjän sisäänkirjautumistilasta 
                AuthenticationState muodossa.
        PageNameContext.tsx - PageNameContext on React conteksti, joka pitää 
                kirjaa tämänhetkisen sivun nimestä.
        SnackbarContext.tsx - SnackbarContext on React konteksti, jonka avulla 
                voidaan luoda tilapäinen ilmoitusviesti. Snackbar ilmestyy 
                yleensä näytön alareunaan viestilaatikkona ja antaa käyttäjälle 
                nopeasti tietoa esim. tapahtuman onnistumisesta.

src/client/component/ - Sivuja ja niiden komponentteja
        App.tsx - Määrittää etusivukomponentin. 
        DBTest.tsx - Testisivu tietokannan uudelleenluontiin. Näyttää 
                tietokannan perustamiskyselyt ja napit uudelleenluontiin.
        FileUpload.tsx - Komponentti tiedostojen lataamiseen palvelimelle.
        ThumbnailSelector.tsx - ThumbnailSelector on primitiivinen vieritettävä 
                esikatselukuvien osio, jossa kuvia voi valita klikkaamalla.
        
src/client/components/layout/ - Komponentteja sivujen ulkoasuun ja osien ryhmittelyyn 
        BannerBox.tsx - Simuloi mainoselementtiä. Nämä korvataan 
                varsinaisilla mainoksilla tuotantoversiossa.
        LayoutWrapper.tsx - LayoutWrapper lisää elementin ympärille valikot ja 
                mainokset. Nämä valitaan responsiivisesti mutta tarkoitus on olla 
                visuaalisesti mahdollisimman lähellä PHP-vastinetta.
        SideNavigation.tsx - Sivukartta komponentti (Linkit.gif) navigointiin 
                sivujen välillä.
        
src/client/components/live_matches/ - Komponentteja live otteluiden esittämiseen.
        LiveMatchCard.tsx - Kortti esittämään yhtä live ottelua. Siinä on joukkueet,
                tulos, ja kirjauksen aloitusaika.
        LiveMatches.tsx - Live otteluiden esityssivu. Näyttää kutakin ottelua kohden
                kortin sen tiedoista. Kun korttia painetaan, näkyy ottelun pöytäkirja.
                Pöytäkirja päivitty automaattisesti käyttäen SSE:tä.

src/client/components/machine_vision/ - Komponentteja konenäköön liittyen.
        DrawHomography.tsx - Komponentti, joka piirtää homografia-esimerkin.
        HomographyDemo.tsx - Sivu homografian esittelemiseen. Palvelin laskee 
                homografian kahden kuvan välille ja esittää sen graafisesti.
        HoughDemo.tsx - Sivu Hough-muunnoksen esittämiseksi.
        VisionExample.tsx - Esimerkki Google Vision API vastauksesta. 

src/client/components/sandbox/ - Sekalaisia vain testauksessa käytettäviä komponentteja.
        DisplayScoresheet.tsx - Esittää yhden ottelun pöytäkirjan (ep_ottelu id=1).
        SimulateLogin.tsx - Simuloi käyttäjän kirjautumista esittämällä käyttäjät 
                linkkeinä ja kun linkkiä painetaan, kirjautuu sisään käyttäjänä.

src/client/components/general_tables/ - Yleiseen käyttöön sopivia 
                html taulukoiden määritelmiä.
        BasicTableStyles.tsx - Tyylejä taulujen kustomoinniksi minimaalisella tyylillä. 
        ResultTable.tsx - Wrapperi Material UI taululle. Esittää tietokantataulun 
                tyyppistä dataa <table> elementtiin pohjautuvalla Material UI komponentilla.

src/client/components/result_tables/ - Sovelluksen käyttöön räätälöityjä taulukoita
        TeamTables.tsx - Joukkueiden sarjatilanne taulukko.
        PlayerTables.tsx - Useita koti- ja vierasotteluiden pistepörssi taulukoita.
        DisplayResultsTeams.tsx - Sivu joukkueiden tulosten esittämiselle.
        DisplayResultsPlayers.tsx - Sivu pelaajien tulosten esittämiselle.

src/client/components/result_submit/ - Komponentteja otteluiden tulosten ilmoittamiseen 
        MatchChooser.tsx - Komponentti ottelun valintaan tulosten ilmoittamista varten.
        ResultSubmission.tsx - Sivu tulosten ilmoittamiseksi.

src/client/components/scoresheet/ - Komponentteja tulosten ottelupöytäkirjan esittämiseen
        Scoresheet.tsx - Lomake ottelupöytäkirjan esittämiseen ja muokkaamiseen.
                Käyttäjä valitsee ensin molempien joukkueiden pelaajat TeamSelection
                komponenttia käyttäen ja siinä voi lisätä uusia pelaajia käyttäen
                AddPlayerDialog komponenttia. Erien tulokset näytetään taulukkomuodossa
                RoundResultsTable komponentilla ja niitä voi muokata GameDialog
                komponentilla. Näiden alla on pelien tulokset GameResultsTable
                komponentissa. 
        TeamSelection.tsx - Luo joukkueen valintaan liittyvät elementit: joukkueen nimi
                ja pelaajien valintaan käytettävät select-elementit.
        GameDialog.tsx - Tämä komponentti vastaa yhden pelin kirjaamisesta ottelun
                ilmoittamisen yhteydessä. Komponentti on dialog ikkuna, jossa erätulokset 
                voi kirjata nappeja painamalla.
        GameDialog.css - Tyylitiedosto GameDialog.tsx käyttöön.
        GameResultsTable.tsx - GameResultsTable on ottelun pelien lopputulokset sisältävä
                laatikko, jossa on pelaajien nimet ja pelien lopputulokset ja ottelun 
                tulos mikäli ottelu on syötetty kokonaan oikein.
        GameResultsTable.css - Tyylitiedosto GameResultsTable.tsx käyttöön.
        RoundResultsTable.tsx - RoundResultsTable on tuloslomakkeen komponentti, 
                joka sisältää erien tulokset taulukkona.
        RoundResultsTable.css - Tyylitiedosto RoundResultsTable.tsx käyttöön.
        AddPlayerDialog.tsx - AddPlayerDialog on dialog ikkuna, joka avataan Scoresheet 
                päälle pelaajan lisäämiseksi joukkueeseen.
        scoresheetTypes.ts - Tyyppejä ja triviaaleja apufunktioita Scoresheet liittyen.
```