import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './ui/App';
import { TestApp } from './ui/TestApp';
import './ui/styles.css';

function Root() {
  const isTest = window.location.hash === '#/test';
  return isTest ? <TestApp /> : <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
