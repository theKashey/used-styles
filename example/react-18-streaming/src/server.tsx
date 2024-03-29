import express from 'express';

import {
  discoverProjectStyles,
  createCriticalStyleStream,
  // createStyleStream,
  // createLink,
} from '../../../';

import { renderApp } from './entry-server';

const app = express();

// generate lookup table on server start
const stylesLookup = discoverProjectStyles(__dirname);

app.use('*', async (_req, res) => {
  await stylesLookup;

  try {
    // create a style steam
    // const styledStream = createStyleStream(stylesLookup, (style) => {
    //     // _return_ link tag, and it will be appended to the stream output
    //     return createLink(`${style}`) // <link href="dist/mystyle.css />
    // });

    // or create critical CSS stream - it will inline all styles
    // console.log(stylesLookup)

    const styledStream = createCriticalStyleStream(stylesLookup); // <style>.myClass {...

    await renderApp(res, styledStream);
  } catch (err) {
    res.sendStatus(500);
  }
});

console.log('listening on port 3000');
app.listen(3000);
