import { alterProjectStyles, getCriticalRules, loadStyleDefinitions, StyleDefinition } from '../src';

describe('extraction stories', () => {
  it('handles duplicated selectors', async () => {
    const styles: StyleDefinition = loadStyleDefinitions(
      () => ['test.css'],
      () => `
.test {
  display: inline-block;
}

.test {
  padding: 10px;
}

.test:focus {
  color: red;
}

.test:focus {
  border: blue;
}
`
    );
    await styles;

    const extracted = getCriticalRules('<div class="test">', styles);

    expect(extracted).toMatchInlineSnapshot(`
      "
      /* test.css */
      .test { display: inline-block; }
      .test { padding: 10px; }
      .test:focus { color: red; }
      .test:focus { border: blue; }
      "
    `);
  });

  it('extract pseudo selectors', async () => {
    const styles: StyleDefinition = loadStyleDefinitions(
      () => ['test.css'],
      () => `
.test {
  display: inline-block;
}

.test:not(.some) {
  padding: 10px;
}

.test:focus,
.test::hover {
  padding: 10px;
}
`
    );
    await styles;

    const extracted = getCriticalRules('<div class="test">', styles);

    expect(extracted).toMatchInlineSnapshot(`
      "
      /* test.css */
      .test { display: inline-block; }
      .test:not(.some) { padding: 10px; }
      .test:focus,
      .test::hover { padding: 10px; }
      "
    `);
  });

  it('handle exotic styles', async () => {
    const styles: StyleDefinition = loadStyleDefinitions(
      () => ['test.css'],
      () => `
@media screen and (min-width:1350px){.content__L0XJ\\+{color:red}}
.primary__L4\\+dg{ color: blue}
.primary__L4+dg{ color: wrong}
        `
    );
    await styles;

    const extracted = getCriticalRules('<div class="content__L0XJ+ primary__L4+dg">', styles);

    expect(extracted).toMatchInlineSnapshot(`
      "
      /* test.css */

      @media screen and (min-width:1350px) {
      .content__L0XJ\\\\+ { color: red; }
      }

      .primary__L4\\\\+dg { color: blue; }
      "
    `);
  });

  it('reducing styles', async () => {
    const styles: StyleDefinition = loadStyleDefinitions(
      () => ['test.css'],
      () => `
.button {
  display: inline-block;
}

.button:focus {
  padding: 10px;
}
`
    );
    await styles;

    const extracted = getCriticalRules(
      '<div class="button">',
      alterProjectStyles(styles, {
        pruneSelector: (selector) => selector.includes(':focus'),
      })
    );

    expect(extracted).toMatchInlineSnapshot(`
      "
      /* test.css */
      .button { display: inline-block; }
      "
    `);
  });

  it('opening styles styles', async () => {
    const styles: StyleDefinition = loadStyleDefinitions(
      () => ['test.css'],
      () => `
.parent {
  display: inline-block;
}

.child {
  padding: 10px;
}
.parent .child {
  padding: 10px;
}
`
    );
    await styles;

    const extracted = getCriticalRules('<div class="child">', styles);

    expect(extracted).toMatchInlineSnapshot(`
      "
      /* test.css */
      .child { padding: 10px; }
      "
    `);
  });
});
