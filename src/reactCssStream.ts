/*eslint no-console: "warn",  no-constant-condition: "warn"*/
import {Transform} from 'stream';
import {CacheLine, StylesLookupTable, UsedTypes, UsedTypesRef} from "./types";

export const process = (chunk: string, line: CacheLine, lookupTable: StylesLookupTable, callback: (styles: UsedTypes) => void): string => {
  callback(getUsedStyles(chunk, lookupTable));

  return chunk;
};

const createLine = (): CacheLine => ({
  tail: '',
});

const classPlaceholder = 'class="';

export const getUsedStyles = (str: string, lookupTable: StylesLookupTable): UsedTypes => (
  Object.keys(
    [
      ...(str.match(/class="([^"]+)"/g) || []),
    ].reduce((styles, className) => {
      const classes = className
        .substr(classPlaceholder.length, className.length - classPlaceholder.length - 1)
        .split(' ');

      classes.forEach(singleClass => {
        const files = lookupTable[singleClass];
        if (files) {
          files.forEach((file:string) => styles[file] = true);
        }
      });
      return styles;
    }, {} as UsedTypesRef)
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
      cb();
    }
  });
};