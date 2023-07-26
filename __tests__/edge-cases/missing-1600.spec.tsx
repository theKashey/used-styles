import { fromAst } from '../../src/parser/fromAst';
import { buildAst } from '../../src/parser/toAst';
import { createUsedFilter } from '../../src/utils/cache';

describe('missing 1600px', () => {
  const CSS = `
.content {    
}

@media screen and (min-width: 768px) {
    .content {
        grid-column:1/6
    }
}

@media screen and (min-width: 1024px) {
    .content {
        grid-column:1/7
    }
}

/*this style duplicates 768 one, had the hash before*/
@media screen and (min-width: 1600px) {
    .content {
        grid-column:1/6
    }
}`;

  it('result should contain 1600', () => {
    const ast = buildAst(CSS);

    const test = fromAst(['content'], ast, createUsedFilter());

    expect(test).toMatchInlineSnapshot(`
      ".content {  }

      @media screen and (min-width: 768px) {
      .content { grid-column: 1/6; }
      }
      @media screen and (min-width: 1024px) {
      .content { grid-column: 1/7; }
      }
      @media screen and (min-width: 1600px) {
      .content { grid-column: 1/6; }
      }"
    `);
  });
});
