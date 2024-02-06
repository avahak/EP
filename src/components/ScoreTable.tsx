import "./ScoreTable.css";

const DiagonalSplitBox: React.FC<{ left: any; right: any }> = ({left, right}) => {
    const textLeft = left.toString();
    const textRight = right.toString();
    return (
        <div className="diagonal-box">
            <span className="left-text">{textLeft}</span>
            <span className="right-text">{textRight}</span>
            <span className="diagonal-line"></span>
        </div>
    );
}

const NameBox: React.FC<{ text: string; orientation: "horizontal" | "vertical" }> = ({text, orientation}) => {
    return (
        <div className={`underline-box ${orientation == "vertical" ? orientation : ""}`}>
            <div className="text-box">{ text }</div>
        </div>
    );
}

/**
 * Score box.
 */
const ScoreTable: React.FC<{ roundWins: number[][]; playersHome: string[]; playersAway: string[] }> = ({roundWins, playersHome, playersAway}) => {
    return (
        <div className="result-box">
            <>
            <div></div>
            {[0, 1, 2].map((col) => (
                <NameBox key={`name-box-top-${col}`} text={playersAway[col]} orientation="vertical"></NameBox>
            ))}

            {[0, 1, 2].map((row) => [
                <NameBox key={`name-box-${row}`} text={playersHome[row]} orientation="horizontal"></NameBox>,
                [0, 1, 2].map((col) => (
                    <DiagonalSplitBox key={`dg-box-${row}-${col}`} left={roundWins[(9-row*2+col*3) % 9][0]} right={roundWins[(9-row*2+col*3) % 9][1]} />
                )),
                ])}
            </>
        </div>);
}

export { DiagonalSplitBox, NameBox, ScoreTable };