/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [`../.eslintrc.js`],
  parserOptions: {
    project: `${__dirname}/tsconfig.json`,
    sourceType: "module",
  },
  overrides: [
    {
      files: ["**/*.ts"],
      rules: {
        "@typescript-eslint/no-unused-vars": "warn",
        "@typescript-eslint/no-empty-function": "warn",
      },
    },
  ],
};
