/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-var-requires */

// This module is meant to be spawned by TruffleProject to load
// truffle-config.js files without any side effects
import { argv } from "process";

const config = require(argv[2]);

process.send!(config);
