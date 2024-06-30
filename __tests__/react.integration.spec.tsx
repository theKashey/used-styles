import { resolve } from 'path';

import * as React from 'react';
import { renderToStaticNodeStream, renderToString } from 'react-dom/server';

import {
  alterProjectStyles,
  createCriticalStyleStream,
  createLink,
  createStyleStream,
  enableReactOptimization,
  getCriticalStyles,
  getUsedStyles,
  parseProjectStyles,
  serializeStylesLookup,
  loadSerializedLookup,
} from '../src';
import { discoverProjectStyles } from '../src/index-node';
import { StyleDefinition } from '../src/types';

describe('File based css stream', () => {
  let styles: StyleDefinition;

  beforeEach(() => {
    styles = discoverProjectStyles(resolve(__dirname, 'css'), (name) => {
      const match = name.match(/file(\d+).css/);

      return match && +match[1];
    });
  });

  it('fail: should throw if not ready', () => {
    expect(() => getUsedStyles('', styles)).toThrow();
  });

  it('skip: test', async () => {
    await styles;

    const s1 = getCriticalStyles('<div class="class2 someclass">', styles);
    const s2 = getCriticalStyles(
      '<div class="class2 someclass">',
      alterProjectStyles(styles, { filter: (x) => x.indexOf('file2') !== 0 })
    );
    const s3 = getCriticalStyles(
      '<div class="class2 someclass">',
      alterProjectStyles(alterProjectStyles(styles, { filter: (x) => x.indexOf('file2') !== 0 }), {
        filter: (x) => x.indexOf('file1') !== 0,
      })
    );

    expect(s1).not.toBe(s2);
    expect(s2).not.toBe(s3);
    expect(s1).toMatch(/data-used-styles=\"file1.css,file2.css\"/);
    expect(s2).toMatch(/data-used-styles=\"file1.css\"/);
    expect(s3).toBe('');
  });

  it('memoization: test', async () => {
    await styles;

    const s1 = getCriticalStyles('<div class="class2 someclass">', styles);
    // @ts-expect-error
    delete styles.ast.file2;

    const s2 = getCriticalStyles('<div class="class2 someclass">', styles);
    const s3 = getCriticalStyles('<div class="class2 somethingNotUsed">', styles);

    expect(s1).toBe(s2);
    expect(s1).not.toBe(s3);
  });

  it('ok: test', async () => {
    await styles;
    expect(getUsedStyles('', styles)).toEqual(['file1.css']);
    expect(getCriticalStyles('', styles)).toMatchSnapshot();

    const output = renderToString(
      <div>
        <div className="only someclass">
          <div className="another class11">
            {Array(10)
              .fill(1)
              .map((_, index) => (
                <div key={index}>
                  <span className="d">{index}</span>
                </div>
              ))}
            <div className="class1" />
          </div>
        </div>
      </div>
    );

    const usedFiles = getUsedStyles(output, styles);
    const usedCritical = getCriticalStyles(output, styles);

    expect(usedFiles).toEqual(['file1.css', 'file2.css']);

    expect(usedCritical).toMatch(/selector-11/);
    expect(usedCritical).toMatch(/data-from-file1/);
    expect(usedCritical).not.toMatch(/data-wrong-file1/);
    expect(usedCritical).toMatch(/data-from-file2/);
    expect(usedCritical).not.toMatch(/data-wrong-file1/);

    expect(usedCritical).toMatch(/ANIMATION_NAME/);

    expect(usedCritical).toMatch(/htmlRED/);
  });

  test('works with (de)serialized styles definition', async () => {
    await styles;

    const lookupAfterSerialization = loadSerializedLookup(JSON.parse(JSON.stringify(serializeStylesLookup(styles))));

    expect(getUsedStyles('', lookupAfterSerialization)).toEqual(['file1.css']);
    expect(getCriticalStyles('', lookupAfterSerialization)).toMatchSnapshot();

    const output = renderToString(
      <div>
        <div className="only someclass">
          <div className="another class11">
            {Array(10)
              .fill(1)
              .map((_, index) => (
                <div key={index}>
                  <span className="d">{index}</span>
                </div>
              ))}
            <div className="class1" />
          </div>
        </div>
      </div>
    );

    const usedFiles = getUsedStyles(output, lookupAfterSerialization);
    const usedCritical = getCriticalStyles(output, lookupAfterSerialization);

    expect(usedFiles).toEqual(['file1.css', 'file2.css']);

    expect(usedCritical).toMatch(/selector-11/);
    expect(usedCritical).toMatch(/data-from-file1/);
    expect(usedCritical).not.toMatch(/data-wrong-file1/);
    expect(usedCritical).toMatch(/data-from-file2/);
    expect(usedCritical).not.toMatch(/data-wrong-file1/);

    expect(usedCritical).toMatch(/ANIMATION_NAME/);

    expect(usedCritical).toMatch(/htmlRED/);
  });
});

describe('React css stream', () => {
  const file1 = `
    .a, .b, .input { color: rightColor }
    .a2, .b1, .input { color: wrong }
    input { color: rightInput }
    
    .responsive { color: red; }
    @media (print) {
      .responsive { color: blue; }
    }
  `;

  const file2 = `
    .c2, .d1, .input { marker: wrong }
    .c, .d { marker: blueMark }
    .responsive { color: red; }
  `;

  const file3 = `
    .somethingOdd { marker: wrong }    
  `;

  let lookup: any;

  beforeAll(() => {
    lookup = parseProjectStyles({
      file1,
      file2,
      file3,
    });
  });

  enableReactOptimization();

  describe('React.renderToStream', () => {
    let criticalStream: any;
    let cssStream: any;
    let output: any;

    const streamString = async (readStream: NodeJS.ReadableStream) => {
      const result = [];

      for await (const chunk of readStream) {
        result.push(chunk);
      }

      return result.join('');
    };

    it('setup', () => {
      criticalStream = createCriticalStyleStream(lookup);
      cssStream = createStyleStream(lookup, createLink);

      output = renderToStaticNodeStream(
        <div>
          <div className="a">
            <div className="a b c">
              <div className="xx responsive">
                {Array(1000)
                  .fill(1)
                  .map((_, index) => (
                    <div key={index}>
                      <span className="d">{index}</span>
                    </div>
                  ))}
              </div>
              datacontent
            </div>
            <div className="zz"></div>
          </div>
        </div>
      );
    });

    let htmlCritical = '';
    let htmlLink = '';
    let html = '';

    it('render', async () => {
      // tslint:disable variable-name
      const htmlCritical_a = streamString(output.pipe(criticalStream));
      const htmlLink_a = streamString(output.pipe(cssStream));
      const html_a = streamString(output);
      // tslint:enable

      htmlCritical = await htmlCritical_a;
      htmlLink = await htmlLink_a;
      html = await html_a;
    });

    it('expectations', () => {
      expect(html).toMatch(/datacontent/);
      expect(htmlCritical).toMatch(/datacontent/);
      expect(htmlLink).toMatch(/datacontent/);

      expect(htmlCritical).toMatch(/rightColor/);
      expect(htmlCritical).toMatch(/blueMark/);
      expect(htmlCritical).toMatch(/rightInput/);
      expect(htmlCritical).not.toMatch(/wrong/);

      expect(htmlLink).toMatch(/file1/);
      expect(htmlLink).toMatch(/file2/);
      expect(htmlLink).not.toMatch(/file3/);

      expect(htmlCritical).toMatchSnapshot();
      expect(htmlLink).toMatchSnapshot();
    });

    it('critical', () => {
      const critical = getCriticalStyles(html, lookup);
      expect(critical).toMatchSnapshot();
    });
  });
});
