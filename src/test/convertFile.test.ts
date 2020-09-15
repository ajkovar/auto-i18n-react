import convertFile from '../app/convertFile';
import fs from 'fs';

test('consecutive text nodes', () => {
  const input = fs.readFileSync(
    `${__dirname}/samples/consecutiveText.js`,
    'utf8'
  );
  const expectedOutput = fs.readFileSync(
    `${__dirname}/samples/consecutiveText.output.js`,
    'utf8'
  );
  const [output] = convertFile(input);
  expect(output).toBe(expectedOutput);
});

test('simple attributes', () => {
  const input = fs.readFileSync(
    `${__dirname}/samples/simpleAttributes.js`,
    'utf8'
  );
  const expectedOutput = fs.readFileSync(
    `${__dirname}/samples/simpleAttributes.output.js`,
    'utf8'
  );
  const [output] = convertFile(input);
  expect(output).toBe(expectedOutput);
});

test('forbidden text', () => {
  const input = fs.readFileSync(
    `${__dirname}/samples/forbiddenText.js`,
    'utf8'
  );
  const expectedOutput = fs.readFileSync(
    `${__dirname}/samples/forbiddenText.output.js`,
    'utf8'
  );
  const [output] = convertFile(input);
  expect(output).toBe(expectedOutput);
});

test('prop types', () => {
  const input = fs.readFileSync(
    `${__dirname}/samples/propTypes.js`,
    'utf8'
  );
  const expectedOutput = fs.readFileSync(
    `${__dirname}/samples/propTypes.output.js`,
    'utf8'
  );
  const [output] = convertFile(input);
  expect(output).toBe(expectedOutput);
});