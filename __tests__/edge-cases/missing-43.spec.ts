import { loadStyleDefinitions } from '../../src';
import { getCriticalStyles } from '../../src/getCSS';

describe('missing styles', () => {
  it('result should contain 1600', async () => {
    const styles = loadStyleDefinitions(
      () => ['test.css'],
      // // .downloads-1u5ev.downloadsFallback-1btP7 .logo-2Dv5-,
      () => `    
    .a.b .c {    
    position: relative;
}
`
    );
    await styles;

    expect(styles.ast['test.css'].selectors).toMatchInlineSnapshot(`
      Array [
        Object {
          "declaration": 1,
          "hash": ".a.b .c18suomu-1gpll6f0",
          "media": Array [],
          "parents": Array [
            "a",
            "b",
          ],
          "pieces": Array [
            "c",
          ],
          "postfix": ".c",
          "selector": ".a.b .c",
        },
      ]
    `);

    const extracted = getCriticalStyles('<div class="a b"><div class="c"></div></div>\n', styles);

    expect(extracted).toMatchInlineSnapshot(`
      "<style type=\\"text/css\\" data-used-styles=\\"test.css\\">.a.b .c { position: relative; }
      </style>"
    `);
  });
});
