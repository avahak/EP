import { Card, CardContent, Divider, Typography } from "@mui/material";
import { LiveMatchEntry } from "../../../shared/commonTypes";

type LiveMatchCardProps = { 
    entry: LiveMatchEntry;
    onSelect: (matchId: number) => void;
    selected: boolean;
};

// Ajan muotoilu tekstiksi:
const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, 
});

/**
 * Kortti esittämään yhtä live-ottelua. Siinä on joukkueet, tulos, ja 
 * kirjauksen aloitusaika.
 */
const LiveMatchCard: React.FC<LiveMatchCardProps> = (({ entry, onSelect, selected }) => {
    const startTime = timeFormatter.format(new Date(entry.submitStartTime));
    return (
        <Card 
            onClick={() => onSelect(entry.matchId)} 
            style={{ 
                cursor: 'pointer',
                background: selected ? '#aaf' : 'inherit',
            }} 
            elevation={10}
        >
            <CardContent>
                <Typography textAlign="center" fontWeight="bold" variant="h6">{`${entry.home} - ${entry.away}`}</Typography>
                <Typography textAlign="center" fontWeight="bold" variant="h6">{`${entry.score[0]} - ${entry.score[1]}`}</Typography>
                <Divider sx={{m: 1}} />
                <Typography 
                    sx={{ whiteSpace: "wrap" }} 
                    variant="body2"
                >
                    {`Kirjaus aloitettu kello ${startTime}`}
                </Typography>
            </CardContent>
        </Card>
      );
});

export { LiveMatchCard };