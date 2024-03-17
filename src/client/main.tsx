/**
 * Tämä liittää React sisällön html sivulle.
 */

// @ts-ignore
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './router/AppRouter.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
    // <React.StrictMode>
    // </React.StrictMode>
    <AppRouter />
);
    