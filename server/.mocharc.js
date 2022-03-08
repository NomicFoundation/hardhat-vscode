module.exports = {
  file: ["./test/setup.ts"],
  require: "ts-node/register",
  spec: "test/**/*.ts",
  timeout: 5000,
  exit: true,
};
