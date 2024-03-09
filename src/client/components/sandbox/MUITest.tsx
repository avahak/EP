import { createTheme } from '@mui/material/styles';

const MUITest: React.FC = () => {
    const theme = createTheme();
    console.log(theme);
    return (<>
        {JSON.stringify(theme)}
    </>);
};

export { MUITest };