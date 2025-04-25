/**
 * Tämä liittää React sisällön html sivulle.
 */

import ReactDOM from 'react-dom/client';
import { AppRouter } from './router/AppRouter.tsx';
// import React from 'react';

ReactDOM.createRoot(document.getElementById('root')!).render(
    // <React.StrictMode>
    <AppRouter />
    // </React.StrictMode>
);
    