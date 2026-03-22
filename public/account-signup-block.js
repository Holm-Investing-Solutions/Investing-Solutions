(() => {
  const PENDING_SIGNUP_KEY = "pendingSignupData";
  const DISALLOWED_SIGNUP_PAGES = new Set([
    "accept-terms",
    "auth",
    "login",
    "register",
    "dashboard",
    "account",
    "admin",
  ]);

  function normalizePageName(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getCurrentPageName() {
    const pathname = normalizePageName(window.location.pathname);

    if (pathname.endsWith("/privacy.html") || pathname === "/privacy") {
      return "privacy";
    }

    if (pathname.endsWith("/terms.html") || pathname === "/terms") {
      return "terms";
    }

    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      return "dashboard";
    }

    const pageParam = normalizePageName(new URLSearchParams(window.location.search).get("page"));
    if (pageParam) {
      return pageParam;
    }

    return "home";
  }

  function shouldDisplaySignupBlock({ isAuthenticated, currentPage, authKnown }) {
    if (!authKnown) {
      return false;
    }

    if (isAuthenticated) {
      return false;
    }

    const normalizedPage = normalizePageName(currentPage);
    if (DISALLOWED_SIGNUP_PAGES.has(normalizedPage)) {
      return false;
    }

    return true;
  }

  function updateVisibility({
    isAuthenticated = false,
    currentPage,
    authKnown = false,
  } = {}) {
    const containers = document.querySelectorAll("[data-account-signup-mount]");
    const pageName = normalizePageName(currentPage) || getCurrentPageName();
    const shouldShow = shouldDisplaySignupBlock({
      isAuthenticated,
      currentPage: pageName,
      authKnown,
    });

    containers.forEach((container) => {
      container.classList.toggle("hidden", !shouldShow);
    });
  }

  async function resolveAuthSessionState() {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "same-origin",
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return Boolean(result?.email);
    } catch {
      return false;
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
  }

  function validatePasswordStrength(password) {
    const value = String(password || "");
    const hasLength = value.length >= 8;
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);

    if (hasLength && hasUpper && hasLower && hasNumber) {
      return { ok: true, message: "" };
    }

    return {
      ok: false,
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, and a number.",
    };
  }

  function createPasswordIconMarkup() {
    return `
      <span class="leftIcon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <rect x="5" y="10" width="14" height="10" rx="2" ry="2"></rect>
          <path d="M8 10V7a4 4 0 0 1 8 0v3"></path>
        </svg>
      </span>
    `;
  }

  function createEmailIconMarkup() {
    return `
      <span class="leftIcon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect>
          <path d="M4 7l8 6 8-6"></path>
        </svg>
      </span>
    `;
  }

  function createEyeButtonMarkup(buttonClass) {
    return `
      <button type="button" class="iconBtn ${buttonClass}" aria-label="Show password">
        <svg class="eyeOpen" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        <svg class="eyeClosed hidden" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"></path>
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M4 20L20 4"></path>
        </svg>
      </button>
    `;
  }

  function mountSignupBlock(container) {
    if (!container || container.dataset.accountSignupMounted === "true") {
      return;
    }

    container.innerHTML = `
      <section class="accountSignupBlockSection" aria-label="Create your free account">
        <div class="accountSignupInner">
          <h2 class="accountSignupTitle">Create Your Free Account</h2>
          <p class="accountSignupSubtitle">
            Create a free account to access investment tools, stock insights, and future premium features.
          </p>

          <form class="accountSignupForm stack" novalidate>
            <label>
              Name
              <input type="text" class="accountSignupName" minlength="2" required />
            </label>

            <label>
              Email
              <div class="inputWithIcon">
                ${createEmailIconMarkup()}
                <input type="email" class="accountSignupEmail" placeholder="you@gmail.com" required />
              </div>
            </label>

            <label>
              Password
              <div class="inputWithIcon">
                ${createPasswordIconMarkup()}
                <input type="password" class="accountSignupPassword" minlength="8" required />
                ${createEyeButtonMarkup("accountSignupPasswordToggle")}
              </div>
            </label>

            <label>
              Retype Password
              <div class="inputWithIcon">
                ${createPasswordIconMarkup()}
                <input type="password" class="accountSignupRetype" minlength="8" required />
                ${createEyeButtonMarkup("accountSignupRetypeToggle")}
              </div>
            </label>

            <p class="accountSignupMessage muted" aria-live="polite"></p>

            <div class="buttonRow accountSignupActions">
              <button type="submit" class="accountSignupSubmit">Create Free Account</button>
            </div>
          </form>
        </div>
      </section>
    `;

    const form = container.querySelector(".accountSignupForm");
    const nameInput = container.querySelector(".accountSignupName");
    const emailInput = container.querySelector(".accountSignupEmail");
    const passwordInput = container.querySelector(".accountSignupPassword");
    const retypeInput = container.querySelector(".accountSignupRetype");
    const passwordToggleButton = container.querySelector(".accountSignupPasswordToggle");
    const retypeToggleButton = container.querySelector(".accountSignupRetypeToggle");
    const feedback = container.querySelector(".accountSignupMessage");

    const setFeedback = (text, isError = true) => {
      feedback.textContent = String(text || "").trim();
      feedback.classList.remove("accountSignupError", "accountSignupSuccess");
      if (!feedback.textContent) {
        return;
      }
      feedback.classList.add(isError ? "accountSignupError" : "accountSignupSuccess");
    };

    const bindPasswordToggle = (toggleButton, inputElement) => {
      if (!toggleButton || !inputElement) {
        return;
      }

      toggleButton.addEventListener("click", () => {
        const currentlyVisible = inputElement.type === "text";
        inputElement.type = currentlyVisible ? "password" : "text";
        const openIcon = toggleButton.querySelector(".eyeOpen");
        const closedIcon = toggleButton.querySelector(".eyeClosed");
        openIcon?.classList.toggle("hidden", !currentlyVisible);
        closedIcon?.classList.toggle("hidden", currentlyVisible);
        toggleButton.setAttribute("aria-label", currentlyVisible ? "Show password" : "Hide password");
      });
    };

    bindPasswordToggle(passwordToggleButton, passwordInput);
    bindPasswordToggle(retypeToggleButton, retypeInput);

    form?.addEventListener("submit", (event) => {
      event.preventDefault();

      const name = String(nameInput?.value || "").trim();
      const email = String(emailInput?.value || "").trim().toLowerCase();
      const password = String(passwordInput?.value || "");
      const retypePassword = String(retypeInput?.value || "");

      if (!name || !email || !password || !retypePassword) {
        setFeedback("Please fill out all fields.");
        return;
      }

      if (!isValidEmail(email)) {
        setFeedback("Please enter a valid email address.");
        return;
      }

      const strength = validatePasswordStrength(password);
      if (!strength.ok) {
        setFeedback(strength.message);
        return;
      }

      if (password !== retypePassword) {
        setFeedback("Passwords do not match.");
        return;
      }

      sessionStorage.setItem(
        PENDING_SIGNUP_KEY,
        JSON.stringify({
          name,
          email,
          password,
          retypePasswordValid: true,
          createdAt: new Date().toISOString(),
        })
      );

      setFeedback("Redirecting to Terms of Service...", false);
      window.location.href = "index.html?page=accept-terms";
    });

    container.dataset.accountSignupMounted = "true";
  }

  function mountAll() {
    const containers = document.querySelectorAll("[data-account-signup-mount]");
    containers.forEach((container) => {
      container.classList.add("hidden");
      mountSignupBlock(container);
    });
  }

  window.AccountSignupBlock = {
    mountAll,
    mountSignupBlock,
    shouldDisplaySignupBlock,
    updateVisibility,
    getCurrentPageName,
    resolveAuthSessionState,
    pendingSignupKey: PENDING_SIGNUP_KEY,
    validatePasswordStrength,
  };

  async function initializeVisibility() {
    const isAuthenticated = await resolveAuthSessionState();
    updateVisibility({
      isAuthenticated,
      currentPage: getCurrentPageName(),
      authKnown: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      mountAll();
      initializeVisibility();
    });
  } else {
    mountAll();
    initializeVisibility();
  }
})();
