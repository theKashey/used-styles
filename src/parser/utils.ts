const classish = (str: string): boolean => !!str && str.indexOf('.') >= 0;

export const mapStyles = (styles: string): string[] =>
  (
    styles
      // remove style body
      .replace(/({[^{}]+})/g, '$')
      .replace(/({[^{}]+})/g, '$')
      // match style name
      .match(/\.([^>~,+$:{\[\s]+)?/g) || []
  )
    // clean style name
    .map((x) => x.replace(/[\s,.>~+$]+/, ''))
    .map((x) => x.replace(/[.\s.:]+/, ''));

export const mapSelector = (selector: string): string[] => {
  // replace `something:not(.something)` to `something:not`
  const cleanSelector = selector.replace(/\(([^)])*\)/g, '').replace(/(\\\+)/g, 'PLUS_SYMBOL');
  const ruleSelection =
    // anything like "style"
    cleanSelector.match(/\.([^>~+$:{\[\s]+)?/g) || [];

  ruleSelection.reverse();

  const effectiveMatcher: string = ruleSelection.find(classish) || '';
  const selectors = effectiveMatcher.match(/(\.[^.>~+,$:{\[\s]+)?/g);

  return (selectors || []).map((x) => x.replace(/[.\s.:]+/, '').replace(/PLUS_SYMBOL/g, '+')).filter(Boolean);
};
