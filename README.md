Express.js, React, ja MySQL koodia biljardiliigan verkkosivuille.  
  
---  
```
Tiedostojen ja hakemistojen kuvaukset:  
  
index.html - Reactin sovelluksen lataava html tiedosto
  
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
        /auth/ - Palvelimen autentikointikoodi
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
                funktioita ottelupöytäkirjan tarkistamiseen, pisteiden laskuun, ja funktioita API-kutsuille pelaajien ja tulosten hakemiseen.

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
        
src/client/components/live_matches/ - Komponentteja live otteluiden esittämiseen
        LiveMatchCard.tsx - Kortti esittämään yhtä live ottelua. Siinä on joukkueet,
                tulos, ja kirjauksen aloitusaika.
        LiveMatches.tsx - Live otteluiden esityssivu. Näyttää kutakin ottelua kohden
                kortin sen tiedoista. Kun korttia painetaan, näkyy ottelun pöytäkirja.
                Pöytäkirja päivitty automaattisesti käyttäen SSE:tä.

src/client/components/machine_vision/ - Komponentteja konenäköön liittyen
        DrawHomography.tsx - Komponentti, joka piirtää homografia-esimerkin.
        HomographyDemo.tsx - Sivu homografian esittelemiseen. Palvelin laskee 
                homografian kahden kuvan välille ja esittää sen graafisesti.
        HoughDemo.tsx - Sivu Hough-muunnoksen esittämiseksi.
        VisionExample.tsx - Esimerkki Google Vision API vastauksesta. 

src/client/components/sandbox/ - Sekalaisia vain testauksessa käytettäviä komponentteja
        DisplayScoresheet.tsx - Esittää yhden ottelun pöytäkirjan (ep_ottelu id=1).
        SimulateLogin.tsx - Simuloi käyttäjän kirjautumista esittämällä käyttäjät 
                linkkeinä ja kun linkkiä painetaan, kirjautuu sisään käyttäjänä.

src/client/components/tables/ - Yleiseen käyttöön sopivia html taulukoiden määritelmiä
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
                komponenttia käyttäen ja siinä voi lisätä uusia pelaajia käyttäen AddPlayerDialog komponenttia. Erien tulokset näytetään taulukkomuodossa RoundResultsTable komponentilla ja niitä voi muokata GameDialog komponentilla. Näiden alla on pelien tulokset GameResultsTable komponentissa. 
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
        AddPlayerDialog.tsx - AddPlayerDialog on dialog ikkuna, joka avataan 'Scoresheet 
                päälle pelaajan lisäämiseksi joukkueeseen.
        scoresheetTypes.ts - Tyyppejä ja triviaaleja apufunktioita Scoresheet liittyen.