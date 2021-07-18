import { remapStyles } from '../src/utils/style';

describe('scanForStyles', () => {
  it('should map simple style', () => {
    const styles = {};
    remapStyles(
      {
        a: '.a{}, .b .c{}, .d>.e:not(focused){}',
        b: '.a {}, .f~.g{}, @media (screen) { .media { } }',
      },
      styles
    );
    expect(styles).toEqual({
      a: {
        a: true,
        b: true,
      },
      b: {
        a: true,
      },
      c: {
        a: true,
      },
      d: {
        a: true,
      },
      e: {
        a: true,
      },
      f: {
        b: true,
      },
      g: {
        b: true,
      },
    });
  });
});
