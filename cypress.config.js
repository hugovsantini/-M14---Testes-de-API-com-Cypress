// cypress.config.js
const { defineConfig } = require("cypress");

module.exports = defineConfig({
e2e: {
  supportFile: 'cypress/support/e2e.js',
  baseUrl: 'http://localhost:3000',
},
});
