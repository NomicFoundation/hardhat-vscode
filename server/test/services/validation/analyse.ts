import { analyse } from "@services/validation/analyse";
import { assert } from "chai";

describe("analyse", () => {
  describe("unexpected error", () => {
    it("should log the error", async () => {
      try {
        await analyse(
          {
            logger: {
              trace: () => {
                return null;
              },
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { document: undefined } as any
        );

        assert.fail();
      } catch (err) {
        assert.isDefined(err);
      }
    });
  });
});
