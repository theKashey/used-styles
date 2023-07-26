import { splitSelector } from '../split-selectors';

describe('split selectors', () => {
  it('simple', () => {
    expect(splitSelector('.a')).toEqual(['.a']);
    expect(splitSelector('.a,.b')).toEqual(['.a', '.b']);
    expect(splitSelector('.a:before,:after')).toEqual(['.a:before', ':after']);
  });

  it('complex', () => {
    expect(splitSelector('a ~ span,b')).toEqual(['a ~ span', 'b']);
    expect(splitSelector("a#item p[alt^='test'],.body.test")).toEqual(["a#item p[alt^='test']", '.body.test']);
  });
});
