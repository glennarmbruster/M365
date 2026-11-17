import {createRoot} from 'react-dom/client';
import Hub from './app/page';
import './app/globals.css';
createRoot(document.getElementById('root')!).render(<Hub browserOnly/>);
