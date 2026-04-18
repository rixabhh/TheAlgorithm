export default [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        atob: "readonly",
        btoa: "readonly",
        fetch: "readonly",
        AbortController: "readonly",
        URL: "readonly",
        alert: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        // Project globals (External libraries)
        Chart: "readonly",
        html2canvas: "readonly",
        // Project globals (Shared classes)
        AnalyticsEngine: "readonly",
        ChatParser: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "vars": "all", "args": "none" }],
      "no-empty": ["error", { "allowEmptyCatch": true }],
      "no-console": "off",
      "no-undef": "error",
      "no-useless-escape": "warn"
    }
  }
];
