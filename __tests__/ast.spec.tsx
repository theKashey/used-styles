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
    `;

  it('should map simple style', () => {
    const ast = buildAst(CSS);
    expect(ast).toMatchSnapshot();
  });

  it('should remap simple style', () => {
    const ast = buildAst(CSS);
    const css = fromAst(['d'], ast);
    expect(css).toMatchSnapshot();
  });

  it('should remap complex style', () => {
    const ast = buildAst(CSS);
    const css = fromAst(['a', 'c'], ast);
    console.log(css);
    expect(css).toMatchSnapshot();
  });
});
