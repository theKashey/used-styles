import * as React from 'react';
import { renderToNodeStream } from 'react-dom/server';

import { createCriticalStyleStream, parseProjectStyles } from '../src';

describe('React css stream', () => {
  const file1 = `
    .a, .b, .c, .d, .input { color: rightColor }
  `;

  let lookup: any;

  beforeAll(() => {
    lookup = parseProjectStyles({
      file1,
    });
  });

  describe('React.renderToStream ', () => {
    it('render with small number of option tags', async () => {
      const streamString = async (readStream: NodeJS.ReadableStream) => {
        const result = [];

        for await (const chunk of readStream) {
          result.push(chunk);
        }

        return result.join('');
      };

      const criticalStream = createCriticalStyleStream(lookup);

      const output = renderToNodeStream(
        <>
          <div className="a">
            <select className="b">
              {Array.from(Array(5)).map((_, num) => (
                <option key={num} className="c">
                  {num}
                </option>
              ))}
            </select>
            <div className="d"></div>
          </div>
        </>
      );

      let htmlCritical = '';
      const _htmlCritical = streamString(output.pipe(criticalStream));

      htmlCritical = await _htmlCritical;
      console.log('htmlCritical: ', htmlCritical);

      // should not include options or selects with nested styles
      // should not include options or selects with nested styles
      expect(htmlCritical.includes('<select><style')).toBe(false);
      expect(htmlCritical.includes('<select></style')).toBe(false);
      expect(htmlCritical.includes('<option class="c"><style')).toBe(false);
      expect(htmlCritical.includes('<option class="c"></style')).toBe(false);
    });

    it('render with large number of option tags', async () => {
      const streamString = async (readStream: NodeJS.ReadableStream) => {
        const result = [];

        for await (const chunk of readStream) {
          result.push(chunk);
        }

        return result.join('');
      };

      const criticalStream = createCriticalStyleStream(lookup);

      const output = renderToNodeStream(
        <>
          <div className="a">
            <select className="b">
              {Array.from(Array(1000)).map((_, num) => (
                <option key={num} className="c">
                  {num}
                </option>
              ))}
            </select>
            <div className="d"></div>
          </div>
        </>
      );

      let htmlCritical = '';
      const _htmlCritical = streamString(output.pipe(criticalStream));

      htmlCritical = await _htmlCritical;

      // should not include options or selects with nested styles
      expect(htmlCritical.includes('<select><style')).toBe(false);
      expect(htmlCritical.includes('<select></style')).toBe(false);
      expect(htmlCritical.includes('<option class="c"><style')).toBe(false);
      expect(htmlCritical.includes('<option class="c"></style')).toBe(false);
    });
  });
});
