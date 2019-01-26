module.exports = {
  parserOptions: {
    ecmaVersion: 8,
  },
  env: {
    browser: true,
  },
  globals: {
    axios: true,
    GM_addStyle: true,
    GM_setValue: true,
    GM_getValue: true,
    $: true,
    _: true,
  },
  // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
  extends: 'standard',
  // add your custom rules here
  rules: {
    'semi': ['warn', 'always'],
    'no-unused-vars': 0,
  }
};
