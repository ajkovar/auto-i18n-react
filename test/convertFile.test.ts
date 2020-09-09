import convertFile from '../src/convertFile';
import fs from 'fs';

test("consecutive text nodes", () => {
  const input = fs.readFileSync('./test/samples/consecutiveText.js', 'utf8');
  const expectedOutput = fs.readFileSync('./test/samples/consecutiveText.output.js', 'utf8');
  const [output] = convertFile(input);
  expect(output).toBe(expectedOutput);
});
