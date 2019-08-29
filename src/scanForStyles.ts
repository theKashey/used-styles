import {readFile} from 'fs';
import {promisify} from 'util';
import {extname, relative} from 'path';
// @ts-ignore
import scanDirectory from 'scan-directory';
import {StyleDef, StyleFile, StylesLookupTable} from "./types";
import {mapStyles} from "./parser/utils";

const RESOLVE_EXTENSIONS = ['.css'];

const pReadFile = promisify(readFile);
export const getFileContent = (file:string) => pReadFile(file, 'utf8');

export const remapStyles = (data: StyleFile[], result: StyleDef) => (
  data
    .map(({file, content}) => ({file, styles: mapStyles(content)}))
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

export async function getProjectStyles(rootDir: string): Promise<StylesLookupTable> {
  const files: string[] =
    (await scanDirectory(rootDir, undefined, () => false))
      .filter((name: string) => RESOLVE_EXTENSIONS.indexOf(extname(name)) >= 0)

  const data: StyleFile[] = await Promise.all(
    files
      .map(async function (file) {
        const content = await getFileContent(file);
        return {
          file: relative(rootDir, file),
          content
        } as StyleFile
      })
  );

  const styles: StyleDef = {};
  remapStyles(data, styles);

  return toFlattenArray(styles);
}