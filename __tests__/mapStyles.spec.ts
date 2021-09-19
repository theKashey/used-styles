import { mapSelector } from '../src/parser/utils';

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
