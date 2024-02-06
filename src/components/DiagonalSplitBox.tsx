import "./DiagonalSplitBox.css";

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

export { DiagonalSplitBox };