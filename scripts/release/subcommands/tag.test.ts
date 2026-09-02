import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { releaseNotes } from "./tag.ts";

const CHANGELOG = [
  "# Changelog",
  "",
  "## 0.9.0",
  "",
  "### Minor Changes",
  "",
  "- abc1234: Drop Node 20 support.",
  "",
  "## 0.8.29 - 2026-03-19",
  "",
  "### Changed",
  "",
  "- An older entry.",
  "",
].join("\n");

describe("releaseNotes", () => {
  it("takes the section for the version, without its heading", () => {
    assert.equal(
      releaseNotes(CHANGELOG, "0.9.0"),
      "### Minor Changes\n\n- abc1234: Drop Node 20 support.\n"
    );
  });

  it("stops at the next release rather than running to the end", () => {
    assert.doesNotMatch(releaseNotes(CHANGELOG, "0.9.0"), /older entry/);
  });

  it("takes a section whose heading still carries a date", () => {
    assert.equal(
      releaseNotes(CHANGELOG, "0.8.29"),
      "### Changed\n\n- An older entry.\n"
    );
  });

  it("throws when the version has no section", () => {
    assert.throws(
      () => releaseNotes(CHANGELOG, "9.9.9"),
      /no section for 9.9.9/
    );
  });
});
