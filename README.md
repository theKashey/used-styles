<div align="center">
  <h1>used-styles</h1>
  <br/>
  Get all the styles, you have used to render a page.<br/>
  (without any puppeteer involved)
  <br/>
  <br/>

[![Build Status](https://travis-ci.org/theKashey/used-styles.svg?branch=master)](https://travis-ci.org/theKashey/used-styles)
[![NPM version](https://img.shields.io/npm/v/used-styles.svg)](https://www.npmjs.com/package/used-styles)

</div>

> Bundler and framework independent CSS part of SSR-friendly code splitting

Detects used `css` files from the given HTML, and/or **inlines critical styles**. Supports sync or **stream** rendering.

Read more about critical style extraction and this library: https://dev.to/thekashey/optimising-css-delivery-57eh

- 🚀 Super Fast - no browser, no jsdom, no runtime transformations
- 💪 API - it's no more than an API - integrates with everything
- 🤝 Works with `strings` and `streams`
- ⏳ Helps preloading for the "real" style files

Works in two modes:

- 🚙 inlines style **rules** required to render given HTML - ideal for the first time visitor
- 🏋️‍♀️inlines style **files** required to render given HTML - ideal for the second time visitor (and code splitting)

Critical style extraction:

- 🧱 will _load_ all used styles at the beginning of your page in a **string** mode
- 💉 will _interleave_ HTML and CSS in a **stream** mode. This is the best experience possible

## How it works

1. Scans all `.css` files, in your `build` directory, extracting all style rules names.
2. Scans a given `html`, finding all the `classes` used.
3. Here there are two options:
   3a. Calculate all **style rules** you need to render a given HTML. 3b. Calculate all the style **files** you have
   send to a client.
4. Injects `<styles>` or `<links>`
5. After the page load, hoist or removes critical styles replacing them by the "real" ones.

## Limitation

For the performance sake `used-styles` inlines a bit more styles than it should - it inlines everything it would be "not
fast" to remove.

- inlines all `@keyframe` animations
- inlines all `html, body` and other tag-based selectors (hello css-reset)
- undefined behavior if `@layer a,b,c` is used multiple times

### Speed

> Speed, I am speed!

For the 516kb page, which needs **80ms** to `renderToString`(React) resulting time for the `getCriticalRules`(very
expensive operation) would be around **4ms**.

# API

## Discovery API

Use it to scan your `dist`/`build` folder to create a look up table between classNames and files they are described in.

1. `discoverProjectStyles(buildDirrectory, [filter]): StyleDef` - generates class lookup table
   > you may use the second argument to control which files should be scanned

`filter` is very important function here. It takes `fileName` as input, and returns
`false`, `true`, or a `number` as result. `False` value would exclude this file from the set, `true` - add it,
and `number`
would change **the order** of the chunk. Keeping chunk ordered "as expected" is required to preserve style declaration
order, which is important for many existing styles.

```js
// with chunk format [chunkhash]_[id] lower ids are potentialy should be defined before higher
const styleData = discoverProjectStyles(resolve('build'), (name) => {
  // get ID of a chunk and use it as order hint
  const match = name.match(/(\d)_c.css/);
  return match && +match[1];
});
```

> ⚠️ generally speaking - this approach working only unless there are no order-sensive styles from different chunks applied to a single DOM Element.
> Quite often it never happen, but if you are looking for a better way - follow to [#26](https://github.com/theKashey/used-styles/issues/26) ☣️

1. `loadStyleDefinitions` is a "full control API", and can used to feed `used-styles` with any custom data, for example
   providing correct critical css extraction in dev mode (no files written on disk)

```ts
return loadStyleDefinitions(
  /*list of files*/ async () => cssFiles,
  /*data loader*/ (file) => fetchTxt(`http://localhost:${process.env.DEV_SERVER_PORT}/${file}`)
  /*filter and order */ // (file) => order.indexOf(cssToChunk[file])
);
```

## Scanners

Use to get used styled from render result or a stream

2. `getUsedStyles(html, StyleDef): string[]` - returns all used **files**, you will need to import them
3. `getCriticalStyles(html, StyleDef) : string` - returns all used selectors and other applicable rules, wrapped
   with `style`
4. `getCriticalRules(html, StyleDef): string` - **the same**, but without `<style>` tag, letting you handle in a way you
   want

5. `createStyleStream(lookupTable, callback(fileName):void): TransformStream` - creates Transform stream - will
   inject `<links`
6. `createCriticalStyleStream(lookupTable, callback(fileName):void): TransformStream` - creates Transform stream - will
   inject `<styles`.

### React

There are only two things about react:

1. to inline critical styles use another helper - `getCriticalRules` which does not wrap result with `style` letting you
   do it

```js
import { getCriticalRules } from 'used-styles';

const Header = () => (
  <style data-used-styles dangerouslySetInnerHTML={{ __html: getCriticalRules(markup, styleData) }} />
);
```

2. React produces more _valid_ code, and you might enable optimistic optimization, making used-styles a bit faster.

```js
import { enableReactOptimization } from 'used-styles';

enableReactOptimization(); // just makes it a but faster
```

# Example

## Static rendering

There is nothing interesting here - just render, just `getUsedStyles`.

```js
import {discoverProjectStyles, getUsedStyles} from 'used-styles';


// generate lookup table on server start
const stylesLookup = discoverProjectStyles('./build');

async function MyRender() {
  await stylesLookup;// it is "thenable"
  // render App
  const markup = ReactDOM.renderToString(<App/>)
  const usedStyles = getUsedStyles(markup, stylesLookup);

  usedStyles.forEach(style => {
    const link = `<link  rel="stylesheet" href="build/${style}">\n`;
    // or
    const link = `<link rel="prefetch" as="style" href="build/${style}">\n`;
    // append this link to the header output or to the body
  });

// or

  const criticalCSS = getCriticalStyles(markup, stylesLookup);

// append this link to the header output
```

Any _bulk_ CSS operations, both `getCriticalStyles` and `getUsedStyles` **are safe** and preserve the selector rule
order. You **may combine** both methods, to prefetch full styles, and inline critical CSS.

! Keep in mind - calling two functions is as fast, as calling a single one !

### Stream rendering

Please keep in mind - stream rendering in **NOT SAFE** in terms of CSS, as long as **it might affect the ordering of
selectors**. Only pure BEM and Atomic CSS are "safe", _just some random CSS_ might be not compatible. Please **test**
results before releasing into production.

> If you do not understand why and how selector order is important - please **do not use** stream transformer.

Stream rendering is much harder, and much more efficient, giving you the best Time-To-First-Byte. And the second byte.

Stream rendering could be interleaved(more efficient) or block(more predictable).

### Interleaved Stream rendering

In case or React rendering you may use **interleaved streaming**, which would not delay TimeToFirstByte. It's quite
similar how StyledComponents works

```js
import express from 'express';
import { 
  discoverProjectStyles, 
  loadStyleDefinitions,
  createCriticalStyleStream, 
  createStyleStream,
  createLink,
} from 'used-styles';

const app = express();

// generate lookup table on server start
const stylesLookup = isProduction
  ? discoverProjectStyles('./dist/client') 
  // load styles for development
  : loadStyleDefinitions(async () => []);

app.use('*', async (req, res) => {
  await stylesLookup;

  try {
    const renderApp = (await import('./dist/server/entry-server.js')).default;

    // create a style steam
    const styledStream = createStyleStream(stylesLookup, (style) => {
      // _return_ link tag, and it will be appended to the stream output
      return createLink(`dist/${style}`) // <link href="dist/mystyle.css />
    });

    // or create critical CSS stream - it will inline all styles
    const styledStream = createCriticalStyleStream(stylesLookup); // <style>.myClass {...

    await renderApp({ res, styledStream });
  } catch (err) {
    res.sendStatus(500);
  }
});
```

```js
// entry-server.js
import React from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import MultiStream from 'multistream';
import { Readable } from 'node:stream';
import App from './App';

// small utility for "readable" streams
const readableString = string => {
  const s = new Readable();
  s.push(string);
  s.push(null);
  s._read = () => true;
  return s;
};

const ABORT_DELAY = 10000;

async function renderApp({ res, styledStream }) {
  let didError = false;
  
  const { pipe, abort } = renderToPipeableStream(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    {
      onShellError() {
        res.sendStatus(500);
      },
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
      }
    },
  );

  setTimeout(() => {
    abort();
  }, ABORT_DELAY);
}

export default renderApp;
```

**!! THIS IS NOT THE END !!** Interleaving links and react output would break a client side rehydration, as long as _
injected_ links were not rendered by React, and not expected to present in the "result" HTML code.

You have to move injected styles out prior rehydration.

```js
import React from 'react';
import { moveStyles } from 'used-styles/moveStyles';
import ReactDOM from 'react-dom/client';
import App from './App';

// Call before `ReactDOM.hydrateRoot`
moveStyles()

ReactDOM.hydrateRoot(
  document.getElementById('root'),
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

You might want to remove styles after rehydration to prevent duplication. Double check that corresponding _real_ CSS is
loaded.

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

That's all are streams, concatenated in a right order. It's possible to interleave them, but that's is not expected buy
a `hydrate`.

```js
import { discoverProjectStyles, createStyleStream, createLink } from 'used-styles';
import MultiStream from 'multistream';

// .....
// generate lookup table on server start
const lookup = await discoverProjectStyles('./build'); // __dirname usually

// small utility for "readable" streams
const readableString = (string) => {
  const s = new Readable();
  s.push(string);
  s.push(null);
  s._read = () => true;
  return s;
};

// render App
const htmlStream = ReactDOM.renderToNodeStream(<App />);

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
  endStream, // closing tags
];

MultiStream(streams).pipe(res);

// start by piping react and styled transform stream
htmlStream.pipe(styledStream, { end: false });
htmlStream.on('end', () => {
  // kill header stream on the main stream end
  headerStream.push(null);
  styledStream.end();
});
```

> This example is taken from [Parcel-SSR-example](https://github.com/theKashey/react-imported-component/tree/master/examples/SSR/parcel-react-ssr)
> from **react-imported-component**.

# Hybrid usage

The advanced pattern described in [Optimizing CSS Delivery](https://dev.to/thekashey/optimising-css-delivery-57eh)
article proposes to:

- inline critical CSS for a first time customers
- use cached `.css` files for recurring

This library does not provide a way to distinguish "one" cohort of customers from another, although, provides an API to
optimize the delivery.

- use `createCriticalStyleStream`/`getCriticalStyles` to **inline** critical CSS
- use `createStyleStream`/`getUsedStyles` to use `.css` files
- use `alterProjectStyles` with `filter` options to create two different sets of styles: not yet _cache_ set
  for `critical` styles, and the _cached_ ones for `used`.
- yes - you have to use or two transformers, or call two functions, one after another.

> Theoretically - all styles "critical" now, are "cached" ones next view.

# Performance

Almost unmeasurable. It's a simple and single RegExp, which is not comparable to the React Render itself.

# Comparison

> comparing with tools listed at [Google's Optimize CSS Delivery](https://developers.google.com/web/tools/lighthouse/audits/unused-css#inlining)

- [penthouse](https://github.com/pocketjoso/penthouse) - a super slow puppetter based solution. No integration with a
  real run time renderer is possible. Generates one big style block at the beginning of a file.
- [critical](https://github.com/addyosmani/critical) - a super slow puppetter based solution. Able to extract critical
  style "above the fold".
- [inline-critical](https://github.com/bezoerb/inline-critical) - slow jsdom based solution. Generates one big style
  block at the beginning of a file, and replaces all other `links` by async variants. However, it does not detect any
  critical or used styles in provided HTML - HTML is used only as a output target. 👎

- [critters-webpack-plugun](https://github.com/GoogleChromeLabs/critters) - is the nearest analog of used-styles, build
  on almost same principles.

`used-styles` is faster that libraries listed above, and optimized for multiple runs.

# License

MIT
