/*eslint no-console: "warn",  no-constant-condition: "warn"*/
import {Transform} from 'stream';
import {CacheLine, StylesLookupTable, UsedTypes} from "./types";

const findLastBrace = (data: string): number => {
  let fromIndex = 0;
  while (true) {
    const classNamePosition = data.indexOf('class=', fromIndex);
    const endBrace = data.indexOf('>', Math.max(classNamePosition, fromIndex + 1)) + 1;
    if (endBrace === 0) {
      break;
    }
    fromIndex = Math.max(classNamePosition, endBrace);
  }
  return fromIndex;
};


export const process = (chunk: string, line: CacheLine, lookupTable: StylesLookupTable, callback: (styles: UsedTypes) => void): string => {
  const data = line.tail + chunk;

  const lastBrace = findLastBrace(data);
  const usedString = data.substring(0, lastBrace);

  callback(getUsedStyles(usedString, lookupTable));

  line.tail = data.substring(lastBrace);
  return usedString;
};

const createLine = (): CacheLine => ({
  tail: '',
});

export const getUsedStyles = (str: string, lookupTable: StylesLookupTable): UsedTypes => (
  Object.keys(
    [
      ...(str.match(/class=["']([^"]+)["']/g) || []),
      ...(str.match(/class=([^"'\s>]+)/g) || []),
    ].reduce((styles, className) => {
      const classes = className.replace(/(class|'|"|=)+/g, '').split(' ');
      classes.forEach(singleClass => {
        const files = lookupTable[singleClass];
        if (files) {
          files.forEach(file => styles[file] = true);
        }
      });
      return styles;
    }, {} as UsedTypes)
  )
);

export const createStyleStream = (lookupTable: StylesLookupTable, callback: (styleFile: string) => string | undefined) => {

  const line = createLine();
  const styles: Record<string, boolean> = {};
  let injections: (string | undefined)[] = [];

  const cb = (newStyles: UsedTypes) => {
    newStyles
      .forEach(style => {
        if (!styles[style]) {
          styles[style] = true;
          injections.push(callback(style));
        }
      })
  };

  return new Transform({
    // transform() is called with each chunk of data
    transform(chunk, _, _callback) {
      injections = [];
      const chunkData = Buffer.from(process(chunk.toString('utf-8'), line, lookupTable, cb), 'utf-8');
      _callback(
        undefined,
        injections.filter(Boolean).join('\n') + chunkData
      );
    },

    flush(cb) {
      cb(undefined, line.tail);
    }
  });
};