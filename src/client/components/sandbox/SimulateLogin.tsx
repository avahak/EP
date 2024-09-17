/** 
 * Simuloi käyttäjän kirjautumista esittämällä käyttäjät linkkeinä ja kun
 * linkkiä painetaan, kirjautuu sisään käyttäjänä.
 * HUOM! Vain testausta varten, ei käytössä production versiossa.
 */

import { Fragment, useContext, useEffect, useState } from "react";
import { serverFetch } from "../../utils/apiUtils";
import { Box, Button, Link, Paper, Typography } from "@mui/material";
import { AuthenticationContext } from "../../contexts/AuthenticationContext";
import { useNavigate } from "react-router-dom";
import { crudeHash } from "../../../shared/generalUtils";

/**
 * Liittää kuhunkin käyttäjän satunnaisen roolin.
 */
function assignRandomRole(name: string, team: string) {
    const randomNumber = parseInt(crudeHash(name + team));
    if (randomNumber % 10 == 0)
        return "admin";
    if (randomNumber % 5 == 1)
        return "mod";
    return "-";
}

/**
 * Esittää joukkueeseen liittyvät käyttäjät yhtenä korttina.
 */
const TeamCard: React.FC<{ team: string, users: string[], onSelectUser: (team: string, user: string, role: string) => void }> = ({ team, users, onSelectUser }) => {
    return (
        <>
        <Paper sx={{minWidth: "150px", p: 1, m: 2}} elevation={5}>
            <Typography textAlign="center" variant="h5" sx={{p: 1}}>
                {team}
            </Typography>
            {users.map((user: string, index: number) => (
                <Box key={`user-${index}`} display="flex">
                    <Typography variant="body1">
                        <Link sx={{cursor: "pointer"}} onClick={() => onSelectUser(team, user, assignRandomRole(user, team))}>
                            {user}
                        </Link>
                    </Typography>
                    { assignRandomRole(user, team) === "admin" && 
                        <Typography variant="body1" color="red"> 
                            &nbsp;(Admin)
                        </Typography>
                    }
                    { assignRandomRole(user, team) === "mod" && 
                        <Typography variant="body1" color="red"> 
                            &nbsp;(Mod)
                        </Typography>
                    }
                </Box>
            ))}
        </Paper>
        </>
    );
};

/** 
 * Ryhmittää käyttäjät joukkueen nimen mukaan.
 */
const createTeamMap = (data: any) => {
    const teamMap: Map<string, string[]> = new Map();
    for (const row of data) {
        const team = row.Joukkue;
        const name = row.Nimi;
        if (!teamMap.get(team))
            teamMap.set(team, []);
        teamMap.get(team)?.push(name);
    }
    // Järjestetään joukkueen nimen mukaan:
    return new Map([...teamMap.entries()].sort());
};


/**
 * Simuloi käyttäjän kirjautumista esittämällä käyttäjät linkkeinä ja kun
 * linkkiä painetaan, kirjautuu sisään käyttäjänä.
 */
const SimulateLogin: React.FC = () => {
    const authenticationState = useContext(AuthenticationContext);
    const [usersResult, setUsersResult] = useState<Map<string, string[]>|null>(null);  // Lista käyttäjistä
    const navigate = useNavigate();

    const fetchUsers = async () => {
        try {
            const response = await serverFetch("/api/db/specific_query", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ queryName: "get_users" }),
            }, authenticationState);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            const jsonData = await response.json();
            const teamMap = createTeamMap(jsonData.rows);
            console.log("fetchUsers: ", teamMap);
            setUsersResult(teamMap);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    /**
     * Kutsutaan kun käyttäjä valitaan. Simuloi sisäänkirjautumista tai rekisteröitymistä.
     * Pyytää palvelinta muodostamaan refresh tokenin, jota sitten käytetään 
     * käyttäjän autentikointiin.
     */
    const handleSelectUser = (team: string, user: string, role: string) => {
        const fetchToken = async () => {
            try {
                const response = await serverFetch("/auth/create_refresh_token", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ team: team, name: user, role: role }),
                }, null);
                if (!response.ok) 
                    throw new Error(`HTTP error! Status: ${response.status}`);
                const jsonData = await response.json();
                const token = jsonData.token;
                authenticationState.setFromRefreshToken(token);
                console.log("fetchToken done, token:", token);
                navigate("/");
            } catch(error) {
                console.error('Error:', error);
            }
        };
        fetchToken();
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    console.log("users", usersResult);
    const teams: string[] = usersResult ? Array.from(usersResult.keys()) : [];

    return (
        <>
        <Typography variant="h3">
            Rekisteröityneet käyttäjät:
        </Typography>

        {usersResult ?
        <>
        <Box display="flex" flexWrap="wrap">
            {teams?.map((team: string, index: number) => (
                <Fragment key={`team-${index}`}>
                    <TeamCard 
                        team={team} 
                        users={usersResult.get(team) as string[]} 
                        onSelectUser={handleSelectUser}
                    />
                </Fragment>
            ))}
        </Box>
        <Button onClick={() => { authenticationState.setFromRefreshToken(null); }}>
            Logout
        </Button>
        </>
        :
        "Ladataan..."}
        </>
    );
};

export { SimulateLogin };