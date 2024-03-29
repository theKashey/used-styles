// entry-server.js
import { Readable } from 'node:stream';
import { Transform } from 'stream';

import { Response } from 'express';
import MultiStream from 'multistream';
import React from 'react';
import { renderToPipeableStream } from 'react-dom/server';

import { App } from './App';

// small utility for "readable" streams
const readableString = (string: string) => {
  const s = new Readable();
  s.push(string);
  s.push(null);
  s._read = () => true;

  return s;
};

const ABORT_DELAY = 10000;

export const renderApp = async (res: Response, styledStream: Transform) => {
  let didError = false;

  const { pipe, abort } = renderToPipeableStream(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    {
      onShellError() {
        res.sendStatus(500);
      },
      // wait for all pieces to be ready
      onAllReady() {
        res.status(didError ? 500 : 200);
        res.set({ 'Content-Type': 'text/html' });

        // allow client to start loading js bundle
        res.write(`<!DOCTYPE html><html><head><script defer src="client.js"></script></head><body><div id="root">`);

        const endStream = readableString('</div></body></html>');

        // concatenate all streams together
        const streams = [
          styledStream, // the main content
          endStream, // closing tags
        ];

        new MultiStream(streams).pipe(res);

        // start by piping react and styled transform stream
        pipe(styledStream);
      },
      onError(error) {
        didError = true;
        console.error(error);
      },
    }
  );

  setTimeout(() => {
    abort();
  }, ABORT_DELAY);
};
