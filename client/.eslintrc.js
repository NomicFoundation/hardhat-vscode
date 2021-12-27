/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [`../.eslintrc.js`],
  parserOptions: {
    project: `./tsconfig.json`,
    sourceType: "module",
  },
};
