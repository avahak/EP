import { Card, CardContent, Typography } from "@mui/material";
import { LiveMatchEntry } from "../../../shared/commonTypes";

type LiveMatchCardProps = { 
    entry: LiveMatchEntry;
    onSelect: (matchId: number) => void;
    selected: boolean;
};

const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // Use 24-hour format
});

const LiveMatchCard: React.FC<LiveMatchCardProps> = (({ entry, onSelect, selected }) => {
    const startTime = timeFormatter.format(new Date(entry.submitStartTime));
    return (
        <Card 
            onClick={() => onSelect(entry.matchId)} 
            style={{ 
                cursor: 'pointer',
                background: selected ? '#aaf' : 'inherit',
                // minWidth: "200px",
            }} 
            elevation={10}
        >
            <CardContent>
                <Typography textAlign="center" variant="h5">{`${entry.home} - ${entry.away}`}</Typography>
                <Typography textAlign="center" variant="h5">{`${entry.score[0]} - ${entry.score[1]}`}</Typography>
                <hr />
                <Typography variant="body2">{`Kirjaus aloitettu kello ${startTime}`}</Typography>
            </CardContent>
        </Card>
      );
});

export { LiveMatchCard };