import * as React from 'react';
import {buildAst} from "../src/parser/toAst";
import {fromAst} from "../src/parser/fromAst";

describe('test ast', () => {
  const CSS = `
      .a,
      .b .c {
        border:1px solid;
        margin: 6px 10px;
      }
      
      .d ~ .e:not(focused){ 
        display: block;
        position: relative;
        width: calc(100% - 10px);
      }
      
      @media only screen and (max-width: 600px) {
        .c { position: absolute; }
        .a { position: relative; }  
      }
      
      .a, .b, input { color: rightColor }
    `;

  it('should map simple style', () => {
    const ast = buildAst(CSS);
    expect(ast).toMatchSnapshot();
  });

  it('should remap simple style', () => {
    const ast = buildAst(CSS);
    const css = fromAst(['e'], ast);
    expect(css).toMatchSnapshot();
  });

  it('dont map unused styles', () => {
    const ast = buildAst(CSS);
    const cssFalsePositive = fromAst(['d', 'b'], ast);
    expect(cssFalsePositive).toBe('.b { color: rightColor; }\n');
  });

  it('should remap complex style', () => {
    const ast = buildAst(CSS);
    const css = fromAst(['a', 'c'], ast);
    expect(css).toMatchSnapshot();
  });
});
