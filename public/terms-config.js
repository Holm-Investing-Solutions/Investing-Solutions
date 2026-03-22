(function attachTermsConfig(globalScope) {
  const termsConfig = {
    CURRENT_TERMS_VERSION: "1.12",
    LAST_UPDATED: "March 22, 2026",
    TERMS_CONTENT_PATH: "terms-content.html?v=1.12",
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = termsConfig;
  }

  globalScope.HOLM_TERMS_CONFIG = termsConfig;
})(typeof globalThis !== "undefined" ? globalThis : window);
