import {CacheLine, StyleDefinition, UsedTypes} from "../types";
import {Transform} from "stream";
import {getUsedStyles} from "../getCSS";
import {createLine, findLastBrace} from "../utils";
import {isReact} from "../config";

export const process = (chunk: string, line: CacheLine, def: StyleDefinition, callback: (styles: UsedTypes) => void): string => (
  isReact()
    ? processReact(chunk, line, def, callback)
    : processPlain(chunk, line, def, callback)
);

export const processPlain = (chunk: string, line: CacheLine, def: StyleDefinition, callback: (styles: UsedTypes) => void): string => {
  const data = line.tail + chunk;

  const lastBrace = findLastBrace(data);
  const usedString = data.substring(0, lastBrace);

  callback(getUsedStyles(usedString, def));

  line.tail = data.substring(lastBrace);
  return usedString;
};

export const processReact = (chunk: string, line: CacheLine, def: StyleDefinition, callback: (styles: UsedTypes) => void): string => {
  callback(getUsedStyles(chunk, def));

  return chunk;
};

export const createStyleStream = (def: StyleDefinition, callback: (styleFile: string) => string | undefined | void) => {

  const line = createLine();
  const styles: Record<string, boolean> = {};
  let injections: (string | undefined)[] = [];

  const cb = (newStyles: UsedTypes) => {
    newStyles
      .forEach(style => {
        if (!styles[style]) {
          styles[style] = true;
          const result = callback(style);
          if(result) {
            injections.push(result);
          }
        }
      })
  };

  return new Transform({
    // transform() is called with each chunk of data
    transform(chunk, _, _callback) {
      injections = [];
      const chunkData = Buffer.from(process(chunk.toString('utf-8'), line, def, cb), 'utf-8');
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