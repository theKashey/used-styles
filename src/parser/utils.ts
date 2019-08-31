const classish = (str: string): boolean => str && str.indexOf('.') >= 0;

export const mapStyles = (styles: string) => (
  (
    styles
    // remove style body
      .replace(/({[^{}]+})/g, '$')
      .replace(/({[^{}]+})/g, '$')
      // match style name
      .match(/\.([^>~,$:{\[\s]+)?/g) || []
  )
  // clean style name
    .map(x => x.replace(/[\s,.>~$]+/, ''))
    .map(x => x.replace(/[.\s.:]+/, ''))
);

export const mapSelector= (selector: string) => {

  const ruleSelection =
    selector.match(/\.([^>~$:{\[\s]+)?/g) || []

  // clean style name
//    .map(x => x.replace(/[\s,.>~$]+/, ''))

  ruleSelection.reverse();

  const effectiveMatcher = (ruleSelection.find(classish)) || '';

  return effectiveMatcher
    .match(/(\.[^.>~,$:{\[\s]+)?/g)
    .map(x => x.replace(/[.\s.:]+/, ''))
    .filter(Boolean);
}