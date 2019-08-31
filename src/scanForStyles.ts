import {readFile} from 'fs';
import {promisify} from 'util';
import {extname, relative} from 'path';
// @ts-ignore
import scanDirectory from 'scan-directory';
import {StyleDef, StyleDefinition, StyleFiles, StylesLookupTable} from "./types";
import {mapStyles} from "./parser/utils";
import {buildAst} from "./parser/toAst";
import {StyleAst} from "./parser/ast";
import {sortObjectKeys} from "./utils";

const RESOLVE_EXTENSIONS = ['.css'];

const pReadFile = promisify(readFile);
export const getFileContent = (file: string) => pReadFile(file, 'utf8');

export const remapStyles = (data: StyleFiles, result: StyleDef) => (
  Object.keys(data)
    .map((file) => ({file, styles: mapStyles(data[file])}))
    .forEach(({file, styles}) => (
      styles.forEach(className => {
        if (!result[className]) {
          result[className] = {};
        }
        result[className][file] = true;
      }))
    )
);

const toFlattenArray = (ast: StyleAst): StylesLookupTable => (
  Object
    .keys(ast)
    .reduce((acc, file) => {
      ast[file].selectors.forEach((sel) => {
        sel.pieces.forEach(className => {
          if (!acc[className]) {
            acc[className] = [];
          }
          acc[className].push(file);
        });
      });
      return acc;
    }, {} as StylesLookupTable)
);

export const astFromFiles = (fileDate: StyleFiles): StyleAst => (
  Object
    .keys(fileDate)
    .reduce((acc, file) => {
      acc[file] = buildAst(fileDate[file], file);
      return acc;
    }, {} as StyleAst)
);

export function parseProjectStyles(data: StyleFiles) {
  const ast = astFromFiles(sortObjectKeys(data));

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

export function discoverProjectStyles(rootDir: string, fileFilter: (fileName: string) => boolean = passAll): StyleDefinition {
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
    }
  } as StyleDefinition;

  async function scanner() {
    const files: string[] =
      (await scanDirectory(rootDir, undefined, () => false))
        .filter((name: string) => RESOLVE_EXTENSIONS.indexOf(extname(name)) >= 0 && fileFilter(name));

    const styleFiles: StyleFiles = {};
    await Promise.all(
      files.map(async (file) => {
        styleFiles[relative(rootDir, file)] = await getFileContent(file);
      })
    );

    return parseProjectStyles(styleFiles);
  }

  scanner().then(
    styles => {
      Object.assign(result, styles);
      resolve();
    }, e => {
      reject(e);
      console.error(e);
      throw new Error('used-styles failed to start');
    }
  );

  return result;
}