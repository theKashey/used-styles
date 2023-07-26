import { extractParents, mapSelector } from '../src/parser/utils';

describe('test map selector', () => {
  it('should return the single style', () => {
    expect(mapSelector('.a')).toEqual(['a']);
  });

  it('should return the double style', () => {
    expect(mapSelector('.a.b')).toEqual(['a', 'b']);
  });

  it('should keep the last style', () => {
    expect(mapSelector('.a .b')).toEqual(['b']);
  });

  it('should keep the last style', () => {
    expect(mapSelector('.a .b input')).toEqual(['b']);
  });

  it('should keep the last style', () => {
    expect(mapSelector('.a .b:focus')).toEqual(['b']);
  });

  it('should keep the last style', () => {
    expect(mapSelector('.a input>.b:focus>input')).toEqual(['b']);
    expect(mapSelector('.item+.item:before')).toEqual(['item']);
  });
});

describe('test parent selector', () => {
  it('should return the single style', () => {
    expect(extractParents('.a')).toEqual([]);
  });

  it('should return the double style', () => {
    expect(extractParents('.a.b c')).toEqual(['a', 'b']);
  });

  it('should keep the first style; drop last', () => {
    expect(extractParents('.a .b')).toEqual(['a']);
  });

  it('should drop tag, keep both', () => {
    expect(extractParents('.a .b input')).toEqual(['a', 'b']);
  });

  it('should handle pseudo', () => {
    expect(extractParents('.a .b:focus .c')).toEqual(['a', 'b']);
  });

  it('edge cases', () => {
    expect(extractParents('.a input>.b:focus>input.c')).toEqual(['a']);
    expect(extractParents('.item+.item:before')).toEqual([]);
  });
});
