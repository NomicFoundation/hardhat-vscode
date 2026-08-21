// Node 22.18 and later strip type annotations from `.ts` files before
// `ts-node` sees them, which leaves ts-node compiling annotation-free source
// and reporting spurious implicit-any errors. Turn stripping off where it is
// on by default; older versions do not know the flag.
const [nodeMajor, nodeMinor] = process.versions.node.split(".").map(Number);
const stripsTypesByDefault =
  nodeMajor > 22 || (nodeMajor === 22 && nodeMinor >= 18);

module.exports = {
  file: ["./test/setup.ts"],
  require: "ts-node/register",
  spec: "test/**/*.ts",
  timeout: 5000,
  exit: true,
  ...(stripsTypesByDefault
    ? { "node-option": ["no-experimental-strip-types"] }
    : {}),
};
