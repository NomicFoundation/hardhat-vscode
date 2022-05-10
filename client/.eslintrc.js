/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [`../.eslintrc.js`],
  parserOptions: {
    project: `${__dirname}/tsconfig.json`,
    sourceType: "module",
  },
};
