import { getStylesInReactText } from '../string';

test('extract classes from html', () => {
  expect(getStylesInReactText('<div />')).toEqual([]);
  expect(getStylesInReactText('<div class="a"/>')).toEqual(['a']);
  expect(getStylesInReactText('<div class="a b"/>')).toEqual(['a b']);
});
