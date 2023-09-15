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

.grand .child {
  padding: 10px;
}

.top .child {
  margin: 10px;
}

.grand.top .child {
  position: correct
}

.grand.top {
  margin: 10px;
}

.grand.top.incorrect .child {
  position: incorrect
}
`
    );
    await styles;

    const extracted = getCriticalRules('<div class="grand top"><div class="child"></div>', styles);

    expect(extracted).toMatchInlineSnapshot(`
      "
      /* test.css */
      .child { padding: 10px; }
      .grand .child { padding: 10px; }
      .top .child { margin: 10px; }
      .grand.top .child { position: correct; }
      .grand.top { margin: 10px; }
      "
    `);
  });

  describe('CSS Cascade Layers', () => {
    it('handles CSS Cascade Layers', async () => {
      const styles = loadStyleDefinitions(
        () => ['test.css'],
        () => `
        @layer module, state;

        .a {
          color: red;
        }

        @layer state {
          .a {
            background-color: brown;
          }
          .b {
            border: medium solid limegreen;
          }
        }

        @layer module {
          .a {
            border: medium solid violet;
            background-color: yellow;
            color: white;
          }
        }
        `
      );

      await styles;

      const extracted = getCriticalRules('<div class="a">', styles);

      expect(extracted).toMatchInlineSnapshot(`
        "
        /* test.css */
        @layer module, state
        /* test.css */
        .a { color: red; }

        @layer state {
        .a { background-color: brown; }
        }
        @layer module {
        .a { border: medium solid violet;
        background-color: yellow;
        color: white; }
        }"
      `);
    });

    it('handles CSS Cascade Layers across multiple files', async () => {
      const CSS = {
        'index.css': `
        @layer module, state;

        .a {
          color: red;
        }

        @layer state {
          .a {
            background-color: brown;
          }
          .b {
            border: medium solid limegreen;
          }
        }

        @layer module {
          .a {
            border: medium solid violet;
            background-color: yellow;
            color: white;
          }
        }
        `,
        'chunk.css': `
          @layer state {
            .b {
              border: medium solid limegreen;
            }
          }
        `,
      } as const;

      const styles = loadStyleDefinitions(
        () => Object.keys(CSS),
        (file) => CSS[file as keyof typeof CSS]
      );

      await styles;

      const extracted = getCriticalRules('<div class="b">', styles);

      expect(extracted).toMatchInlineSnapshot(`
        "
        /* index.css */
        @layer module, state
        /* index.css */

        @layer state {
        .b { border: medium solid limegreen; }
        }
        /* chunk.css */
        "
      `);
    });

    it('handles nested CSS Cascade Layers', async () => {
      const CSS = {
        'index.css': `

        .a {
          color: red;
        }

        @layer state {
          .a {
            background-color: brown;
          }
          .b {
            border: medium solid limegreen;
          }

          @layer module {
            .a {
              border: medium solid violet;
              background-color: yellow;
              color: white;
            }
          }
        }

        @layer state.module {
          .a {
            border-color: blue;
          }
        }
        `,
      };

      const styles = loadStyleDefinitions(
        () => Object.keys(CSS),
        (file) => CSS[file as keyof typeof CSS]
      );

      await styles;

      const extracted = getCriticalRules('<div class="a">', styles);

      expect(extracted).toMatchInlineSnapshot(`
        "
        /* index.css */
        .a { color: red; }

        @layer state {
        .a { background-color: brown; }
        }
        @layer state {
        @layer module {
        .a { border: medium solid violet;
        background-color: yellow;
        color: white; }
        }
        }
        @layer state.module {
        .a { border-color: blue; }
        }"
      `);
    });

    test('CSS Cascade Layers definition should be always at top', async () => {
      const CSS = {
        'index.css': `
        .a {
          color: red;
        }

        @layer state {
          .a {
            background-color: brown;
          }
          .b {
            color: red;
          }
        }

        @layer module {
          .a {
            border: medium solid violet;
            background-color: yellow;
            color: white;
          }
        }
        `,
        'chunk.css': `
          @layer module, state;

          @layer state {
            .b {
              border: medium solid limegreen;
            }
          }
        `,
      } as const;

      const styles = loadStyleDefinitions(
        () => Object.keys(CSS),
        (file) => CSS[file as keyof typeof CSS]
      );

      await styles;

      const extracted = getCriticalRules('<div class="b">', styles);

      expect(extracted).toMatchInlineSnapshot(`
        "
        /* chunk.css */
        @layer module, state
        /* index.css */

        @layer state {
        .b { color: red; }
        }
        /* chunk.css */

        @layer state {
        .b { border: medium solid limegreen; }
        }"
      `);
    });
  });
});
