import { SingleStyleAst } from '../parser/ast';

export const pruneSelector = (
  ast: Readonly<SingleStyleAst>,
  filter: (name: string) => boolean
): Readonly<SingleStyleAst> => ({
  ...ast,
  selectors: ast.selectors.filter((selector) => !filter(selector.selector)),
});
