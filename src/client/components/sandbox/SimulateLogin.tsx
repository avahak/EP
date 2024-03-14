/** 
 * Vain testausta varten, ei käytössä production versiossa.
 */

import { Fragment, useContext } from "react";
import { serverFetch, useInitialServerFetch } from "../../utils/apiUtils";
import { Box, Link, Paper, Typography } from "@mui/material";
import { AuthenticationContext } from "../../contexts/AuthenticationContext";
import { useNavigate } from "react-router-dom";

const TeamCard: React.FC<{ team: string, players: string[], onSelectPlayer: (team: string, player: string) => void }> = ({ team, players, onSelectPlayer }) => {
    return (
        <>
        <Paper sx={{minWidth: "150px", p: 1, m: 2}} elevation={5}>
            <Typography textAlign="center" variant="h5" sx={{p: 1}}>
                {team}
            </Typography>
            {players.map((player: string, index: number) => (
                <Box key={`player-${index}`}>
                    <Typography variant="body1">
                        <Link sx={{cursor: "pointer"}} onClick={() => onSelectPlayer(team, player)}>
                            {player}
                        </Link>
                    </Typography>
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
    const authenticationContext = useContext(AuthenticationContext);
    const navigate = useNavigate();

    const usersResult = useInitialServerFetch({ 
        route: "/api/db/specific_query", 
        method: "POST",
        params: { queryName: "get_users" },
        dataProcessor: createTeamMap
    });

    const handleSelectPlayer = (team: string, player: string) => {
        const fetchToken = async () => {
            try {
                const response = await serverFetch("/auth/create_token", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ team: team, name: player }),
                });
                if (!response.ok) 
                    throw new Error(`HTTP error! Status: ${response.status}`);
                const jsonData = await response.json();
                const token = jsonData.token;
                window.localStorage.setItem("jwtToken", token);
                authenticationContext.setFromToken(token);
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
                        players={usersResult.data.get(team)} 
                        onSelectPlayer={handleSelectPlayer}
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