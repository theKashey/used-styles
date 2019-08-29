import {CacheLine, StyleDefinition} from "../types";
import {Transform} from "stream";
import {getCriticalStyles} from "../getCSS";
import {createLine, findLastBrace} from "../utils";
import {isReact} from "../config";

export const process = (chunk: string, line: CacheLine, callback: (styles: string) => void): string => (
  isReact()
    ? processReact(chunk, line, callback)
    : processPlain(chunk, line, callback)
);

export const processPlain = (chunk: string, line: CacheLine, callback: (styles: string) => void): string => {
  const data = line.tail + chunk;

  const lastBrace = findLastBrace(data);
  const usedString = data.substring(0, lastBrace);

  callback(usedString);

  line.tail = data.substring(lastBrace);
  return usedString;
};

export const processReact = (chunk: string, line: CacheLine, callback: (styles: string) => void): string => {
  callback(chunk);

  return chunk;
};

export const createCriticalStyleStream = (def: StyleDefinition) => {
  const line = createLine();
  let injections: (string | undefined)[] = [];

  const usedSelectors = new Set<string>();

  const filter = (selector: string) => {
    if (usedSelectors.has(selector)) {
      return false;
    }
    usedSelectors.add(selector);
    return true;
  };

  const cb = (content: string) => {
    const style = getCriticalStyles(content, def, filter);
    style && injections.push(style);
  };

  return new Transform({
    // transform() is called with each chunk of data
    transform(chunk, _, _callback) {
      injections = [];
      const chunkData = Buffer.from(process(chunk.toString('utf-8'), line, cb), 'utf-8');
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