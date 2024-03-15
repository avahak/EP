/** 
 * Vain testausta varten, ei käytössä production versiossa.
 */

import { Fragment, useContext } from "react";
import { serverFetch, useInitialServerFetch } from "../../utils/apiUtils";
import { Box, Link, Paper, Typography } from "@mui/material";
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
    for (const row of data.rows) {
        const team = row.Joukkue;
        const name = row.Nimi;
        if (!teamMap.get(team))
            teamMap.set(team, []);
        teamMap.get(team)?.push(name);
    }
    // Järjestetään joukkueen nimen mukaan:
    return new Map([...teamMap.entries()].sort());
};

const SimulateLogin: React.FC = () => {
    const authenticationState = useContext(AuthenticationContext);
    const navigate = useNavigate();

    const usersResult = useInitialServerFetch({ 
        route: "/api/db/specific_query", 
        method: "POST",
        params: { queryName: "get_users" },
        dataProcessor: createTeamMap,
        authenticationState: authenticationState,
    });

    const handleSelectUser = (team: string, user: string, role: string) => {
        const fetchToken = async () => {
            try {
                const response = await serverFetch("/auth/create_refresh_token", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ team: team, name: user, role: role }),
                }, authenticationState);
                if (!response.ok) 
                    throw new Error(`HTTP error! Status: ${response.status}`);
                const jsonData = await response.json();
                const token = jsonData.token;
                window.localStorage.setItem("refreshToken", token);
                authenticationState.setFromRefreshToken(token);
                console.log("fetchToken done, token:", token);
                navigate("/");
            } catch(error) {
                console.error('Error:', error);
            }
        };
        fetchToken();
    };

    console.log("users", usersResult);
    const teams: string[] = usersResult.status.ok ? Array.from(usersResult.data?.keys()) : [];

    return (
        <>
        <Typography variant="h3">
            Rekisteröityneet käyttäjät:
        </Typography>

        {usersResult.status.ok ?
        <Box display="flex" flexWrap="wrap">
            {teams?.map((team: string, index: number) => (
                <Fragment key={`team-${index}`}>
                    <TeamCard 
                        team={team} 
                        users={usersResult.data.get(team)} 
                        onSelectUser={handleSelectUser}
                    />
                </Fragment>
            ))}
        </Box>
        // usersResult.data.rows.map((user: any, index: number) => (
        //     <Fragment key={`row-${index}`}>
        //         <Typography variant="body1">
        //             {user.Nimi}, {user.Joukkue}
        //         </Typography>
        //     </Fragment>
        // ))
        :
        "Ladataan..."}
        </>
    );
};

export { SimulateLogin };