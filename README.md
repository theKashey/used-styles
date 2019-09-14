<div align="center">
  <h1>used-style</h1>
  <br/>
  Get all the styles, you have used to render a page. 
  <br/>
  <br/>
  
  [![Build Status](https://travis-ci.org/theKashey/used-styles.svg?branch=master)](https://travis-ci.org/theKashey/used-styles)
  [![NPM version](https://img.shields.io/npm/v/used-styles.svg)](https://www.npmjs.com/package/used-styles)

</div>


> Bundler and framework independent CSS part of SSR-friendly code splitting

Detects used `css` files from the given HTML, and/or __inlines critical styles__.
Supports sync or __stream__ rendering. 

## Code splitting
This is all about code splitting, Server Side Rendering and React, even if React has nothing to do with this library.

Code splitting is a good feature, and SSR is also awesome, but then you have
to load all the used `scripts` on the client, before making a page alive.
Everybody is talking not about `.css`, but only about `.js`. 

That's done, in a different ways. That's not a big task, as long as the _usage_ of code splitted blocks
is _trackable_ - you are using it, and components defined inside. 

CSS is harder - you might just use random classes and what next? You are just importing CSS here and where,
sometimes indirectly, and there is no way to understand what's happening.

> While it's possible for webpack to add a `Link` to document header once some `Component` uses some `Style`,
you can't do the same in the __concurrent__ server environment - there is no <head/> to add a Link.

Code splitting libraries solved it straight forward - by building resource graph, and fetching all
bound resources to that graph, but tracking is hard, and quite bound to the bundler, and could delay content sending.

## Solution
1. Scan all `.css` files, extracting all the style names.
2. Scan resulting `html`, finding all the `classNames` used.
3a. Calculate all styles you need to render a given HTML.
3b. Calculate all the files you shall send to a client.
4. Inject styles or links
5. Hoist or remove styles on clientside startup 

> Bonus: Do the same for streams.

> Bonus: Do it only for really `used styled`, not just imported somewhere. 

## Limitation
In the performance sake `used-styles` inlines a bit more styles than it should - 
it's just harder to understand what shall be done.
- inlines all `@keyframe` animations
- inlines all `html, body` and other simple selectors (aka css-reset)
- inlines all rules matching last part of a selector

> And, hopefully

- __inlines all classes used in HTML code__


### Speed
>Speed, I am speed!

For the 516kb page, which needs 80ms to renderToString resulting time for `getCriticalRules`(very expensive operation)
would be around __4ms__.

# API
## Discovery API
Use to scan your `dist` folder to create a look up table between classNames and files they are described in.

1. `discoverProjectStyles(buildDirrectory, [filter]): StyleDef` - generates class lookup table
> you may use the second argument to control which files should be scanned

`filter` is very important function here. It takes `fileName` as input, and returns 
`false`, `true`, or a `number` as result. `False` value would exclude chunk from the set, while `number`
would change the order of the chunk.
Keeping chunk ordering "as expected" is required to preserve style declaration order, which is important for many
existing styles.

```js
// with chunk format [chunkhash]_[id]
const styleData = discoverProjectStyles(resolve('build'), name => {
  // get ID of a chunk and use it as order hint
  const match = name.match(/(\d)_c.css/);
  return match && +match[1];
});
```

## Scanners
Use to get used styled from render result or a stream

2. `getUsedStyles(html, StyleDef): string[]` - returns all used files, you have to import them
3. `getCriticalStyles(html, StyleDef) : string` - returns all used selectors and other applicable rules, wrapped with `style`
4. `getCriticalRules(html, StyleDef): string` - __the same__, but without `<style>` tag, letting you handle in a way you want

5. `createStyleStream(lookupTable, callback(fileName):void): TransformStream` - creates Transform stream - will inject `<links`
5. `createCriticalStyleStream(lookupTable, callback(fileName):void): TransformStream` - creates Transform stream - will inject `<styles`.

### React
There are only two things about react:
1. to inline critical styles use another helper - `getCriticalRules` which does not wrap result with `style` letting you do it
```js
import {getCriticalRules} from 'used-styles';
const Header = () => (
   <style 
       data-used-styles 
       dangerouslySetInnerHTML={{__html:getCriticalRules(markup, styleData)}}
   />
)
```
2. React produces more _valid_ code, and you might enable optimistic optimization, making used-styles a bit faster.
```js
import {enableReactOptimization} from 'used-styles';

enableReactOptimization(); // 
```

# Example
## Static rendering
There is nothing interesting here - just render, just `getUsedStyles`.
```js
import {discoverProjectStyles, getUsedStyles} from 'used-styles';


// generate lookup table on server start
const stylesLookup = discoverProjectStyles('./build');

async function MyRender () {
  await stylesLookup;// it is "thenable"
  // render App
  const markup = ReactDOM.renderToString(<App />)
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
Any _bulk_ CSS operations, both `getCriticalStyles` and `getUsedStyles` __are safe__ and preserve the selector rule order.
You __may combine__ both methods, to prefetch full styles, and inline critical CSS.

! Keep in mind - calling two functions is as fast, as calling a single one !

### Stream rendering
Please keep in mind - stream rendering in `NOT SAFE` in terms of CSS, as long as __it might affect the ordering of selectors__.
Only pure BEM and Atomic CSS are "safe", _just some CSS_ would not be compatible. 
Please __test__ results before releasing into production.

> If you do not understand why and how selector order is important - please __do not use__ stream transformer.


Stream rendering is much harder, and much more efficient.
The idea is to make it efficient, and not delay Time-To-First-Byte. And the second byte.

Stream rendering could be interleaved(more efficient) or block(more predictable).

### Interleaved Stream rendering
In case or React rendering you may use __interleaved streaming__, which would not delay TimeToFirstByte.
It's quite similar how StyledComponents works
```js
import {discoverProjectStyles, createLink} from 'used-styles';
import {createStyleStream} from 'used-styles/react';
import MultiStream from 'multistream';

// generate lookup table on server start
const stylesLookup = discoverProjectStyles('./build'); // __dirname usually

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
Double check that corresponding _real_ CSS is loaded.
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
import {discoverProjectStyles, createStyleStream, createLink} from 'used-styles';
import MultiStream from 'multistream';

// .....
// generate lookup table on server start
const lookup = await discoverProjectStyles('./build'); // __dirname usually

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

# Comparison
> comparing with tools listed at [Google's Optimize CSS Delivery](https://developers.google.com/web/tools/lighthouse/audits/unused-css#inlining)

- [penthouse](https://github.com/pocketjoso/penthouse) - a super slow puppetter based solution. No integration with a real run time renderer is possible. Generates one big style block at the beginning of a file.
- [critical](https://github.com/addyosmani/critical) - a super slow puppetter based solution. Able to extract critical style "above the fold". 
- [inline-critical](https://github.com/bezoerb/inline-critical) - slow jsdom based solution. Generates one big style block at the beginning of a file, and replaces all other `links` by async variants. However, it does not detect any critical or used styles in provided HTML - HTML is used only as a output target. 👎

`used-styles` is faster that libraries listed above, optimized for multiple runs, as well as

# License
MIT 
