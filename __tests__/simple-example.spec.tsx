import { getCriticalRules, parseProjectStyles } from '../src';

test('simplest example ever', () => {
  const styles = parseProjectStyles({
    style: `body { padding:0 } .button {color:red}`,
  });

  const critical = getCriticalRules('<HTML><body><button class="button">hello</button></body></HTML>', styles);

  expect(critical).toMatchInlineSnapshot(`
    "
    /* style */
    body { padding: 0; }

    /* style */
    .button { color: red; }
    "
  `);
});
