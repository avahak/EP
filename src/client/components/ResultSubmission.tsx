// Idea: tämä on isäntäelementti Scoresheet ja MatchChooser 
// ja ne kommunikoivat tämän kanssa (props, callbacks)

// import { Scoresheet } from "./Scoresheet";
import { MatchChooser } from "./MatchChooser";

const ResultSubmission: React.FC = () => {
    return (
        <MatchChooser userTeam={"FX1"} />
    );
}

export { ResultSubmission };