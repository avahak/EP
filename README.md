Express.js ja React koodia biljardiliigan verkkosivuille.  
  
---  
```
Tiedostojen ja hakemistojen tarkoitukset:  
  
index.html - Reactin lataava html  
  
src/ - Lähdekoodin hakemisto  
        main.tsx - Reactin juurena oleva tiedosto, lisää 
                src/client/router/AppRouter.tsx dokumenttiin  

src/server/ - Palvelinpuolen koodin hakemisto  
        server.ts - Express serverin koodi, toteuttaa api-rajapinnan Reactille   
                ja välittää tiedostoja   
        imageTools.ts - Kuvankäsittelyyn liittyviä apufunktioita  
        hough.ts - Hough-muunnoksen koodi  
        homography.ts - Koodi kahden kuvan yhteisten piirteiden löytämiseen ja  
                vastaavan homografian löytämiseen  
        test.ts - ei käytössä  

src/shared/ - Yhteinen kansio Express.js ja Reactille
        dbTypes.ts - Typescript tyypit tietokannan tauluille
        dbFaker.ts - Testitietokannan luonti ja testidatan generointi
        types/ - TypeScript-tyyppien käytössä tarvittavia moduulilaajennuksia.  
                Nämä voi jättää huomioimatta ja tarvitaan vain teknisistä syistä.  
  
src/client/router/ - Hakemisto React App reittien määrittelyyn   
        AppRouter.tsx - Määrittelee kaikki Reactin käytössä olevat reitit  
  
src/client/components/ - Hakemisto React komponenttien koodille  
        App.tsx - Määrittelee näkymän reitille '/'.   
                Tämä on käytännössä verkkosivun etusivu.  
        AddPlayerModal.tsx - Uuden pelaajan lisäys ikkuna (modaali), 
                käytetään komponentissa ScoreSheet.tsx  
        DrawHomography.tsx - Homografian piirtämiseen käytettävä komponentti  
        HomographyDemo.tsx - Yksinkertainen sivu homografian esittelemiseen  
        DrawHough.tsx - ei käytössä  
        HoughDemo.tsx - Sivu Hough-muunnoksen esittelemiseen esimerkkien avulla  
        FileUpload.tsx - Yksinkertainen työkalu tiedostojen lataamiseen serverille    
        Frontpage.tsx - ei käytössä  
        ScoreTable.tsx - Piirtää tulostaulukon (taulu jokaisen peli lopputuloksesta)  
        ScoreTable.css - tyylitiedosto ScoreTable.tsx käyttöön  
        Scoresheet.tsx - Lomake ottelun tulosten syöttämiseen  
        Scoresheet.css - tyylitiedosto Scoresheet.tsx käyttöön  
        ThumbnailSelector.tsx - Yksinkertainen valintalaatikko 
                esikatselukuvien esittämiseen  
        VisionExample.tsx - Esimerkki Google Vision API tuloksesta  
        DBTest.tsx - Testaa shared/dbFaker.ts
  
src/client/utils/ - Hakemisto React App apufunktioille eri komponenttien käyttöön  
        apiUtils.ts - Apufunktio api rajapinnan osoitteelle  
``` 