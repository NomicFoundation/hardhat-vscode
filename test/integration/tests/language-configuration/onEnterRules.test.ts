import * as assert from "assert";
import { joinLines } from "../../helpers/joinLines";
import { CURSOR, withRandomFileEditor } from "../../helpers/editor";
import { type } from "../../helpers/commands";

suite("onEnterRules", function () {
  test("[onEnterRules] - Multi line comment - first line with closing", async () => {
    await withRandomFileEditor(
      `/**${CURSOR} */`,
      "sol",
      async (_editor, document) => {
        await type(document, "\nx");
        assert.strictEqual(document.getText(), joinLines(`/**`, ` * x`, ` */`));
      }
    );
  });

  test("[onEnterRules] - Multi line comment - first line without closing", async () => {
    await withRandomFileEditor(
      `/**${CURSOR}`,
      "sol",
      async (_editor, document) => {
        await type(document, "\nx");
        assert.strictEqual(document.getText(), joinLines(`/**`, ` * x`));
      }
    );
  });

  test("[onEnterRules] - Multi line comment - line in middle", async () => {
    await withRandomFileEditor(
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
    await withRandomFileEditor(
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
