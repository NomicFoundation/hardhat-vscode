import * as assert from "assert";
import { joinLines } from "../../helpers/misc";
import { CURSOR, withRandomFileEditor } from "../../helpers/files";
import { type } from "../../helpers/commands";

suite("onEnterRules", function () {
  test("[onEnterRules] - Multi line comment - first line with closing", async () => {
    return withRandomFileEditor(
      `/**${CURSOR} */`,
      "sol",
      async (_editor, document) => {
        await type(document, "\nx");
        assert.strictEqual(document.getText(), joinLines(`/**`, ` * x`, ` */`));
      }
    );
  });

  test("[onEnterRules] - Multi line comment - first line without closing", async () => {
    return withRandomFileEditor(
      `/**${CURSOR}`,
      "sol",
      async (_editor, document) => {
        await type(document, "\nx");
        assert.strictEqual(document.getText(), joinLines(`/**`, ` * x`));
      }
    );
  });

  test("[onEnterRules] - Multi line comment - line in middle", async () => {
    return withRandomFileEditor(
      joinLines(`/**`, ` * a line${CURSOR}`),
      "sol",
      async (_editor, document) => {
        await type(document, "\nx");
        assert.strictEqual(
          document.getText(),
          joinLines(`/**`, ` * a line`, ` * x`)
        );
      }
    );
  });

  test("[onEnterRules] - Multi line comment - remove space when closing", async () => {
    return withRandomFileEditor(
      joinLines(`  /**`, `   * a line`, `   */${CURSOR}`),
      "sol",
      async (_editor, document) => {
        await type(document, "\nx");
        assert.strictEqual(
          document.getText(),
          joinLines(`  /**`, `   * a line`, `   */`, `  x`)
        );
      }
    );
  });
});
