"use strict";

import { runTestFromJSON } from "../utils";

suite("Modifier invocation Navigation", function () {
  this.timeout(10000);
  runTestFromJSON(__dirname, "navigation.test.json");
});
