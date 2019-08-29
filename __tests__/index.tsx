import * as React from 'react';
import {remapStyles} from "../src/scanForStyles";

describe('scanForStyles', () => {
  it('should map simple style', () => {
    const styles = {};
    remapStyles({
        'a': '.a{}, .b .c{}, .d>.e:not(focused){}',
        'b': '.a {}, .f~.g{}',
      },
      styles
    );
    expect(styles).toEqual({
      "a": {
        "a": true,
        "b": true,
      },
      "b": {
        "a": true,
      },
      "c": {
        "a": true,
      },
      "d": {
        "a": true,
      },
      "e": {
        "a": true,
      },
      "f": {
        "b": true
      },
      "g": {
        "b": true
      },
    })
  });
});
