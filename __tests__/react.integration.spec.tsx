import * as React from 'react';
import {renderToStaticNodeStream} from 'react-dom/server';

import {
  setReactOptimization,
  createCriticalStyleStream,
  createStyleStream,
  scanProjectStyles,
  createLink
} from "../src";

describe('React css critical stream', () => {

  const file1 = `
    .a, .b, input { color: right }
    .a2, .b1, input { color: wrong }
  `;

  const file2 = `
    .c2, .d1, input { marker: wrong }
    .c, .d { marker: blue }
  `;

  let lookup: any;

  beforeAll(async () => {
    lookup = await scanProjectStyles({
      file1,
      file2,
    });
  });

  setReactOptimization();

  it('React.renderToStream', async () => {
    const criticalStream = createCriticalStyleStream(lookup);
    const cssStream = createStyleStream(lookup, createLink);
    const output = renderToStaticNodeStream(
      <div>
        <div className="a">
          <div className="a b c">
            <div className="xx">
              {Array(1000).fill(1).map((x, index) => <div key={index}><span className="d">{index}</span></div>)}
            </div>
            datacontent
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
      return result.join('');
    };

    const htmlCritical_a =  streamString(output.pipe(criticalStream));
    const htmlLink_a =  streamString(output.pipe(cssStream));

    const htmlCritical = await htmlCritical_a;
    const htmlLink = await htmlLink_a;

    expect(htmlCritical).toMatch(/datacontent/);
    expect(htmlLink).toMatch(/datacontent/);

    expect(htmlCritical).toMatchSnapshot();
   expect(htmlLink).toMatchSnapshot();
  })
});