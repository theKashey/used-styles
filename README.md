<div align="center">
  <h1>used-style</h1>
  <br/>
  Get all the styled you have used to render a page. 
  <br/>
  <br/>
  
  [![Build Status](https://travis-ci.org/theKashey/used-styles.svg?branch=master)](https://travis-ci.org/theKashey/used-styles)
  [![NPM version](https://img.shields.io/npm/v/used-styles.svg)](https://www.npmjs.com/package/used-styles)

</div>


> Bundler independent CSS part of SSR-friendly code splitting

Detects used `css` files, and/or inlines critical styles. 

## Code splitting
This is all about code splitting, Server Side Rendering and React, even is React has nothing with this library.

Code splitting is a good feature, and SSR is also awesome, but then you have
to load all the use `scripts` on the client, before making a page alive.

That's done, in a different ways. That's not a big task, as long as the _usage_ of code splitted block
is _trackable_ - you are using it. 

CSS is harder - you might just use random classes and what next? You are just importing CSS here and where,
sometimes indirectly, and there is no way to understand whats happening.

> While it's possible for webpack to add a `Link` to document header once some `Component` uses some `Style`,
you can't do the same in the __concurrent__ server environment - there is no <head/> to add a Link.

Code splitting libraries solved it straight forward - by building resource graph, and fetching all
bound resources to that graph, but tracking is hard, and quite bound to the bundler, and could delay content sending.

## Solution
1. Scan all `.css` files, extracting all the style names.
2. Scan resulting `html`, finding all the `classNames` used
3. Calculate all the files you shall send to a client.

Bonus: Do the same for streams.

Bonus: Do it only for `used styled`, not just imported somewhere. 

# API
## Discovery API
Use to scan your `dist` folder to create a look up table between classNames and files they are described in.

1. `getProjectStyles(buildDirrectory)` - generates class lookup table

## Scanners
Use to get used styled from render result or a stream

2. `getUsedStyles(html): string[]` - returns all used files
3. `createStyleStream(lookupTable, callback(fileName):void): TransformStream` - creates Transform stream.

### React
There is absolutely the same scanners, but for `React`. Basically it's a simpler version of original scanner,
which rely on the "correct" HTML emitted from React, and just __twice faster__.

# Example
## Static rendering
There is nothing interesting here - just render, just `getUsedStyles`.
```js
import {getProjectStyles, getUsedStyles} from 'used-styles';
// or
import {getProjectStyles} from 'used-styles';
import {getUsedStyles} from 'used-styles/react';

// generate lookup table on server start
const stylesLookup = getProjectStyles('./build');

async function MyRender () {
  const lookup = await stylesLookup;// it was a promise
  // render App
  const markup = ReactDOM.renderToString(<App />)
  const usedStyles = getUsedStyles(markup, lookup);

usedStyles.forEach(style => {
  const link = `<link href="build/${style}" rel="stylesheet">\n`;
  // append this link to the header output or to the body
});

// or 

const criticalCSS = getCriticalStyles(markup, lookup);
// append this link to the header output
```
### Stream rendering
Stream rendering is much harder, and much more efficient.
The idea is to make it efficient, and not delay Time-To-First-Byte. And the second byte.

Stream rendering could be interleaved(more efficient) or block(more predictable).

### Interleaved Stream rendering
In case or React rendering you may use __interleaved streaming__, which would not delay TimeToFirstByte.
It's quite similar how StyledComponents works
```js
import {getProjectStyles, createLink} from 'used-styles';
import {createStyleStream} from 'used-styles/react';
import MultiStream from 'multistream';

// generate lookup table on server start
const stylesLookup = getProjectStyles('./build'); // __dirname usually

// small utility for "readable" streams
const readable = () => {
  const s = new Readable();
  s._read = () => true;
  return s;
};

async function MyRender() {
  // render App
  const htmlStream = ReactDOM.renderToNodeStream(<App />)

  const lookup = await stylesLookup;
  // create a style steam
  const styledStream = createStyleStream(lookup, (style) => {
  // _return_ link tag, and it will be appended to the stream output
      return createLink(`dist/${style}`)
});

// or create critical CSS stream - it will inline all styles
const styledStream = createCriticalStyleStream(projectStyles);

  // allow client to start loading js bundle
  res.write(`<!DOCTYPE html><html><head><script defer src="client.js"></script>`);

  const middleStream = readableString('</head><body><div id="root">');
  const endStream = readableString('</head><body>');
  
  // concatenate all steams together
  const streams = [
      middleStream, // end of a header, and start of a body
    styledStream, // the main content
    endStream,    // closing tags
];

MultiStream(streams).pipe(res);

// start by piping react and styled transform stream
htmlStream.pipe(styledStream);
```

__!! THIS IS NOT THE END !!__ Interleaving links and react output would produce break client side rehydration,
as long as _injected_ links are not rendered by React, and not expected to present in the "result" HTML code.

You have to move injected styles prior rehydration.
```js
  import { moveStyles } from 'used-styles/moveStyles';
  moveStyles();
```
You might want to remove styles after rehydration to prevent duplication.
```js
  import { removeStyles } from 'used-styles/moveStyles';
  removeStyles(); 
```

## Block rendering
> Not sure this is a good idea

Idea is to:
- push `initial line` to the browser, with `the-main-script` inside
- push all used `styles`
- push some `html` between `styles` and `content`
- push `content`
- push `closing` tags

That's all are streams, concatenated in a right order.
It's possible to interleave them, but that's is not expected buy a `hydrate`. 
```js
import {getProjectStyles, createStyleStream, createLink} from 'used-styles';
import MultiStream from 'multistream';

// .....
// generate lookup table on server start
const lookup = await getProjectStyles('./build'); // __dirname usually

// small utility for "readable" streams
const readable = () => {
  const s = new Readable();
  s._read = () => true;
  return s;
};

// render App
const htmlStream = ReactDOM.renderToNodeStream(<App />)

// create a style steam
const styledStream = createStyleStream(lookup, (style) => {
    // emit a line to header Stream
    headerStream.push(createLink(`dist/${style}`));
    // or
    headerStream.push(`<link href="dist/${style}" rel="stylesheet">\n`);
});

// allow client to start loading js bundle
res.write(`<!DOCTYPE html><html><head><script defer src="client.js"></script>`);

const middleStream = readableString('</head><body><div id="root">');
const endStream = readableString('</head><body>');

// concatenate all steams together
const streams = [
    headerStream, // styles
    middleStream, // end of a header, and start of a body
    styledStream, // the main content
    endStream,    // closing tags
];

MultiStream(streams).pipe(res);

// start by piping react and styled transform stream
htmlStream.pipe(styledStream, {end: false});
htmlStream.on('end', () => {
    // kill header stream on the main stream end
    headerStream.push(null);
    styledStream.end();
});
```
> This example is taken from [Parcel-SSR-example](https://github.com/theKashey/react-imported-component/tree/master/examples/SSR/parcel-react-ssr)
from __react-imported-component__.

# Performance
Almost unmeasurable. It's a simple and single RegExp, which is not comparable to the React Render itself.

# License
MIT 
