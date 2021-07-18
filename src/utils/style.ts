import { mapStyles } from '../parser/utils';
import { StyleDef, StyleFiles } from '../types';

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
