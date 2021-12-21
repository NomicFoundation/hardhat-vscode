/**@type {import('eslint').Linter.Config} */
// eslint-disable-next-line no-undef
module.exports = {
	root: true,
	extends: [`../.eslintrc.js`],
  parserOptions: {
    project: `./tsconfig.json`,
    sourceType: "module"
  },
};
