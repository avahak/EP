/**
 * Testisivu pelaajien tulosten esittämiselle.
 * Tabs lähde: https://mui.com/material-ui/react-tabs/
 */

// import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// import { ResultTable } from "../tables/ResultTable";
import { crudeHash, deepCopy, extractKeys } from "../../../shared/generalUtils";
import { useInitialServerFetch } from "../../utils/apiUtils";
import { Box, Container, Tab, Tabs, Typography } from "@mui/material";
import { CaromWinsTable, CombinationWinsTable, DesignationWinsTable, GoldenBreakWinsTable, RunoutWinsTable, ThreeFoulWinsTable, TotalWinsTable } from "./PlayerTables";
import React, { useState } from "react";

type TabPanelProps = {
    children?: React.ReactNode;
    index: number;
    value: number;
}

/**
 * Yhdistää ep_pelaaja (rows1), kotivoitot ep_erat taulussa (rows2), 
 * ja vierasvoitot ep_erat taulussa (rows3).
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
    console.log("keys", keys);

    newResults.forEach((row: any, _index: number) => {
        for (const [key, _type] of keys) 
            if (!row[key])
                row[key] = 0;
    });

    // addRankColumns(newResults)

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
                aria-label="basic tabs example"
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
            <TotalWinsTable rows={results.data} tableName={"Pistepörssi"} />
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={1}>
            <Typography sx={{pb: 2}}>
                Pörssi aloitusyseistä. Onko kyseessä onni vai taito?
                <br />
                Lajittelun prioriteetti sijoituksille: 1. Yhteensä, 2. Vieras ysit, 3. Koti ysit.
            </Typography>
            <GoldenBreakWinsTable rows={results.data} />
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={2}>
            <Typography sx={{pb: 2}}>
                Aloituspartit, onko pöydällä väliä??
                <br />
                Lajittelun prioriteetti sijoituksille: 1. Yhteensä, 2. Vieras AP, 3. Koti AP.
            </Typography>
            <RunoutWinsTable rows={results.data} />
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={3}>
            <Typography sx={{pb: 2}}>
                Kyyti, tsäkää vai taitoa??
                <br />
                Lajittelun prioriteetti sijoituksille: 1. Yhteensä, 2. Vieras kyydit, 3. Koti kyydit.
            </Typography>
            <CombinationWinsTable rows={results.data} />
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={4}>
            <Typography sx={{pb: 2}}>
                Kiven hallintaa vai tuuria??
                <br />
                Lajittelun prioriteetti sijoituksille: 1. Yhteensä, 2. Vieras karat, 3. Koti karat.
            </Typography>
            <CaromWinsTable rows={results.data} />
        </CustomTabPanel>
        
        <CustomTabPanel value={activeTab} index={5}>
            <Typography sx={{pb: 2}}>
                Aina ei ole pakko hyökätä, vai??
                <br />
                Lajittelun prioriteetti sijoituksille: 1. Yhteensä, 2. Vierasvoitot, 3. Kotivoitot.
            </Typography>
            <ThreeFoulWinsTable rows={results.data} />
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={6}>
            <Typography sx={{pb: 2}}>
                Vain kotiottelut huomioituna.
                <br />
                Lajittelun prioriteetti sijoituksille: 1. Pelivoitot, 2. Peli V-H, 3. Erävoitot, 4. Erä V-H.
            </Typography>
            <DesignationWinsTable designation={"home"} rows={results.data} tableName={"Kotiotteluiden Pistepörssi"} />
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={7}>
            <Typography sx={{pb: 2}}>
                Vain vierasottelut huomioituna.
                <br />
                Lajittelun prioriteetti sijoituksille: 1. Pelivoitot, 2. Peli V-H, 3. Erävoitot, 4. Erä V-H.
            </Typography>
            <DesignationWinsTable designation={"away"} rows={results.data} tableName={"Vierasotteluiden Pistepörssi"} />
        </CustomTabPanel>
    </Box>
    );
}

const DisplayResultsPlayers: React.FC = () => {
    const resultsOld = useInitialServerFetch({ 
        route: "/db/specific_query", 
        method: "POST", 
        params: { queryName: "get_results_players_old" },
        dataProcessor: playerDataProcessor
    });

    const resultsNew = useInitialServerFetch({ 
        route: "/db/specific_query", 
        method: "POST", 
        params: { queryName: "get_results_players" },
        dataProcessor: playerDataProcessor
    });

    console.log("resultsOld", resultsOld);
    console.log("resultsNew", resultsNew);

    console.log("hash for old:", crudeHash(resultsOld));
    console.log("hash for new:", crudeHash(resultsNew));

    return (
        <>
        <Link to="/">Takaisin</Link>
        <Container maxWidth="md">

        {resultsOld.status.ok ?
        <PlayerResults results={resultsOld}/>
        : 
        "Ladataan.."
        }

        {resultsNew.status.ok ?
        <PlayerResults results={resultsNew}/>
        : 
        "Ladataan.."
        }

        </Container>
        </>
    );
}

export { DisplayResultsPlayers };