import convertFile from '../app/convertFile';
import fs from 'fs';

test("consecutive text nodes", () => {
  const input = fs.readFileSync(`${__dirname}/samples/consecutiveText.js`, 'utf8');
  const expectedOutput = fs.readFileSync(`${__dirname}/samples/consecutiveText.output.js`, 'utf8');
  const [output] = convertFile(input);
  expect(output).toBe(expectedOutput);
});
