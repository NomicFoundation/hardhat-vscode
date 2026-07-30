import { assert } from "chai";
import fs from "fs/promises";
import os from "os";
import path from "path";
import {
  onlyValidVersions,
  readHardhatCompilerVersions,
  readRememberedVersions,
  rememberVersions,
  resolveStorageDir,
} from "@services/initialization/solcVersionsCache";
import { setupMockLogger } from "../../helpers/setupMockLogger";

describe("solc versions cache", () => {
  let storageDir: string;
  const logger = setupMockLogger();

  beforeEach(async () => {
    storageDir = await fs.mkdtemp(path.join(os.tmpdir(), "solc-versions-"));
  });

  afterEach(async () => {
    await fs.rm(storageDir, { recursive: true, force: true });
  });

  describe("resolveStorageDir", () => {
    it("should prefer the editor-provided storage path", () => {
      assert.strictEqual(
        resolveStorageDir("/tmp/editor-storage"),
        "/tmp/editor-storage"
      );
    });

    it("should fall back to a per-user cache dir when not provided", () => {
      assert.notStrictEqual(resolveStorageDir(undefined), "");
      assert.notStrictEqual(resolveStorageDir("   "), "   ");
    });
  });

  describe("round trip", () => {
    it("should remember versions across reads", async () => {
      await rememberVersions(storageDir, ["0.8.28", "0.8.16"], logger);

      const remembered = await readRememberedVersions(storageDir, logger);

      // Sorted and deduped on write.
      assert.deepStrictEqual(remembered, ["0.8.16", "0.8.28"]);
    });

    it("should deduplicate on write", async () => {
      await rememberVersions(
        storageDir,
        ["0.8.28", "0.8.28", "0.8.16"],
        logger
      );

      assert.deepStrictEqual(await readRememberedVersions(storageDir, logger), [
        "0.8.16",
        "0.8.28",
      ]);
    });

    it("should leave no temporary file behind", async () => {
      await rememberVersions(storageDir, ["0.8.28"], logger);

      // Written via a temp file and renamed, so a reader in another window can
      // never observe a half-written file.
      assert.deepStrictEqual(await fs.readdir(storageDir), [
        "solc-versions.json",
      ]);
    });

    it("should create the storage directory if it is missing", async () => {
      const nested = path.join(storageDir, "does", "not", "exist");

      await rememberVersions(nested, ["0.8.28"], logger);

      assert.deepStrictEqual(await readRememberedVersions(nested, logger), [
        "0.8.28",
      ]);
    });
  });

  describe("reading a cache that isn't usable", () => {
    it("should return nothing when the file is absent", async () => {
      assert.deepStrictEqual(
        await readRememberedVersions(storageDir, logger),
        []
      );
    });

    it("should return nothing when the file is corrupt", async () => {
      await fs.writeFile(
        path.join(storageDir, "solc-versions.json"),
        "{not json",
        "utf8"
      );

      assert.deepStrictEqual(
        await readRememberedVersions(storageDir, logger),
        []
      );
    });

    it("should discard entries that aren't valid versions", async () => {
      await fs.writeFile(
        path.join(storageDir, "solc-versions.json"),
        JSON.stringify({ versions: ["0.8.28", "nonsense", 42, null] }),
        "utf8"
      );

      assert.deepStrictEqual(await readRememberedVersions(storageDir, logger), [
        "0.8.28",
      ]);
    });

    it("should tolerate a versions field of the wrong shape", async () => {
      await fs.writeFile(
        path.join(storageDir, "solc-versions.json"),
        JSON.stringify({ versions: "0.8.28" }),
        "utf8"
      );

      assert.deepStrictEqual(
        await readRememberedVersions(storageDir, logger),
        []
      );
    });
  });

  describe("persisting is best effort", () => {
    it("should not throw when the storage dir cannot be created", async () => {
      // A path under a regular file can never be created as a directory.
      const filePath = path.join(storageDir, "a-file");
      await fs.writeFile(filePath, "", "utf8");

      let threw = false;
      try {
        await rememberVersions(
          path.join(filePath, "nested"),
          ["0.8.28"],
          logger
        );
      } catch {
        threw = true;
      }

      assert.isFalse(threw, "persisting must never break validation");
    });
  });

  describe("onlyValidVersions", () => {
    it("should keep valid semver versions only", () => {
      assert.deepStrictEqual(
        onlyValidVersions(["0.8.28", "", "v", "0.8", "1.2.3"]),
        ["0.8.28", "1.2.3"]
      );
    });

    it("should return an empty list for non-arrays", () => {
      assert.deepStrictEqual(onlyValidVersions(undefined), []);
      assert.deepStrictEqual(onlyValidVersions("0.8.28"), []);
    });

    // semver.valid accepts these, but hardhat looks compilers up by exact
    // string match, so the un-normalized form would win maxSatisfying and then
    // resolve to no build at all.
    it("should normalize a leading v and surrounding whitespace", () => {
      assert.deepStrictEqual(onlyValidVersions(["v0.8.28", "  0.8.29  "]), [
        "0.8.28",
        "0.8.29",
      ]);
    });
  });

  describe("readHardhatCompilerVersions", () => {
    async function writeList(
      cacheRoot: string,
      generation: string,
      platform: string,
      builds: unknown[]
    ) {
      const dir = path.join(cacheRoot, generation, platform);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        path.join(dir, "list.json"),
        JSON.stringify({ builds }),
        "utf8"
      );
    }

    it("should read hardhat 2's compilers-v2 directory", async () => {
      await writeList(storageDir, "compilers-v2", "linux-amd64", [
        { version: "0.8.20" },
      ]);

      assert.deepStrictEqual(
        await readHardhatCompilerVersions(logger, storageDir),
        ["0.8.20"]
      );
    });

    // Hardhat 3 uses a different directory. Reading only v2 made this source a
    // silent no-op for anyone who has only ever used hardhat 3.
    it("should read hardhat 3's compilers-v3 directory", async () => {
      await writeList(storageDir, "compilers-v3", "wasm", [
        { version: "0.8.30" },
      ]);

      assert.deepStrictEqual(
        await readHardhatCompilerVersions(logger, storageDir),
        ["0.8.30"]
      );
    });

    it("should union both generations and all platforms", async () => {
      await writeList(storageDir, "compilers-v2", "linux-amd64", [
        { version: "0.8.20" },
      ]);
      await writeList(storageDir, "compilers-v3", "wasm", [
        { version: "0.8.30" },
      ]);
      await writeList(storageDir, "compilers-v3", "linux-amd64", [
        { version: "0.8.31" },
      ]);

      const versions = await readHardhatCompilerVersions(logger, storageDir);

      assert.sameMembers(versions, ["0.8.20", "0.8.30", "0.8.31"]);
    });

    it("should exclude pre-release builds", async () => {
      await writeList(storageDir, "compilers-v2", "linux-amd64", [
        { version: "0.8.30" },
        { version: "0.8.31", prerelease: "pre.1" },
      ]);

      assert.deepStrictEqual(
        await readHardhatCompilerVersions(logger, storageDir),
        ["0.8.30"]
      );
    });

    it("should return nothing when no hardhat cache exists", async () => {
      assert.deepStrictEqual(
        await readHardhatCompilerVersions(
          logger,
          path.join(storageDir, "absent")
        ),
        []
      );
    });
  });
});
