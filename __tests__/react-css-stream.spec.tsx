import * as React from 'react';
import {renderToStaticNodeStream} from 'react-dom/server';

import {getUsedStyles, createStyleStream, enableReactOptimization} from "../src";
import {StylesLookupTable} from "../src/types";

describe('React css stream', () => {
  const createLookup = (lookup: StylesLookupTable): any => ({
    isReady: true,
    ast: Object.keys(lookup).reduce((acc, file) => {
      lookup[file].forEach(f => acc[f] = {
        selectors: [],
      });
      return acc;
    }, {}),
    lookup
  });

  beforeEach(() => enableReactOptimization());

  it('simple map', () => {
    const map = getUsedStyles(
      `<div class="a"><div class="b c d"><div class="f"></div></div>`,
      createLookup({
        a: ['1'],
        b: ['2'],
        d: ['3'],
        e: ['4'],
        f: ['5', '6'],
      })
    );
    expect(map).toEqual(["1", "2", "3", "5", "6"]);
  });

  it('React.renderToStream', async () => {
    const styles = {};
    const cssStream = createStyleStream(createLookup({
      a: ['file1'],
      b: ['file1', 'file2'],
      zz: ['file3'],
      notused: ['file4']
    }), style => {
      styles[style] = (styles[style] || 0) + 1;
    });
    const output = renderToStaticNodeStream(
      <div>
        <div className="a">
          <div className="a b c">
            <div className="xx">
              {Array(1000).fill(1).map((x, index) => <div key={index}>{index}</div>)}
            </div>
          </div>
          <div className="zz">
          </div>
        </div>
      </div>
    );

    const streamString = async (readStream) => {
      const result = [];
      for await (const chunk of readStream) {
        result.push(chunk);
      }
      return result.join('')
    };

    const [tr, base] = await Promise.all([
      streamString(output.pipe(cssStream)),
      streamString(output)
    ]);

    expect(base).toEqual(tr);
    expect(styles).toEqual({
      file1: 1,
      file2: 1,
      file3: 1,
    })
  })
});