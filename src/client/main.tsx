/**
 * Tämä liittää React sisällön html sivulle.
 */

import ReactDOM from 'react-dom/client';
import { AppRouter } from './router/AppRouter.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
    // <React.StrictMode>
    // </React.StrictMode>
    <AppRouter />
);
    