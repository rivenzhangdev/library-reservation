export default {
  "singleQuote": true,
  "semi": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "overrides": [
    {
      "files": "*.wxml",
      "options": { "parser": "html" }
    },
    {
      "files": "*.wxs",
      "options": { "parser": "babel" }
    }
  ],
  "plugins": ["prettier-plugin-rational-order"]
};