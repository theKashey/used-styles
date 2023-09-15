import { loadStyleDefinitions } from '../../src';
import { getCriticalStyles } from '../../src/getCSS';

describe('missing styles', () => {
  it('result should contain full fill value', async () => {
    const styles = loadStyleDefinitions(
      () => ['test.css'],
      () => `    
    .-lottie-player svg path[fill="rgb(255,255,255)"] {
  fill: var(--color-background)
}
`
    );
    await styles;

    expect(styles.ast['test.css'].selectors).toMatchInlineSnapshot(`
      Array [
        Object {
          "atrules": Array [],
          "declaration": 1,
          "hash": ".-lottie-player svg path[fill=\\"rgb(255,255,255)\\"]1noj2ak-1etm6d20",
          "parents": Array [
            "-lottie-player",
          ],
          "pieces": Array [
            "-lottie-player",
          ],
          "postfix": "svg path[fill=\\"rgb(255,255,255)\\"]",
          "selector": ".-lottie-player svg path[fill=\\"rgb(255,255,255)\\"]",
        },
      ]
    `);

    const extracted = getCriticalStyles(
      '<div class="-lottie-player"><svg><path fill="rgb(255,255,255)"></path></svg></div>',
      styles
    );

    expect(extracted).toMatchInlineSnapshot(`
      "<style type=\\"text/css\\" data-used-styles=\\"test.css\\">.-lottie-player svg path[fill=\\"rgb(255,255,255)\\"] { fill: var(--color-background); }
      </style>"
    `);
  });
});
