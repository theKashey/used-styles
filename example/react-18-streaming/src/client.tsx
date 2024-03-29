import React from 'react';
import ReactDOM from 'react-dom/client';

import { moveStyles } from '../../../moveStyles';

import { App } from './App';

// Call before `ReactDOM.hydrateRoot`
moveStyles();

ReactDOM.hydrateRoot(
  document.getElementById('root'),
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
