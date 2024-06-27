import {
  alterProjectStyles,
  loadSerializedLookup,
  getCriticalRules,
  loadStyleDefinitions,
  serializeStylesLookup,
  StyleDefinition,
} from '../src';

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

  it('should ignore media rules nested to unknown at rules', async () => {
    const styles: StyleDefinition = loadStyleDefinitions(
      () => ['test.css'],
      () => `
@supports (display:grid) {
  .a { display: grid; }

  @media only print {
    .a { color: red; }
  }
}
`
    );
    await styles;

    const extracted = getCriticalRules('<div class="a">', styles);

    expect(extracted).toMatchInlineSnapshot(`
        "
        /* test.css */
        @supports (display:grid) {
          .a { display: grid; }

          @media only print {
            .a { color: red; }
          }
        }"
      `);
  });

  describe('Serializable definitions', () => {
    test('Serialized defintion is equal to original', async () => {
      const styles: StyleDefinition = loadStyleDefinitions(
        () => ['test.css'],
        () => `
  @media screen and (min-width:1350px){.content__L0XJ\\+{color:red}}
  .primary__L4\\+dg{ color: blue}
  .primary__L4+dg{ color: wrong}
          `
      );
      await styles;

      const serializedDefinition = JSON.stringify(serializeStylesLookup(styles));
      const deserializedDefinition = loadSerializedLookup(JSON.parse(serializedDefinition));

      expect(deserializedDefinition.lookup).toEqual(styles.lookup);
      expect(deserializedDefinition.ast).toEqual(styles.ast);
      expect(deserializedDefinition.urlPrefix).toEqual(styles.urlPrefix);
      expect(deserializedDefinition.isReady).toEqual(styles.isReady);
      expect(typeof deserializedDefinition.then).toEqual(typeof styles.then);
    });

    test('Serializing unready definition throws', async () => {
      const styles: StyleDefinition = loadStyleDefinitions(
        async () => ['test.css'],
        async () => `
  @media screen and (min-width:1350px){.content__L0XJ\\+{color:red}}
  .primary__L4\\+dg{ color: blue}
  .primary__L4+dg{ color: wrong}
          `
      );

      expect(() => serializeStylesLookup(styles)).toThrowErrorMatchingInlineSnapshot(
        `"used-styles: style definitions are not ready yet. You should \`await discoverProjectStyles(...)\`"`
      );
    });

    test('Invalid value in serializers throws', async () => {
      expect(() => serializeStylesLookup({} as any)).toThrowErrorMatchingInlineSnapshot(
        `"used-styles: style definitions has to be created using discoverProjectStyles or loadStyleDefinitions"`
      );

      expect(() => loadSerializedLookup({} as any)).toThrowErrorMatchingInlineSnapshot(
        `"used-styles: serialized style definition should be created with serializeStylesLookup"`
      );

      expect(() => loadSerializedLookup('invalid' as any)).toThrowErrorMatchingInlineSnapshot(
        `"used-styles: got a string instead of serialized style definition object, make sure to parse it back to JS object first"`
      );
    });
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
        @layer module, state;
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
        @layer module, state;
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
        @layer module, state;
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

    it('should handle CSS Cascade Layers with @layer at-rule mixed with media rules', async () => {
      const CSS = {
        'index.css': `
        .a {
          color: red;
        }

        @layer state {
          .a {
            background-color: brown;
          }

          @media only print {
            .b {
              color: red;
            }

            .a {
              color: red;
            }
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

          @media only print {
            .a {
              width: 42px;
            }

            @layer state {
              .b {
                border: medium solid limegreen;
              }
            }
          }
        `,
        'other.css': `
          .b {
            background-color: brown;
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
        @layer module, state;
        /* index.css */

        @layer state {
        @media only print {
        .b { color: red; }
        }
        }
        /* chunk.css */

        @media only print {
        @layer state {
        .b { border: medium solid limegreen; }
        }
        }
        /* other.css */
        .b { background-color: brown; }
        "
      `);
    });
  });
});
