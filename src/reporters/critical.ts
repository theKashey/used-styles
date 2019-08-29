import {CacheLine, StyleDefinition, UsedTypes} from "../types";
import {Transform} from "stream";
import {getCriticalStyles} from "../cssStream";
import {createLine, findLastBrace} from "../utils";
import {isReact} from "../config";

export const process = (chunk: string, line: CacheLine, def: StyleDefinition, callback: (styles: string) => void): string => (
  isReact()
    ? processReact(chunk, line, def, callback)
    : processPlain(chunk, line, def, callback)
);

export const processPlain = (chunk: string, line: CacheLine, def: StyleDefinition, callback: (styles: string) => void): string => {
  const data = line.tail + chunk;

  const lastBrace = findLastBrace(data);
  const usedString = data.substring(0, lastBrace);

  callback(getCriticalStyles(usedString, def));

  line.tail = data.substring(lastBrace);
  return usedString;
};

export const processReact = (chunk: string, line: CacheLine, def: StyleDefinition, callback: (styles: string) => void): string => {
  callback(getCriticalStyles(chunk, def));

  return chunk;
};

export const createCriticalStyleStream = (def: StyleDefinition) => {
  const line = createLine();
  let injections: (string | undefined)[] = [];

  const cb = (style: string) => {
    style && injections.push(style);
  };

  return new Transform({
    // transform() is called with each chunk of data
    transform(chunk, _, _callback) {
      injections = [];
      const chunkData = Buffer.from(process(chunk.toString('utf-8'), line, def, cb), 'utf-8');
      _callback(
        undefined,
        (injections.length ? `<style>${injections.join('')}</style>` : '') + chunkData,
      );
    },

    flush(cb) {
      cb(undefined, line.tail);
    }
  });
};