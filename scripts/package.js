#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const { exec } = require("child_process");

async function main() {
  // Swap `EXTENSION.md` and `README.md`
  fs.renameSync("README.md", "README.md.tmp");
  fs.renameSync("EXTENSION.md", "README.md");

  exec(
    "node node_modules/vsce/vsce package --no-yarn",
    (error, stdout, stderr) => {
      // Swap back `README.md` and `EXTENSION.md`,
      // under all circumstances
      fs.renameSync("README.md", "EXTENSION.md");
      fs.renameSync("README.md.tmp", "README.md");

      if (error) {
        console.log(`error: ${error.message}`);
        process.exit(1);
      }

      if (stderr) {
        console.log(`stderr: ${stderr}`);
        process.exit(1);
      }

      console.log(stdout);
    }
  );
}

main();
