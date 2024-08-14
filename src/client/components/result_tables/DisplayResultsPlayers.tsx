/**
 * Sivu pelaajien tulosten esittämiselle.
 * TODO Masters pörssi puuttuu, onko kaikki tarvittava info tietokannassa?
 * Material UI Tabs pohjana käytetty: https://mui.com/material-ui/react-tabs/
 */

import { deepCopy, extractKeys, findStringDifference } from "../../../shared/generalUtils";
import { serverFetch } from "../../utils/apiUtils";
import { Box, Container, FormControl, InputLabel, MenuItem, Select, Tab, Tabs, Typography } from "@mui/material";
import { CaromWinsTable, CombinationWinsTable, DesignationWinsTable, GoldenBreakWinsTable, RunoutWinsTable, ThreeFoulWinsTable, TotalWinsTable } from "./PlayerTables";
import React, { useEffect, useState } from "react";

type TabPanelProps = {
    children?: React.ReactNode;
    index: number;
    value: number;
}

/**
 * Yhdistää ep_pelaaja (rows1), kotivoitot ep_erat taulussa (rows2), 
 * ja vierasvoitot ep_erat taulussa (rows3). Yhdistetyssä taulussa on kaikki
 * tarvittava pelaajadata, joten muuta lataamista ei tarvitse tehdä.
 */
const playerDataProcessor = (data: any) => {
    const [rows1, rows2, rows3] = data.rows;
    const newResults = deepCopy(rows1); 
    const map: Map<number, any> = new Map();
    rows1.forEach((row: any, index: number) => { 
        map.set(row.id, index);
    });
    rows2.forEach((row: any, _index: number) => { 
        newResults[map.get(row.id)] = {...newResults[map.get(row.id)], ...row};
    });
    rows3.forEach((row: any, _index: number) => { 
        newResults[map.get(row.id)] = {...newResults[map.get(row.id)], ...row};
    });
    const keys = extractKeys(newResults);
    
    newResults.forEach((row: any, _index: number) => {
        for (const [key, _type] of keys) 
            if (!row[key])
                row[key] = 0;
    });

    console.log("keys", keys);
    console.log("newResults", newResults);
        
    return newResults;
};

/**
 * Apufunktio Tabs saavutettavuutta varten.
 */
function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
};

/**
 * Säiliö TabPanel varten.
 */
function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
  
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
            <Box sx={{ p: 3 }}>
                {children}
            </Box>
            )}
        </div>
    );
}

const PlayerResults: React.FC<{ results: any }> = ({ results }) => {
    const [activeTab, setActiveTab] = useState<number>(0);

    /**
     * Kutsutaan kun tab vaihtuu.
     */
    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Box>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                aria-label="Pelaajien pörssit"
                sx={{
                    '& .MuiTabs-flexContainer': {
                        flexWrap: 'wrap',
                    },
                }}
            >
                <Tab label="Kaikki" {...a11yProps(0)} />
                <Tab label="Ysi" {...a11yProps(1)} />
                <Tab label="Partti" {...a11yProps(2)} />
                <Tab label="Kyyti" {...a11yProps(3)} />
                <Tab label="Kara" {...a11yProps(4)} />
                <Tab label="Piilopallo" {...a11yProps(5)} />
                <Tab label="Koti" {...a11yProps(6)} />
                <Tab label="Vieras" {...a11yProps(7)} />
            </Tabs>
        </Box>
        
        <CustomTabPanel value={activeTab} index={0}>
            <Typography sx={{pb: 2}}>
                Mukana kaikki alkusarjassa pelatut ottelut.
                <br />
                Lajittelun prioriteetti sijoituksille: 1. Pelivoitot, 2. Peli V-H, 3. Erävoitot, 4. Erä V-H.
            </Typography>
            <TotalWinsTable rows={results} tableName={"Pistepörssi"} />
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={1}>
            <Typography sx={{pb: 2}}>
                Pörssi aloitusyseistä. Onko kyseessä onni vai taito?
                <br />
                Lajittelun prioriteetti sijoituksille: 1. Yhteensä, 2. Vieras ysit.
            </Typography>
            <GoldenBreakWinsTable rows={results} />
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={2}>
            <Typography sx={{pb: 2}}>
                Aloituspartit, onko pöydällä väliä??
                <br />
                Lajittelun prioriteetti sijoituksille: 1. Yhteensä, 2. Vieras AP.
            </Typography>
            <RunoutWinsTable rows={results} />
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={3}>
            <Typography sx={{pb: 2}}>
                Kyyti, tsäkää vai taitoa??
                <br />
                Lajittelun prioriteetti sijoituksille: 1. Yhteensä, 2. Vieras kyydit.
            </Typography>
            <CombinationWinsTable rows={results} />
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={4}>
            <Typography sx={{pb: 2}}>
                Kiven hallintaa vai tuuria??
                <br />
                Lajittelun prioriteetti sijoituksille: 1. Yhteensä, 2. Vieras karat.
            </Typography>
            <CaromWinsTable rows={results} />
        </CustomTabPanel>
        
        <CustomTabPanel value={activeTab} index={5}>
            <Typography sx={{pb: 2}}>
                Aina ei ole pakko hyökätä, vai??
                <br />
                Lajittelun prioriteetti sijoituksille: 1. Yhteensä, 2. Vierasvoitot.
            </Typography>
            <ThreeFoulWinsTable rows={results} />
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={6}>
            <Typography sx={{pb: 2}}>
                Vain kotiottelut huomioituna.
                <br />
                Lajittelun prioriteetti sijoituksille: 1. Pelivoitot, 2. Peli V-H, 3. Erävoitot, 4. Erä V-H.
            </Typography>
            <DesignationWinsTable designation={"home"} rows={results} tableName={"Kotiotteluiden Pistepörssi"} />
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={7}>
            <Typography sx={{pb: 2}}>
                Vain vierasottelut huomioituna.
                <br />
                Lajittelun prioriteetti sijoituksille: 1. Pelivoitot, 2. Peli V-H, 3. Erävoitot, 4. Erä V-H.
            </Typography>
            <DesignationWinsTable designation={"away"} rows={results} tableName={"Vierasotteluiden Pistepörssi"} />
        </CustomTabPanel>
    </Box>
    );
}

/**
 * Testisivu pelaajien tulosten esittämiselle.
 */
const DisplayResultsPlayers: React.FC = () => {
    const [kausi, setKausi] = useState<any>("");
    const [kaudet, setKaudet] = useState<any>(null);
    const [resultsOld, setResultsOld] = useState<any>("");
    const [resultsNew, setResultsNew] = useState<any>("");

    /**
     * Hakee tietokannasta sarjatilanteen varsinaisten taulujen perusteella.
     */
    const fetchResultsOld = async () => {
        try {
            const response = await serverFetch("/api/db/specific_query", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ queryName: "get_results_players_old", ...(kausi && { params: { kausi: kausi } }) }),
            }, null);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            const jsonData = await response.json();
            setResultsOld(playerDataProcessor(jsonData));
        } catch(error) {
            console.error('Error:', error);
        }
    };

    /**
     * Hakee tietokannasta sarjatilanteen _tulokset taulujen perusteella.
     */
    const fetchResultsNew = async () => {
        try {
            const response = await serverFetch("/api/db/specific_query", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ queryName: "get_results_players", ...(kausi && { params: { kausi: kausi } }) }),
            }, null);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            const jsonData = await response.json();
            console.log("jsonData", jsonData);
            setResultsNew(playerDataProcessor(jsonData));
        } catch(error) {
            console.error('Error:', error);
        }
    };

    /**
     * Hakee kaudet.
     */
    const fetchSeasons = async () => {
        try {
            const response = await serverFetch("/api/db/specific_query", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ queryName: "get_seasons" }),
            }, null);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            const jsonData = await response.json();
            setKaudet(jsonData.rows.data);
            setKausi(jsonData.rows.current_kausi);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    // Haetaan kaudet:
    useEffect(() => {
        fetchSeasons();
    }, []);

    // Haetaan data uudestaan jos kausi muuttuu:
    useEffect(() => {
        fetchResultsOld();
        fetchResultsNew();
    }, [kausi]);

    console.log("kausi", kausi);
    console.log("kaudet", kaudet);
    console.log("resultsOld", resultsOld);
    console.log("resultsNew", resultsNew);

    const str1 = JSON.stringify(resultsOld);
    const str2 = JSON.stringify(resultsNew);
    const index = findStringDifference(str1, str2);

    if (resultsOld && resultsNew) {
        if (index === -1) {
            console.log("Pelaajapörssit ovat samat varsinaisissa tauluissa ja _tulokset tauluissa.")
        } else {
            console.log("Tulokset eroavat ainakin seuraavassa kohdassa:", str1.slice(0, index), " --> ", str1.slice(index, index+1), " <-- ", str1.slice(index+1, str1.length));
        }
    }

    return (
        <>
        {/* <Link to="/">Takaisin</Link> */}
        <Container maxWidth="md">

        {kaudet && 
        <>
        <FormControl sx={{mt: 2, mb: 5}}>
        <InputLabel>Kausi</InputLabel>
            <Select
                value={kausi}
                label="Kausi"
                onChange={(event) => setKausi(event.target.value)}
            >
                {kaudet.map((season: any, index: number) => (
                    <MenuItem key={index} value={season.id}>{`${season.kausi} (${season.Laji})`}</MenuItem>
                ))}
            </Select>
        </FormControl>
        </>
        }

        <Box sx={{my: 2}}>
        {index === -1 ?
        <Typography sx={{color: 'green'}}>
            Tulokset molemmissa tauluissa ovat samat.
        </Typography>
        :
        <Typography sx={{color: 'red', fontSize: '1.5rem'}}>
            Ongelma: Tulokset eroavat toisistaan! Katso konsoli.
        </Typography>
        }
        </Box>

        {resultsOld ?
        <PlayerResults results={resultsOld}/>
        : 
        "Ladataan pelaajapörssiä.."
        }

        {resultsNew ?
        <PlayerResults results={resultsNew}/>
        : 
        "Ladataan pelaajapörssiä.."
        }

        </Container>
        </>
    );
}

export { DisplayResultsPlayers };