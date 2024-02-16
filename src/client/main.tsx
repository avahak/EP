/**
 * Tämä liittää Reactin sivulle.
 */

// @ts-ignore
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './router/AppRouter.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
    // <React.StrictMode>
    <AppRouter />
    // </React.StrictMode>,
);
    