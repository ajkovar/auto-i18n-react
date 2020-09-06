import fs = require("fs");
import minimatch from "minimatch";
import recursive from "recursive-readdir";
import yargs from "yargs";
import convertFile from "./convertFile";

interface Arguments {
  files: string | undefined;
}

const argv: Arguments = yargs.options({
  files: { type: "string" },
}).argv;

if (argv.files) {
  recursive(argv.files, (err, files) => {
    files.filter(minimatch.filter("**/*.jsx")).forEach((fileName) => {
      const file = fs.readFileSync(fileName);
      fs.writeFileSync(fileName, convertFile(file.toString()));
    });
  });
}

// const file = fs.readFileSync("./sample/CardLayout.jsx");

// fs.writeFileSync(
//   "sample/output.jsx",
//   prettier.format(code, {
//     trailingComma: "es5",
//     tabWidth: 2,
//     semi: true,
//     singleQuote: true,
//   })
// );
