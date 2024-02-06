import React from 'react';
import ReactDOM from 'react-dom/client';
// import Homography from './components/HomographyDemo.tsx';
// import { Scoresheet } from './components/Scoresheet.tsx';
import { Menu } from './components/Menu.tsx';
// import Hough from './components/HoughDemo.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Menu></Menu>
        <br></br>
        {/* <Scoresheet /> */}
        {/* <Hough /> */}
    </React.StrictMode>,
);
    