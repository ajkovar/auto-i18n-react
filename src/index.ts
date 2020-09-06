import fs = require("fs");
import minimatch from "minimatch";
import recursive from "recursive-readdir";
import yargs from "yargs";
import convertFile from "./convertFile";
import chalk from "chalk";

interface Arguments {
  target: string | undefined;
}

const argv: Arguments = yargs.options({
  target: {
    type: "string",
    description: "Target directory where files will be converted in place",
  },
}).argv;

if (argv.target) {
  recursive(argv.target, (err, files) => {
    files.filter(minimatch.filter("**/*.jsx")).forEach((fileName) => {
      const file = fs.readFileSync(fileName);
      fs.writeFileSync(fileName, convertFile(file.toString()));
    });
  });
} else {
  console.log(chalk.red("Error: A target directory must be selected."));
  yargs.showHelp();
}
