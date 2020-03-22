import { readFile } from 'fs';
import { extname, relative } from 'path';
// @ts-ignore
import scanDirectory from 'scan-directory';
import { promisify } from 'util';

import { StyleAst } from './parser/ast';
import { buildAst } from './parser/toAst';
import { mapStyles } from './parser/utils';
import { StyleDef, StyleDefinition, StyleFiles, StylesLookupTable, SyncStyleDefinition } from './types';
import { assertIsReady } from './utils';

const RESOLVE_EXTENSIONS = ['.css'];

const pReadFile = promisify(readFile);
export const getFileContent = (file: string) => pReadFile(file, 'utf8');

export const remapStyles = (data: StyleFiles, result: StyleDef) =>
  Object.keys(data)
    .map(file => ({ file, styles: mapStyles(data[file]) }))
    .forEach(({ file, styles }) =>
      styles.forEach(className => {
        if (!result[className]) {
          result[className] = {};
        }
        result[className][file] = true;
      })
    );

const toFlattenArray = (ast: StyleAst): StylesLookupTable =>
  Object.keys(ast).reduce((acc, file) => {
    ast[file].selectors.forEach(sel => {
      sel.pieces.forEach(className => {
        if (!acc[className]) {
          acc[className] = [];
        }
        acc[className].push(file);
      });
    });
    return acc;
  }, {} as StylesLookupTable);

const astFromFiles = (fileDate: StyleFiles): StyleAst =>
  Object.keys(fileDate).reduce((acc, file) => {
    acc[file] = buildAst(fileDate[file], file);
    return acc;
  }, {} as StyleAst);

export function parseProjectStyles(data: StyleFiles): SyncStyleDefinition {
  const ast = astFromFiles(data);

  return {
    isReady: true,
    lookup: toFlattenArray(ast),
    ast,
  };
}

export const getProjectStyles = () => {
  throw new Error('use `discoverProjectStyles` instead of getProjectStyles');
};

const passAll = () => true;

const flattenOrder = (order: boolean | number | null): number => {
  if (typeof order === 'number' || typeof order === 'string') {
    return +order;
  }
  if (order === true) {
    return 0;
  }

  return Number.NaN;
};

interface FlattenFileOrder {
  file: string;
  order: number;
}

export function discoverProjectStyles(
  rootDir: string,
  fileFilter: (fileName: string) => boolean | number | null = passAll
): StyleDefinition {
  let resolve: any;
  let reject: any;
  const awaiter = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const result: StyleDefinition = {
    isReady: false,
    then(res, rej) {
      return awaiter.then(res, rej);
    },
  } as StyleDefinition;

  async function scanner() {
    const files: string[] = ((await scanDirectory(rootDir, undefined, () => false)) as string[])
      .filter(name => RESOLVE_EXTENSIONS.indexOf(extname(name)) >= 0)
      .sort()
      .map(file => ({
        file,
        order: flattenOrder(fileFilter(file)),
      }))
      .filter(({ order }) => !Number.isNaN(order))
      .sort((a: FlattenFileOrder, b: FlattenFileOrder) => a.order - b.order)
      .map(({ file }) => file);

    const styleFiles: StyleFiles = {};
    // prefill the obiect to pin keys ordering
    files.map(file => (styleFiles[relative(rootDir, file)] = undefined as any));

    await Promise.all(
      files.map(async file => {
        styleFiles[relative(rootDir, file)] = await getFileContent(file);
      })
    );

    return parseProjectStyles(styleFiles);
  }

  scanner().then(
    styles => {
      Object.assign(result, styles);
      resolve();
    },
    e => {
      reject(e);
      // tslint:disable-next-line:no-console
      console.error(e);
      throw new Error('used-styles failed to start');
    }
  );

  return result;
}

export interface AlterOptions {
  // filters available styles
  filter(style: string): boolean;
}

export const alterProjectStyles = (def: StyleDefinition, options: AlterOptions): StyleDefinition => {
  assertIsReady(def);

  return {
    ...def,
    ast: Object.keys(def.ast).reduce((acc, file) => {
      const astFile = def.ast[file];
      const shouldRemove = !options.filter || !options.filter(file);

      // dont add this file to the result file list
      if (shouldRemove) {
        return acc;
      }

      acc[file] = astFile;

      return acc;
    }, {} as StyleAst),
  };
};
