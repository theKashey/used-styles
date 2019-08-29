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