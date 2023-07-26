/**
 * @fileOverview inspired by https://github.com/perry-mitchell/css-selector-splitter/tree/master
 */

const BLOCKS: Record<string, string> = {
  '(': ')',
  '[': ']',
};

const QUOTES: Record<string, string> = {
  '"': '"',
  "'": "'",
};

const FINALIZERS: Record<string, string> = {
  ')': '(',
  ']': '[',
};

const SPLIT_ON: Record<string, string> = {
  ',': ',',
};

export const splitSelector = (selector: string): string[] => {
  const selectors: string[] = [];

  const stack: string[] = [];
  const joiners: string[] = [];
  let currentSelector = '';

  for (let i = 0; i < selector.length; i += 1) {
    const char = selector[i];

    if (BLOCKS[char] || QUOTES[char]) {
      if (stack.length === 0) {
        stack.push(char);
      } else {
        const lastBrace = stack[stack.length - 1];

        if (QUOTES[lastBrace]) {
          // within quotes
          if (char === lastBrace) {
            // closing quote
            stack.pop();
          }
        } else {
          // inside brackets or square brackets
          stack.push(char);
        }
      }

      currentSelector += char;
    } else if (FINALIZERS.hasOwnProperty(char)) {
      const lastBrace = stack[stack.length - 1];
      const matchingOpener = FINALIZERS[char];

      if (lastBrace === matchingOpener) {
        stack.pop();
      }

      currentSelector += char;
    } else if (SPLIT_ON[char]) {
      if (!stack.length) {
        // we're not inside another block, so we can split using the comma/splitter
        const lastJoiner = joiners[joiners.length - 1];

        if (lastJoiner === ' ' && currentSelector.length <= 0) {
          // we just split by a space, but there seems to be another split character, so use
          // this new one instead of the previous space
          joiners[joiners.length - 1] = char;
        } else if (currentSelector.length <= 0) {
          // skip this character, as it's just padding
        } else {
          // split by this character
          const newLength = selectors.push(currentSelector);
          joiners[newLength - 1] = char;
          currentSelector = '';
        }
      } else {
        // we're inside another block, so ignore the comma/splitter
        currentSelector += char;
      }
    } else {
      // just add this character
      currentSelector += char;
    }
  }

  selectors.push(currentSelector);

  return selectors.map((selector) => selector.trim()).filter((cssSelector) => cssSelector.length > 0);
};
