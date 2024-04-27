import { extractUnmatchableFromAst } from '../src/getCSS';
import { fromAst } from '../src/parser/fromAst';
import { buildAst } from '../src/parser/toAst';

describe('media selectors', () => {
  const CSS = `
      .a {
        border:2px solid;        
      }
      .b {
        border:1px solid;        
      }
      .d { position: relative; }
          
      @media only screen and (max-width: 600px) {
        .a { position: relative; }
        .b { position: relative; }  
        .c { position: relative; }
      }
      
      @media only screen and (max-width: 600px) {
        .c { color: red; }
      }
      
      @media only print {
        .c { position: relative; }
      }
      
      body { color: red }
      
      .a, .b, input { color: rightColor }
     `;

  const ast = buildAst(CSS);

  it('should return nothing if nothing used', () => {
    const css = fromAst([], ast);
    expect(css).toEqual('');
  });

  it('should extract unmatchable parts', () => {
    const css = extractUnmatchableFromAst({ ast });

    expect(css[0].css).toEqual(`body { color: red; }
input { color: rightColor; }
`);
  });

  it('should return what was used', () => {
    const css = fromAst(['d'], ast);
    expect(css.trim()).toEqual('.d { position: relative; }');
  });

  it('should use media if not used: case a', () => {
    const css = fromAst(['a'], ast);

    expect(css.trim()).toEqual(`.a { border: 2px solid; }

@media only screen and (max-width: 600px) {
.a { position: relative; }
}

.a { color: rightColor; }`);
  });

  it('should use media if not used: case c', () => {
    const css = fromAst(['c'], ast);

    expect(css.trim()).toEqual(`@media only screen and (max-width: 600px) {
.c { position: relative; }
.c { color: red; }
}
@media only print {
.c { position: relative; }
}`);
  });
});
