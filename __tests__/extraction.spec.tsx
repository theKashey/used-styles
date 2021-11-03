import { getCriticalRules, loadStyleDefinitions, StyleDefinition } from '../src';

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
});
