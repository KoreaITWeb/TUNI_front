module.exports = {
  // ...
  extends: [
    'plugin:vue/vue3-recommended',
    // 다른 익스텐드들 ...
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatuers: {
        globalReturn: false,
        impliedStrict: false,
        jsx: false,
    },
  },
  rules: {
    // 필요 규칙들
  },
}
