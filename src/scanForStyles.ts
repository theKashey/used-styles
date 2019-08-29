import {readFile} from 'fs';
import {promisify} from 'util';
import {extname, relative} from 'path';
// @ts-ignore
import scanDirectory from 'scan-directory';
import {StyleDef, StyleDefinition, StyleFiles, StylesLookupTable} from "./types";
import {mapStyles} from "./parser/utils";
import {buildAst} from "./parser/toAst";
import {StyleAst} from "./parser/ast";

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

const toFlattenArray = (styles: StyleDef): StylesLookupTable => (
  Object
    .keys(styles)
    .reduce((acc, style) => {
      acc[style] = Object.keys(styles[style]);
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

export async function scanProjectStyles(data: StyleFiles) {
  const styles: StyleDef = {};
  remapStyles(data, styles);

  return {
    lookup: toFlattenArray(styles),
    ast: astFromFiles(data),
  };
}

export async function getProjectStyles(rootDir: string): Promise<StyleDefinition> {
  const files: string[] =
    (await scanDirectory(rootDir, undefined, () => false))
      .filter((name: string) => RESOLVE_EXTENSIONS.indexOf(extname(name)) >= 0)

  const styleFiles: StyleFiles = {};
  await Promise.all(
    files.map(async (file) => {
      styleFiles[relative(rootDir, file)] = await getFileContent(file);
    })
  );

  return scanProjectStyles(styleFiles);
}