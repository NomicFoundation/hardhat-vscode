import { Event } from "@sentry/core";
import { assert } from "chai";
import { sentryEventFilter } from "../../src/telemetry/sentryEventFilter";

function eventWith(type: string, value: string): Event {
  return { exception: { values: [{ type, value }] } };
}

describe("sentryEventFilter", () => {
  it("reports an event with no exception", () => {
    assert.isTrue(sentryEventFilter({}));
  });

  it("reports an ordinary error", () => {
    assert.isTrue(
      sentryEventFilter(
        eventWith("TypeError", "Cannot read properties of undefined")
      )
    );
  });

  describe("excludes states a user's project is legitimately in", () => {
    it("drops an uninitialized Hardhat 3 runtime environment", () => {
      assert.isFalse(
        sentryEventFilter(eventWith("Error", "hre not initialized"))
      );
    });

    it("drops missing dependencies", () => {
      assert.isFalse(
        sentryEventFilter(eventWith("Error", "Cannot find module 'hardhat'"))
      );
      assert.isFalse(
        sentryEventFilter(
          eventWith("Error", "Cannot find package '@oz/contracts'")
        )
      );
    });
  });

  describe("excludes failures that are not ours", () => {
    it("drops a withdrawn request", () => {
      assert.isFalse(sentryEventFilter(eventWith("Error", "Canceled")));
    });

    it("drops a client that has gone away", () => {
      assert.isFalse(
        sentryEventFilter(eventWith("Error", "Client is not running"))
      );
      assert.isFalse(
        sentryEventFilter(eventWith("Error", "Timeout awaiting 'request'"))
      );
    });
  });

  it("matches on the type as well as the message", () => {
    assert.isFalse(sentryEventFilter(eventWith("Canceled", "")));
  });

  // The old filter required `type === "Error"` exactly, so a subclass carrying
  // an excluded message was reported anyway.
  it("matches an Error subclass", () => {
    assert.isFalse(
      sentryEventFilter(eventWith("HardhatError", "hre not initialized"))
    );
  });

  // A global regular expression keeps `lastIndex` between calls to `test`.
  it("gives the same answer twice", () => {
    const event = eventWith("Error", "Canceled");

    assert.isFalse(sentryEventFilter(event));
    assert.isFalse(sentryEventFilter(event));
  });

  // Any matching exception drops the whole event, linked causes included.
  // That is how the filter has always worked; worth knowing about, because a
  // real bug whose `cause` happens to be noise would go unreported.
  it("drops the event when any of its exceptions matches", () => {
    const event: Event = {
      exception: {
        values: [
          { type: "Error", value: "Canceled" },
          { type: "TypeError", value: "a real bug" },
        ],
      },
    };

    assert.isFalse(sentryEventFilter(event));
  });
});
