"use strict";

import { runTestFromJSON } from "../utils";

suite("Jump to import file navigation", function () {
  this.timeout(10000);
  runTestFromJSON(__dirname, "importNavigation.test.json");
});
