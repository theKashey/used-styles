used-style
====

[![Greenkeeper badge](https://badges.greenkeeper.io/theKashey/used-styles.svg)](https://greenkeeper.io/)

Get all the styled you have used to render a page.

> Bundler independent CSS part of SSR-friendly code splitting

## Code splitting
This is all about code splitting, Server Side Rendering and React, even is React has nothing with this library.

Code splitting is a good feature, and SSR is also awesome, but then you have
to load all the use `scripts` on the client, before making a page alive.

That's done, in a different ways. That's not a big task, as long as the _usage_ of code splitted block
is _trackable_. CSS is harder - you might just use random classes and what next?

> While it's possible for webpack to add a `Link` to document header once some `Component` uses some `Style`,
you can't do the same in the __concurrent__ server environment - there is no <head/> to add a Link.

## Solution
1. Scan all `.css` files, extracting all the style names.
2. Scan resulting `html`, finding all the `classNames` used
3. Calculate all the files you shall send to a client.

# API
1. `getProjectStyles(buildDirrectory)` - generates class lookup table
2. `getUsedStyles(html): string[]` - returns all used files
3. `createStyleStream(lookupTable, callback(fileName):void): TransformStream` - creates Transform stream.

# Example
## Static rendering
There is nothing interesting here - just render, just `getUsedStyles`.
```js
import {getProjectStyles, getUsedStyles} from 'used-styles';

// generate lookup table on server start
const lookup = getProjectStyles('./build');

// render App
const markup = ReactDOM.renderToString(<App />)
const usedStyles = getUsedStyles(markup, lookup);

usedStyles.forEach(style => {
  const link = `<link href="build/${style}" rel="stylesheet">\n`;
  // append this link to the header output
});
```
### Stream rendering
Stream rendering is much harder. The idea is to make it efficient, and not delay Time-To-First-Byte. And the second byte.

Idea is to:
- push `initial line` to the browser, with `the-main-script` inside
- push all used `styles`
- push some `html` between `styles` and `content`
- push `content`
- push `closing` tags

That's all are streams, concatenated in a right order.
It's possible to interleave them, but that's is not expected buy a `hydrate`. 
```js
import {getProjectStyles, createStyleStream} from 'used-styles';
import MultiStream from 'multistream';

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
const styledStream = createStyleStream(projectStyles, (style) => {
    // emit a line to header Stream
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
