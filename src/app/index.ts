import fs from 'fs';
import minimatch from 'minimatch';
import recursive from 'recursive-readdir';
import yargs from 'yargs';
import convertFile from './convertFile';
import chalk from 'chalk';

interface Arguments {
  target: string | undefined;
}

const argv: Arguments = yargs.options({
  target: {
    type: 'string',
    description: 'Target directory where files will be converted in place',
  },
}).argv;

const excludedFiles = ['**/*.test.jsx'];

if (argv.target) {
  recursive(argv.target, (err, files) => {
    let totalModifications = 0;
    let filesCount = 0;
    let modifiedFilesCount = 0;
    if (err) {
      console.log(chalk.red(err.message));
      return 1;
    }
    const jsxFiles = files
      .filter(
        (fileName) =>
          !excludedFiles.some((exclude) => minimatch(fileName, exclude))
      )
      .filter(minimatch.filter('**/*.jsx'));
    filesCount = jsxFiles.length;
    jsxFiles.forEach((fileName) => {
      const file = fs.readFileSync(fileName, 'utf-8');
      const [convertedFile, modifications] = convertFile(file);
      totalModifications += modifications;
      if (modifications > 0) {
        console.log(`Updating ${fileName}`);
        modifiedFilesCount++;
        fs.writeFileSync(fileName, convertedFile, 'utf-8');
      } else {
        console.log(`No translatable strings found in ${fileName}`);
      }
    });
    console.log(
      chalk.green(
        `Translated ${totalModifications} words/phrases across ${modifiedFilesCount} files (out of ${filesCount} found).`
      )
    );
  });
} else {
  console.log(chalk.red('Error: A target directory must be selected.'));
  yargs.showHelp();
}
