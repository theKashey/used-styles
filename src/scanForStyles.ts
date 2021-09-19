import { readFile } from 'fs';
import { extname, join, relative } from 'path';

import { promisify } from 'util';

// @ts-ignore
import scanDirectory from 'scan-directory';

import { StyleAst } from './parser/ast';
import { buildAst } from './parser/toAst';
import { StyleDefinition, StyleFiles, StylesLookupTable, SyncStyleDefinition } from './types';
import { flattenOrder } from './utils/order';

const RESOLVE_EXTENSIONS = ['.css'];

const pReadFile = promisify(readFile);

export const getFileContent = (file: string) => pReadFile(file, 'utf8');

const toFlattenArray = (ast: StyleAst): StylesLookupTable =>
  Object.keys(ast).reduce((acc, file) => {
    ast[file].selectors.forEach((sel) => {
      sel.pieces.forEach((className) => {
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

/**
 * (synchronously) creates style definition from a given set of style data
 * @param data a data in form of {fileName: fileContent}
 */
export function parseProjectStyles(data: Readonly<StyleFiles>): SyncStyleDefinition {
  const ast = astFromFiles(data);

  return {
    isReady: true,
    lookup: toFlattenArray(ast),
    ast,
  };
}

const passAll = () => true;

export interface FlattenFileOrder {
  file: string;
  order: number;
}

const createAwaitableResult = () => {
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

  return {
    result,
    resolve,
    reject,
  };
};

/**
 * Loads a given set of styles. This function is useful for custom scenarios and dev mode, where no files are emitted on disk
 * @see {@link discoverProjectStyles} to automatically load styles from the build folder
 * @param getStyleNames - a style name generator
 * @param loader - a data loader
 * @param fileFilter - filter and order corrector
 * @example
 * ```ts
 * loadStyleDefinitions(
 *  async () => ['style1.css'],
 *  (styleName) => fetch(CDN+styleName),
 * )
 * ```
 */
export function loadStyleDefinitions(
  getStyleNames: () => string[] | Promise<string[]>,
  loader: (style: string) => string | Promise<string>,
  fileFilter: (fileName: string) => boolean | number | null = passAll
): StyleDefinition {
  const { resolve, reject, result } = createAwaitableResult();

  async function scanner() {
    const files: string[] = (await getStyleNames())
      .map((file) => ({
        file,
        order: flattenOrder(fileFilter(file)),
      }))
      .filter(({ order }) => !Number.isNaN(order))
      .sort((a: FlattenFileOrder, b: FlattenFileOrder) => a.order - b.order)
      .map(({ file }) => file);

    const styleFiles: StyleFiles = {};
    // prefill the obiect to pin keys ordering
    files.map((file) => (styleFiles[file] = undefined as any));

    await Promise.all(
      files.map(async (file) => {
        styleFiles[file] = await loader(file);
      })
    );

    return parseProjectStyles(styleFiles);
  }

  scanner().then(
    (styles) => {
      Object.assign(result, styles);
      resolve();
    },
    (e) => {
      reject(e);
      // tslint:disable-next-line:no-console
      console.error(e);
      throw new Error('used-styles failed to start');
    }
  );

  return result;
}

/**
 * auto discovers style files in a given dir applying a given "ordering" filter
 * @see Use {@link loadStyleDefinitions} as a full customizable variant
 * @param rootDir - location of the build artefact
 * @param fileFilter - filter and ordering, return false to skip the file, return true or null to not change file order, sort index otherwise
 */
export function discoverProjectStyles(
  rootDir: string,
  fileFilter: (fileName: string) => boolean | number | null = passAll
): StyleDefinition {
  return loadStyleDefinitions(
    async () =>
      ((await scanDirectory(rootDir, undefined, () => false)) as string[])
        .filter((name) => RESOLVE_EXTENSIONS.indexOf(extname(name)) >= 0)
        .map((file) => relative(rootDir, file))
        .sort(),
    (fileName) => getFileContent(join(rootDir, fileName)),
    fileFilter
  );
}
