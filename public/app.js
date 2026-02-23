const homePage = document.getElementById("homePage");
const whatIsInvestingPage = document.getElementById("whatIsInvestingPage");
const investingInStocksPage = document.getElementById("investingInStocksPage");
const howToStartInvestingPage = document.getElementById("howToStartInvestingPage");
const stocksPage = document.getElementById("stocksPage");
const stockDetailPage = document.getElementById("stockDetailPage");
const adminPage = document.getElementById("adminPage");
const marketCountdown = document.getElementById("marketCountdown");
const authPanel = document.getElementById("authPanel");
const termsAcceptancePage = document.getElementById("termsAcceptancePage");
const homeNavBtn = document.getElementById("homeNavBtn");
const whatIsInvestingNavBtn = document.getElementById("whatIsInvestingNavBtn");
const investingInStocksNavBtn = document.getElementById("investingInStocksNavBtn");
const howToStartInvestingNavBtn = document.getElementById("howToStartInvestingNavBtn");
const stocksNavBtn = document.getElementById("stocksNavBtn");
const adminNavBtn = document.getElementById("adminNavBtn");
const authActionBtn = document.getElementById("authActionBtn");
const authTitle = document.getElementById("authTitle");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const switchAuthModeBtn = document.getElementById("switchAuthModeBtn");
const authSwitchText = document.getElementById("authSwitchText");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const confirmPasswordRow = document.getElementById("confirmPasswordRow");
const registerTermsSection = document.getElementById("registerTermsSection");
const agreeTermsInput = document.getElementById("agreeTerms");
const acceptUpdatedTermsInput = document.getElementById("acceptUpdatedTerms");
const acceptTermsBtn = document.getElementById("acceptTermsBtn");
const passwordVisibilityBtn = document.getElementById("passwordVisibilityBtn");
const passwordEyeOpenIcon = passwordVisibilityBtn.querySelector(".eyeOpen");
const passwordEyeClosedIcon = passwordVisibilityBtn.querySelector(".eyeClosed");
const stockList = document.getElementById("stockList");
const stockFilterBar = document.getElementById("stockFilterBar");
const stockFilterType = document.getElementById("stockFilterType");
const stockFilterValue = document.getElementById("stockFilterValue");
const stockSectorFilter = document.getElementById("stockSectorFilter");
const applyStockFilterBtn = document.getElementById("applyStockFilterBtn");
const clearStockFilterBtn = document.getElementById("clearStockFilterBtn");
const currentRecsTabBtn = document.getElementById("currentRecsTabBtn");
const pastRecsTabBtn = document.getElementById("pastRecsTabBtn");
const welcomeText = document.getElementById("welcomeText");
const stocksLockedMessage = document.getElementById("stocksLockedMessage");
const pastStockList = document.getElementById("pastStockList");
const stockDetailTitle = document.getElementById("stockDetailTitle");
const stockDetailMeta = document.getElementById("stockDetailMeta");
const stockDetailRationale = document.getElementById("stockDetailRationale");
const stockRangeHighValue = document.getElementById("stockRangeHighValue");
const stockRangeHighDate = document.getElementById("stockRangeHighDate");
const stockRangeLowValue = document.getElementById("stockRangeLowValue");
const stockRangeLowDate = document.getElementById("stockRangeLowDate");
const stockRangeChangeValue = document.getElementById("stockRangeChangeValue");
const stockRangeChangeMeta = document.getElementById("stockRangeChangeMeta");
const stockDetailBackBtn = document.getElementById("stockDetailBackBtn");
const stockRangeSelect = document.getElementById("stockRangeSelect");
const customRangeControls = document.getElementById("customRangeControls");
const customStartDate = document.getElementById("customStartDate");
const customEndDate = document.getElementById("customEndDate");
const applyCustomRangeBtn = document.getElementById("applyCustomRangeBtn");
const stockHistoryCanvas = document.getElementById("stockHistoryCanvas");
const stockGraphTooltip = document.getElementById("stockGraphTooltip");
const stockHistoryList = document.getElementById("stockHistoryList");
const stockHistorySection = document.getElementById("stockHistorySection");
const toggleHistoryBtn = document.getElementById("toggleHistoryBtn");
const investmentMode = document.getElementById("investmentMode");
const investmentAmountLabel = document.getElementById("investmentAmountLabel");
const investmentAmount = document.getElementById("investmentAmount");
const investmentSharesLabel = document.getElementById("investmentSharesLabel");
const investmentShares = document.getElementById("investmentShares");
const investmentDatePicker = document.getElementById("investmentDatePicker");
const calculateInvestmentBtn = document.getElementById("calculateInvestmentBtn");
const investmentResult = document.getElementById("investmentResult");
const investmentOutcomeBox = document.getElementById("investmentOutcomeBox");
const investmentPurchasePrice = document.getElementById("investmentPurchasePrice");
const investmentCurrentPrice = document.getElementById("investmentCurrentPrice");
const investmentCurrentValue = document.getElementById("investmentCurrentValue");
const investmentGainLoss = document.getElementById("investmentGainLoss");
const marketCountdownValue = document.getElementById("marketCountdownValue");
const marketCountdownMeta = document.getElementById("marketCountdownMeta");
const adminForm = document.getElementById("adminForm");
const adminRecommendationId = document.getElementById("adminRecommendationId");
const adminTicker = document.getElementById("adminTicker");
const adminCompany = document.getElementById("adminCompany");
const adminAction = document.getElementById("adminAction");
const adminSector = document.getElementById("adminSector");
const adminRationale = document.getElementById("adminRationale");
const adminSaveBtn = document.getElementById("adminSaveBtn");
const adminResetBtn = document.getElementById("adminResetBtn");
const adminStocksTabBtn = document.getElementById("adminStocksTabBtn");
const adminUsersTabBtn = document.getElementById("adminUsersTabBtn");
const adminStocksSection = document.getElementById("adminStocksSection");
const adminUsersSection = document.getElementById("adminUsersSection");
const adminList = document.getElementById("adminList");
const adminPastList = document.getElementById("adminPastList");
const adminUsersList = document.getElementById("adminUsersList");
const footerPageLinks = document.querySelectorAll("[data-footer-page]");
const message = document.getElementById("message");
const mainContainer = document.querySelector("main.container");

let currentUser = null;
let currentStock = null;
let currentStockHistory = [];
let currentRange = "6mo";
let authMode = "login";
let graphPoints = [];
let graphArea = null;
let allRecommendations = [];
let stocksTabView = "current";

const TERMS_VERSION = "1.1";

const SECTOR_OPTIONS = [
  "Communication Services",
  "Consumer Discretionary",
  "Consumer Staples",
  "Energy",
  "Financials",
  "Health Care",
  "Industrials",
  "Information Technology",
  "Materials",
  "Real Estate",
  "Utilities",
];

function normalizeSectorName(sector) {
  const value = String(sector || "").trim();
  if (!value) {
    return "Information Technology";
  }

  const lowerValue = value.toLowerCase();
  if (lowerValue === "technology") {
    return "Information Technology";
  }
  if (lowerValue === "healthcare") {
    return "Health Care";
  }

  const matched = SECTOR_OPTIONS.find((option) => option.toLowerCase() === lowerValue);
  return matched || "Information Technology";
}

function setSectorDropdownOptions() {
  stockSectorFilter.innerHTML = '<option value="all">All Sectors</option>';
  for (const sector of SECTOR_OPTIONS) {
    const option = document.createElement("option");
    option.value = sector;
    option.textContent = sector;
    stockSectorFilter.appendChild(option);
  }
}

function getInitialPageFromUrl() {
  const page = new URLSearchParams(window.location.search).get("page");
  const allowedPages = new Set([
    "home",
    "whatIsInvesting",
    "investingInStocks",
    "howToStartInvesting",
    "stocks",
    "admin",
    "auth",
  ]);

  return allowedPages.has(page) ? page : "home";
}

function setMessage(text, isError = true) {
  message.style.color = "#000000";
  message.textContent = text;
}

function toMidnightTime(value) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function getBusinessDaysBetween(startValue, endValue = new Date()) {
  const startTime = toMidnightTime(startValue);
  const endTime = toMidnightTime(endValue);
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
    return 0;
  }

  let businessDays = 0;
  let cursor = new Date(startTime);
  cursor.setDate(cursor.getDate() + 1);

  while (cursor.getTime() <= endTime) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      businessDays += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return businessDays;
}

function isPastRecommendation(stock) {
  return String(stock.action || "").toUpperCase() === "SELL" && getBusinessDaysBetween(stock.updatedAt) >= 5;
}

function setStocksTab(view) {
  stocksTabView = view === "past" ? "past" : "current";
  const showingPast = stocksTabView === "past";
  stockList.classList.toggle("hidden", showingPast);
  pastStockList.classList.toggle("hidden", !showingPast);
  stockFilterBar.classList.toggle("hidden", !currentUser || showingPast);
  currentRecsTabBtn.classList.toggle("activeTab", !showingPast);
  pastRecsTabBtn.classList.toggle("activeTab", showingPast);
  currentRecsTabBtn.setAttribute("aria-selected", showingPast ? "false" : "true");
  pastRecsTabBtn.setAttribute("aria-selected", showingPast ? "true" : "false");
}

function showPage(page) {
  homePage.classList.toggle("hidden", page !== "home");
  whatIsInvestingPage.classList.toggle("hidden", page !== "whatIsInvesting");
  investingInStocksPage.classList.toggle("hidden", page !== "investingInStocks");
  howToStartInvestingPage.classList.toggle("hidden", page !== "howToStartInvesting");
  stocksPage.classList.toggle("hidden", page !== "stocks");
  stockDetailPage.classList.toggle("hidden", page !== "stockDetail");
  adminPage.classList.toggle("hidden", page !== "admin");
  authPanel.classList.toggle("hidden", page !== "auth");
  termsAcceptancePage.classList.toggle("hidden", page !== "termsAcceptance");
  marketCountdown.classList.toggle("hidden", page !== "home");
  mainContainer.classList.toggle("authWide", page === "auth");
  mainContainer.classList.toggle("stocksWide", page === "stocks" || page === "stockDetail");

  const onStocksPage = page === "stocks" || page === "stockDetail";
  const navButtons = [
    homeNavBtn,
    whatIsInvestingNavBtn,
    investingInStocksNavBtn,
    howToStartInvestingNavBtn,
    stocksNavBtn,
    adminNavBtn,
  ];

  navButtons.forEach((button) => {
    button.classList.remove("activePage");
    button.removeAttribute("aria-current");
  });

  if (page === "home") {
    homeNavBtn.classList.add("activePage");
    homeNavBtn.setAttribute("aria-current", "page");
  } else if (page === "whatIsInvesting") {
    whatIsInvestingNavBtn.classList.add("activePage");
    whatIsInvestingNavBtn.setAttribute("aria-current", "page");
  } else if (page === "investingInStocks") {
    investingInStocksNavBtn.classList.add("activePage");
    investingInStocksNavBtn.setAttribute("aria-current", "page");
  } else if (page === "howToStartInvesting") {
    howToStartInvestingNavBtn.classList.add("activePage");
    howToStartInvestingNavBtn.setAttribute("aria-current", "page");
  } else if (onStocksPage) {
    stocksNavBtn.classList.add("activePage");
    stocksNavBtn.setAttribute("aria-current", "page");
  } else if (page === "admin") {
    adminNavBtn.classList.add("activePage");
    adminNavBtn.setAttribute("aria-current", "page");
  }
}

function setLoggedInUi(user) {
  currentUser = user;
  authActionBtn.textContent = "Sign Out";
  welcomeText.textContent = `Welcome, ${user.name} (${user.email})`;
  setStocksTab(stocksTabView);
  stocksLockedMessage.classList.add("hidden");
  adminNavBtn.classList.toggle("hidden", !user.isAdmin || Boolean(user.mustAcceptTerms));
}

function setAuthMode(mode) {
  authMode = mode === "register" ? "register" : "login";
  const isRegister = authMode === "register";

  authTitle.textContent = isRegister ? "Create Account" : "Welcome Back";
  authSubmitBtn.textContent = isRegister ? "Register" : "Log In";
  confirmPasswordRow.classList.toggle("hidden", !isRegister);
  confirmPasswordInput.required = isRegister;
  registerTermsSection.classList.toggle("hidden", !isRegister);
  agreeTermsInput.required = isRegister;
  if (!isRegister) {
    agreeTermsInput.checked = false;
  }
  authSwitchText.textContent = isRegister ? "Already have an account?" : "Don't have an account?";
  switchAuthModeBtn.textContent = isRegister ? "Log In" : "Register";
}

function setLoggedOutUi() {
  currentUser = null;
  authActionBtn.textContent = "Register/Log In";
  stockList.innerHTML = "";
  pastStockList.innerHTML = "";
  allRecommendations = [];
  adminList.innerHTML = "";
  adminPastList.innerHTML = "";
  adminUsersList.innerHTML = "";
  stockHistoryList.innerHTML = "";
  stockDetailMeta.textContent = "";
  stockDetailRationale.textContent = "";
  stockRangeHighValue.textContent = "--";
  stockRangeHighDate.textContent = "";
  stockRangeLowValue.textContent = "--";
  stockRangeLowDate.textContent = "";
  stockRangeChangeValue.textContent = "--";
  stockRangeChangeMeta.textContent = "";
  investmentMode.value = "amount";
  investmentAmount.value = "";
  investmentShares.value = "";
  investmentDatePicker.value = "";
  investmentResult.textContent = "";
  investmentOutcomeBox.classList.add("hidden");
  investmentOutcomeBox.classList.remove("resultGain", "resultLoss");
  stockHistorySection.classList.add("hidden");
  toggleHistoryBtn.textContent = "Show Price History";
  welcomeText.textContent = "";
  stockFilterType.value = "name";
  stockFilterValue.value = "";
  stockSectorFilter.value = "all";
  setStocksTab("current");
  updateStockFilterInputMode();
  stocksLockedMessage.classList.remove("hidden");
  adminNavBtn.classList.add("hidden");
  passwordInput.value = "";
  confirmPasswordInput.value = "";
  agreeTermsInput.checked = false;
  acceptUpdatedTermsInput.checked = false;
  passwordInput.type = "password";
  confirmPasswordInput.type = "password";
  passwordEyeOpenIcon.classList.remove("hidden");
  passwordEyeClosedIcon.classList.add("hidden");
  passwordVisibilityBtn.setAttribute("aria-label", "Show password");
  setAuthMode("login");
  setAdminTab("stocks");
  showPage("home");
}

function requiresTermsAcceptance() {
  return Boolean(currentUser && currentUser.mustAcceptTerms);
}

function guardTermsAcceptance() {
  if (!requiresTermsAcceptance()) {
    return false;
  }

  showPage("termsAcceptance");
  setMessage("Please accept the latest Terms and Conditions to continue.");
  return true;
}

function setAdminTab(tab) {
  const showingStocks = tab !== "users";
  adminStocksSection.classList.toggle("hidden", !showingStocks);
  adminUsersSection.classList.toggle("hidden", showingStocks);

  adminStocksTabBtn.classList.toggle("activeTab", showingStocks);
  adminUsersTabBtn.classList.toggle("activeTab", !showingStocks);

  adminStocksTabBtn.setAttribute("aria-selected", showingStocks ? "true" : "false");
  adminUsersTabBtn.setAttribute("aria-selected", showingStocks ? "false" : "true");
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCountdown(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getNextMarketOpen() {
  const nowLocal = new Date();
  const nowEt = new Date(nowLocal.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const targetEt = new Date(nowEt);
  targetEt.setHours(9, 30, 0, 0);

  const isWeekend = nowEt.getDay() === 0 || nowEt.getDay() === 6;
  if (isWeekend || nowEt >= targetEt) {
    targetEt.setDate(targetEt.getDate() + 1);
    targetEt.setHours(9, 30, 0, 0);
  }

  while (targetEt.getDay() === 0 || targetEt.getDay() === 6) {
    targetEt.setDate(targetEt.getDate() + 1);
  }

  return {
    secondsUntilOpen: Math.max(0, Math.floor((targetEt.getTime() - nowEt.getTime()) / 1000)),
    targetEt,
  };
}

function startMarketCountdown() {
  const update = () => {
    const { secondsUntilOpen, targetEt } = getNextMarketOpen();
    marketCountdownValue.textContent = formatCountdown(secondsUntilOpen);
    marketCountdownMeta.textContent = `Next Open: ${targetEt.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })} ET`;
  };

  update();
  setInterval(update, 1000);
}

function formatHistoryTooltipDate(date) {
  return new Date(date).toLocaleDateString();
}

function formatHistoryAxisDate(date) {
  return new Date(date).toLocaleDateString();
}

function formatPercent(value) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function renderHistoryGraph(history) {
  const context = stockHistoryCanvas.getContext("2d");
  const devicePixelRatio = window.devicePixelRatio || 1;
  const displayWidth = Math.max(1, Math.round(stockHistoryCanvas.clientWidth));
  const displayHeight = Math.max(1, Math.round(stockHistoryCanvas.clientHeight));
  const renderWidth = Math.round(displayWidth * devicePixelRatio);
  const renderHeight = Math.round(displayHeight * devicePixelRatio);

  if (stockHistoryCanvas.width !== renderWidth || stockHistoryCanvas.height !== renderHeight) {
    stockHistoryCanvas.width = renderWidth;
    stockHistoryCanvas.height = renderHeight;
  }

  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

  const width = displayWidth;
  const height = displayHeight;
  const leftPadding = 68;
  const rightPadding = 28;
  const topPadding = 14;
  const bottomPadding = 36;

  context.clearRect(0, 0, width, height);
  graphPoints = [];
  graphArea = null;

  if (!history.length) {
    return;
  }

  const prices = history.map((point) => point.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const span = maxPrice - minPrice || 1;
  const graphWidth = width - leftPadding - rightPadding;
  const graphHeight = height - topPadding - bottomPadding;

  context.strokeStyle = "#334059";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(leftPadding, topPadding);
  context.lineTo(leftPadding, height - bottomPadding);
  context.lineTo(width - rightPadding, height - bottomPadding);
  context.stroke();

  context.strokeStyle = "#1d4ed8";
  context.lineWidth = 2.5;
  context.beginPath();
  history.forEach((point, index) => {
    const x = leftPadding + (index / Math.max(history.length - 1, 1)) * graphWidth;
    const y =
      height -
      bottomPadding -
      ((point.close - minPrice) / span) * graphHeight;

    graphPoints.push({ x, y, index });

    if (index === 0) {
      context.moveTo(x, y);
      return;
    }

    context.lineTo(x, y);
  });
  context.stroke();

  context.fillStyle = "#000000";
  context.font = "12px Inter, system-ui, sans-serif";
  context.textAlign = "right";
  context.fillText(formatPrice(maxPrice), leftPadding - 8, topPadding + 6);
  context.fillText(formatPrice(minPrice), leftPadding - 8, height - bottomPadding + 4);

  const tickCount = Math.min(5, history.length);
  for (let tick = 0; tick < tickCount; tick += 1) {
    const ratio = tickCount === 1 ? 0 : tick / (tickCount - 1);
    const pointIndex = Math.round(ratio * (history.length - 1));
    const tickPoint = graphPoints[pointIndex];
    const tickYStart = height - bottomPadding;

    context.beginPath();
    context.moveTo(tickPoint.x, tickYStart);
    context.lineTo(tickPoint.x, tickYStart + 5);
    context.strokeStyle = "#334059";
    context.lineWidth = 1;
    context.stroke();

    context.fillStyle = "#000000";
    if (tick === 0) {
      context.textAlign = "left";
    } else if (tick === tickCount - 1) {
      context.textAlign = "right";
    } else {
      context.textAlign = "center";
    }
    context.fillText(formatHistoryAxisDate(history[pointIndex].date), tickPoint.x, height - 8);
  }
  context.textAlign = "left";

  graphArea = {
    left: leftPadding,
    right: width - rightPadding,
    top: topPadding,
    bottom: height - bottomPadding,
  };
}

function drawHistoryHover(index) {
  if (!currentStockHistory.length || index < 0 || index >= currentStockHistory.length) {
    return;
  }

  renderHistoryGraph(currentStockHistory);

  const point = graphPoints[index];
  const context = stockHistoryCanvas.getContext("2d");

  context.strokeStyle = "#0f7b4b";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(point.x, graphArea.top);
  context.lineTo(point.x, graphArea.bottom);
  context.stroke();

  context.fillStyle = "#0f7b4b";
  context.beginPath();
  context.arc(point.x, point.y, 4, 0, Math.PI * 2);
  context.fill();

  const selected = currentStockHistory[index];
  stockGraphTooltip.innerHTML = `${formatPrice(selected.close)}<br>${formatHistoryTooltipDate(selected.date)}`;
  stockGraphTooltip.style.left = `${point.x}px`;
  stockGraphTooltip.style.top = `${point.y}px`;
  stockGraphTooltip.classList.remove("hidden");
}

function getHistoryIntervalDays(range) {
  const normalizedRange = String(range || "6mo").toLowerCase();
  if (normalizedRange === "1mo") {
    return 1;
  }
  if (normalizedRange === "3mo") {
    return 4;
  }
  if (normalizedRange === "6mo") {
    return 7;
  }
  if (normalizedRange === "1y") {
    return 14;
  }
  if (normalizedRange === "max") {
    return 30;
  }
  if (normalizedRange === "custom") {
    return 1;
  }
  return 7;
}

function sampleHistoryByRange(history, range) {
  if (!history.length) {
    return [];
  }

  const intervalDays = getHistoryIntervalDays(range);
  const sampled = [history[0]];
  let lastIncludedDate = new Date(history[0].date);

  for (let index = 1; index < history.length; index += 1) {
    const point = history[index];
    const pointDate = new Date(point.date);
    const daysSinceLast = (pointDate.getTime() - lastIncludedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLast >= intervalDays) {
      sampled.push(point);
      lastIncludedDate = pointDate;
    }
  }

  const lastPoint = history[history.length - 1];
  if (sampled[sampled.length - 1] !== lastPoint) {
    sampled.push(lastPoint);
  }

  return sampled;
}

function renderHistoryList(history, range) {
  stockHistoryList.innerHTML = "";

  const sampledHistory = sampleHistoryByRange(history, range);
  for (const point of sampledHistory.slice().reverse()) {
    const item = document.createElement("article");
    item.className = "stockCard";
    item.innerHTML = `
      <div class="headerRow">
        <strong>${new Date(point.date).toLocaleDateString()}</strong>
        <span class="pill hold">${formatPrice(point.close)}</span>
      </div>
    `;
    stockHistoryList.appendChild(item);
  }
}

function renderRangeHighLow(history) {
  if (!history.length) {
    stockRangeHighValue.textContent = "--";
    stockRangeHighDate.textContent = "";
    stockRangeLowValue.textContent = "--";
    stockRangeLowDate.textContent = "";
    stockRangeChangeValue.textContent = "--";
    stockRangeChangeValue.classList.remove("rangeChangePositive", "rangeChangeNegative");
    stockRangeChangeMeta.textContent = "";
    return;
  }

  let highPoint = history[0];
  let lowPoint = history[0];

  for (const point of history) {
    if (point.close > highPoint.close) {
      highPoint = point;
    }
    if (point.close < lowPoint.close) {
      lowPoint = point;
    }
  }

  stockRangeHighValue.textContent = formatPrice(highPoint.close);
  stockRangeHighDate.textContent = `Day: ${new Date(highPoint.date).toLocaleDateString()}`;

  stockRangeLowValue.textContent = formatPrice(lowPoint.close);
  stockRangeLowDate.textContent = `Day: ${new Date(lowPoint.date).toLocaleDateString()}`;

  const startPoint = history[0];
  const endPoint = history[history.length - 1];
  const changePercent = ((endPoint.close - startPoint.close) / startPoint.close) * 100;
  stockRangeChangeValue.textContent = formatPercent(changePercent);
  stockRangeChangeValue.classList.toggle("rangeChangePositive", changePercent >= 0);
  stockRangeChangeValue.classList.toggle("rangeChangeNegative", changePercent < 0);
  stockRangeChangeMeta.textContent = `${new Date(startPoint.date).toLocaleDateString()} → ${new Date(endPoint.date).toLocaleDateString()}`;
}

function setupInvestmentCalculator(history) {
  if (!history.length) {
    investmentDatePicker.min = "";
    investmentDatePicker.max = "";
    investmentDatePicker.value = "";
    investmentResult.textContent = "";
    investmentOutcomeBox.classList.add("hidden");
    investmentOutcomeBox.classList.remove("resultGain", "resultLoss");
    return;
  }

  const firstDate = new Date(history[0].date);
  const lastDate = new Date(history[history.length - 1].date);
  const formatDate = (date) => date.toISOString().split("T")[0];

  const minDate = formatDate(firstDate);
  const maxDate = formatDate(lastDate);
  investmentDatePicker.min = minDate;
  investmentDatePicker.max = maxDate;

  if (!investmentDatePicker.value) {
    investmentDatePicker.value = minDate;
  }

  investmentResult.textContent = "";
  investmentOutcomeBox.classList.add("hidden");
  investmentOutcomeBox.classList.remove("resultGain", "resultLoss");
}

function setInvestmentModeUi() {
  const byAmount = investmentMode.value !== "shares";
  investmentAmountLabel.classList.toggle("hidden", !byAmount);
  investmentAmount.classList.toggle("hidden", !byAmount);
  investmentSharesLabel.classList.toggle("hidden", byAmount);
  investmentShares.classList.toggle("hidden", byAmount);
}

function findClosestHistoryPointByDate(history, selectedDateString) {
  const selectedDate = new Date(`${selectedDateString}T00:00:00`);
  if (Number.isNaN(selectedDate.getTime())) {
    return null;
  }

  let closest = history[0];
  let closestDistance = Math.abs(new Date(history[0].date).getTime() - selectedDate.getTime());

  for (const point of history) {
    const distance = Math.abs(new Date(point.date).getTime() - selectedDate.getTime());
    if (distance < closestDistance) {
      closest = point;
      closestDistance = distance;
    }
  }

  return closest;
}

function findExactHistoryPointByDate(history, selectedDateString) {
  return history.find((point) => {
    const date = new Date(point.date).toISOString().split("T")[0];
    return date === selectedDateString;
  }) || null;
}

function calculateInvestmentOutcome() {
  if (!currentStockHistory.length) {
    investmentResult.textContent = "No stock history loaded yet.";
    investmentOutcomeBox.classList.add("hidden");
    investmentOutcomeBox.classList.remove("resultGain", "resultLoss");
    return;
  }

  const byAmount = investmentMode.value !== "shares";
  const amount = Number(investmentAmount.value);
  const sharesInput = Number(investmentShares.value);
  const selectedDate = String(investmentDatePicker.value || "").trim();

  if (byAmount) {
    if (!Number.isFinite(amount) || amount <= 0) {
      investmentResult.textContent = "Enter a valid investment amount.";
      investmentOutcomeBox.classList.add("hidden");
      investmentOutcomeBox.classList.remove("resultGain", "resultLoss");
      return;
    }
  } else if (!Number.isFinite(sharesInput) || sharesInput <= 0) {
    investmentResult.textContent = "Enter a valid share amount.";
    investmentOutcomeBox.classList.add("hidden");
    investmentOutcomeBox.classList.remove("resultGain", "resultLoss");
    return;
  }

  if (!selectedDate) {
    investmentResult.textContent = "Choose a purchase date.";
    investmentOutcomeBox.classList.add("hidden");
    investmentOutcomeBox.classList.remove("resultGain", "resultLoss");
    return;
  }

  const exactEntryPoint = findExactHistoryPointByDate(currentStockHistory, selectedDate);
  const entryPoint = exactEntryPoint || findClosestHistoryPointByDate(currentStockHistory, selectedDate);
  if (!entryPoint) {
    investmentResult.textContent = "Could not find a valid price for the selected date.";
    investmentOutcomeBox.classList.add("hidden");
    investmentOutcomeBox.classList.remove("resultGain", "resultLoss");
    return;
  }

  const latestPoint = currentStockHistory[currentStockHistory.length - 1];
  const shares = byAmount ? amount / entryPoint.close : sharesInput;
  const investedAmount = byAmount ? amount : sharesInput * entryPoint.close;
  const currentValue = shares * latestPoint.close;
  const gainLoss = currentValue - investedAmount;
  const gainLossPercent = (gainLoss / Math.max(investedAmount, 0.000001)) * 100;

  const usedClosestDate = !exactEntryPoint;
  const selectedDateLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString();
  const usedDateLabel = new Date(entryPoint.date).toLocaleDateString();
  investmentResult.textContent = usedClosestDate
    ? `No exact close on ${selectedDateLabel}. Using closest trading day: ${usedDateLabel}.`
    : `Purchase date: ${usedDateLabel}`;
  investmentPurchasePrice.textContent = `${formatPrice(entryPoint.close)} per share`;
  investmentCurrentPrice.textContent = `${formatPrice(latestPoint.close)} per share`;
  investmentCurrentValue.textContent = `${formatPrice(currentValue)} (${shares.toFixed(4)} shares)`;
  investmentGainLoss.textContent = `${gainLoss >= 0 ? "+" : ""}${formatPrice(gainLoss)} (${formatPercent(gainLossPercent)})`;
  investmentOutcomeBox.classList.remove("hidden");
  investmentOutcomeBox.classList.toggle("resultGain", gainLoss >= 0);
  investmentOutcomeBox.classList.toggle("resultLoss", gainLoss < 0);
}

function getHistoryRequestQuery() {
  const range = stockRangeSelect.value || "6mo";
  if (range !== "custom") {
    return `range=${encodeURIComponent(range)}`;
  }

  const start = String(customStartDate.value || "").trim();
  const end = String(customEndDate.value || "").trim();
  if (!start || !end) {
    throw new Error("Select both start and end dates for custom range.");
  }

  return `range=custom&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
}

function updateHistoryToggleUi(range) {
  const isMaxRange = String(range).toLowerCase() === "max";
  toggleHistoryBtn.classList.toggle("hidden", isMaxRange);
  if (isMaxRange) {
    stockHistorySection.classList.add("hidden");
    toggleHistoryBtn.textContent = "Show Price History";
  }
}

function updateStockFilterInputMode() {
  const filterType = stockFilterType.value;
  const bySector = filterType === "sector";
  stockFilterValue.classList.toggle("hidden", bySector);
  stockSectorFilter.classList.toggle("hidden", !bySector);

  if (filterType === "name") {
    stockFilterValue.placeholder = "Enter name or ticker";
  } else if (filterType === "price") {
    stockFilterValue.placeholder = "Enter max closing price";
  }
}

function applyStockFilter(showValidationMessage = true) {
  const filterType = stockFilterType.value;
  const filterValue = stockFilterValue.value.trim();
  const selectedSector = stockSectorFilter.value;
  let filteredStocks = allRecommendations;

  if (filterType === "name" && filterValue) {
    const normalized = filterValue.toLowerCase();
    filteredStocks = filteredStocks.filter((stock) => {
      return (
        String(stock.ticker || "").toLowerCase().includes(normalized) ||
        String(stock.company || "").toLowerCase().includes(normalized)
      );
    });
  }

  if (filterType === "price" && filterValue) {
    const maxPrice = Number(filterValue);
    if (!Number.isFinite(maxPrice) || maxPrice <= 0) {
      if (showValidationMessage) {
        setMessage("Enter a valid number for stock price.");
      }
      return;
    }

    filteredStocks = filteredStocks.filter((stock) => {
      return typeof stock.latestClose === "number" && stock.latestClose <= maxPrice;
    });
  }

  if (filterType === "sector" && selectedSector && selectedSector !== "all") {
    filteredStocks = filteredStocks.filter((stock) => {
      return normalizeSectorName(stock.sector).toLowerCase() === selectedSector.toLowerCase();
    });
  }

  renderStocks(filteredStocks);
  setMessage("", false);
}

async function enrichRecommendations(stocks) {
  const enrichedStocks = await Promise.all(
    stocks.map(async (stock) => {
      try {
        const details = await api(`/api/stocks/${encodeURIComponent(stock.ticker)}/history?range=max`);
        const latest = details.history[details.history.length - 1];
        const recommendationDate = new Date(stock.updatedAt);
        const recommendationMs = recommendationDate.getTime();

        let entryPoint = null;
        if (Number.isFinite(recommendationMs)) {
          for (const point of details.history) {
            const pointMs = new Date(point.date).getTime();
            if (pointMs >= recommendationMs) {
              entryPoint = point;
              break;
            }
          }

          if (!entryPoint && details.history.length) {
            entryPoint = details.history[details.history.length - 1];
          }
        }

        const pickChangePercent =
          entryPoint && typeof entryPoint.close === "number" && entryPoint.close > 0
            ? ((latest.close - entryPoint.close) / entryPoint.close) * 100
            : null;
        const effectivePickChangePercent =
          stock.action === "SELL" && typeof stock.lockedChangePercent === "number"
            ? stock.lockedChangePercent
            : pickChangePercent;

        return {
          ...stock,
          latestClose: typeof latest?.close === "number" ? latest.close : null,
          currency: details.currency || "USD",
          pickChangePercent: effectivePickChangePercent,
        };
      } catch {
        return {
          ...stock,
          latestClose: null,
          currency: "USD",
          pickChangePercent: null,
        };
      }
    })
  );

  return enrichedStocks;
}

async function openStockDetails(ticker, company, rationale = "") {
  try {
    const range = stockRangeSelect.value || "6mo";
    currentRange = range;
    const query = getHistoryRequestQuery();
    const details = await api(`/api/stocks/${encodeURIComponent(ticker)}/history?${query}`);
    stockDetailTitle.textContent = `${ticker} — ${company}`;
    const latest = details.history[details.history.length - 1];
    stockDetailMeta.textContent = `Latest close: ${formatPrice(latest.close)} (${details.currency}) • Range: ${String(range).toUpperCase()}`;
    stockDetailRationale.textContent = rationale ? `Rationale: ${rationale}` : "";
    currentStock = { ticker, company, rationale };
    currentStockHistory = details.history;
    showPage("stockDetail");
    renderHistoryGraph(currentStockHistory);
    requestAnimationFrame(() => {
      if (currentStockHistory.length) {
        renderHistoryGraph(currentStockHistory);
      }
    });
    stockGraphTooltip.classList.add("hidden");
    renderRangeHighLow(details.history);
    setupInvestmentCalculator(details.history);
    renderHistoryList(details.history, range);
    updateHistoryToggleUi(range);
    if (String(range).toLowerCase() !== "max") {
      stockHistorySection.classList.add("hidden");
      toggleHistoryBtn.textContent = "Show Price History";
    }
    setMessage("", false);
  } catch (error) {
    setMessage(error.message);
  }
}

function renderStockCards(targetList, stocks, emptyMessage) {
  targetList.innerHTML = "";

  if (!stocks.length) {
    targetList.innerHTML = `<p>${emptyMessage}</p>`;
    return;
  }

  for (const stock of stocks) {
    const card = document.createElement("article");
    card.className = "stockCard clickableCard";
    const actionClass = stock.action === "BUY" ? "buy" : stock.action === "SELL" ? "sell" : "hold";
    const percentClass =
      typeof stock.pickChangePercent === "number"
        ? stock.pickChangePercent >= 0
          ? "changeUp"
          : "changeDown"
        : "changeNeutral";
    const percentText =
      typeof stock.pickChangePercent === "number" ? formatPercent(stock.pickChangePercent) : "--";

    card.innerHTML = `
      <div class="headerRow">
        <strong>${stock.ticker} — ${stock.company}</strong>
        <div class="stockCardBadges">
          <span class="pill ${actionClass}">${stock.action}</span>
          <span class="pill changePill ${percentClass}">${percentText}</span>
        </div>
      </div>
      <p>${stock.rationale}</p>
      <p class="muted">Sector: ${normalizeSectorName(stock.sector)} • Close: ${
        typeof stock.latestClose === "number" ? formatPrice(stock.latestClose) : "Unavailable"
      }</p>
      <p class="muted">Updated: ${new Date(stock.updatedAt).toLocaleDateString()}</p>
    `;
    card.addEventListener("click", () => openStockDetails(stock.ticker, stock.company, stock.rationale));
    targetList.appendChild(card);
  }
}

function renderStocks(stocks) {
  const currentStocks = stocks.filter((stock) => !isPastRecommendation(stock));
  const pastStocks = stocks.filter((stock) => isPastRecommendation(stock));
  renderStockCards(stockList, currentStocks, "No current recommendations available.");
  renderStockCards(pastStockList, pastStocks, "No past recommendations available.");
  setStocksTab(stocksTabView);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

async function loadAppData() {
  const user = await api("/api/auth/me");
  setLoggedInUi(user);
  if (user.mustAcceptTerms) {
    return { requiresTermsAcceptance: true };
  }
  const recs = await api("/api/recommendations");
  allRecommendations = await enrichRecommendations(recs.stocks);
  applyStockFilter(false);
  return { requiresTermsAcceptance: false };
}

function resetAdminForm() {
  adminRecommendationId.value = "";
  adminTicker.value = "";
  adminCompany.value = "";
  adminAction.value = "BUY";
  adminSector.value = "Information Technology";
  adminRationale.value = "";
}

function renderAdminList(stocks) {
  adminList.innerHTML = "";
  adminPastList.innerHTML = "";

  const currentStocks = stocks.filter((stock) => !isPastRecommendation(stock));
  const pastStocks = stocks.filter((stock) => isPastRecommendation(stock));

  if (!currentStocks.length) {
    adminList.innerHTML = "<p>No Stock Insights yet.</p>";
  }

  const stockMap = new Map(currentStocks.map((stock) => [Number(stock.id), stock]));

  for (const stock of currentStocks) {
    const card = document.createElement("article");
    card.className = "stockCard";
    const actionClass = stock.action === "BUY" ? "buy" : stock.action === "SELL" ? "sell" : "hold";

    card.innerHTML = `
      <div class="headerRow">
        <strong>${stock.ticker} — ${stock.company}</strong>
        <span class="pill ${actionClass}">${stock.action}</span>
      </div>
      <p class="muted">Sector: ${normalizeSectorName(stock.sector)}</p>
      <p>${stock.rationale}</p>
      <div class="buttonRow">
        <button type="button" class="secondary" data-edit-id="${stock.id}">Edit</button>
        <button type="button" data-delete-id="${stock.id}">Delete</button>
      </div>
    `;

    adminList.appendChild(card);
  }

  for (const editButton of adminList.querySelectorAll("[data-edit-id]")) {
    editButton.addEventListener("click", async () => {
      try {
        const id = Number(editButton.getAttribute("data-edit-id"));
        const selected = stockMap.get(id);
        if (!selected) {
          setMessage("Stock Insight not found.");
          return;
        }

        adminRecommendationId.value = String(selected.id);
        adminTicker.value = selected.ticker;
        adminCompany.value = selected.company;
        adminAction.value = selected.action;
        adminSector.value = normalizeSectorName(selected.sector);
        adminRationale.value = selected.rationale;
        setMessage("Loaded Stock Insight for editing.", false);
      } catch (error) {
        setMessage(error.message);
      }
    });
  }

  for (const deleteButton of adminList.querySelectorAll("[data-delete-id]")) {
    deleteButton.addEventListener("click", async () => {
      const id = Number(deleteButton.getAttribute("data-delete-id"));
      try {
        await api(`/api/admin/recommendations/${id}`, { method: "DELETE" });
        setMessage("Stock Insight deleted.", false);
        await loadAppData();
        await loadAdminData();
      } catch (error) {
        setMessage(error.message);
      }
    });
  }

  if (!pastStocks.length) {
    adminPastList.innerHTML = "<p>No past Stock Insights to delete.</p>";
    return;
  }

  for (const stock of pastStocks) {
    const card = document.createElement("article");
    card.className = "stockCard";
    card.innerHTML = `
      <div class="headerRow">
        <strong>${stock.ticker} — ${stock.company}</strong>
        <span class="pill sell">SELL</span>
      </div>
      <p class="muted">Sector: ${normalizeSectorName(stock.sector)}</p>
      <p>${stock.rationale}</p>
      <div class="buttonRow">
        <button type="button" data-delete-past-id="${stock.id}">Delete Past Stock Insight</button>
      </div>
    `;

    adminPastList.appendChild(card);
  }

  for (const deleteButton of adminPastList.querySelectorAll("[data-delete-past-id]")) {
    deleteButton.addEventListener("click", async () => {
      const id = Number(deleteButton.getAttribute("data-delete-past-id"));
      try {
        await api(`/api/admin/recommendations/${id}`, { method: "DELETE" });
        setMessage("Past Stock Insight deleted.", false);
        await loadAppData();
        await loadAdminData();
      } catch (error) {
        setMessage(error.message);
      }
    });
  }
}

function renderAdminUsers(users) {
  adminUsersList.innerHTML = "";

  if (!users.length) {
    adminUsersList.innerHTML = "<p>No registered users.</p>";
    return;
  }

  for (const user of users) {
    const card = document.createElement("article");
    card.className = "stockCard";
    const displayName = user.name || "(no name)";
    const isCurrentUser = currentUser && currentUser.email === user.email;
    const deleteDisabledAttr = isCurrentUser ? "disabled" : "";
    const deleteLabel = isCurrentUser ? "Current User" : "Delete User";

    card.innerHTML = `
      <strong>${displayName}</strong>
      <p class="muted">${user.email}</p>
      <p class="muted">Joined: ${new Date(user.createdAt).toLocaleDateString()}</p>
      <p class="muted">Terms Accepted: ${
        user.termsAcceptedAt ? new Date(user.termsAcceptedAt).toLocaleString() : "Not recorded"
      }</p>
      <p class="muted">Terms Version: ${user.termsVersionAccepted || "Not recorded"}</p>
      <div class="buttonRow">
        <button type="button" class="secondary" data-delete-user-id="${user.id}" ${deleteDisabledAttr}>${deleteLabel}</button>
      </div>
    `;

    adminUsersList.appendChild(card);
  }

  for (const deleteUserButton of adminUsersList.querySelectorAll("[data-delete-user-id]")) {
    deleteUserButton.addEventListener("click", async () => {
      const userId = Number(deleteUserButton.getAttribute("data-delete-user-id"));
      if (!Number.isInteger(userId) || userId <= 0) {
        return;
      }

      if (!window.confirm("Delete this user account?")) {
        return;
      }

      try {
        await api(`/api/admin/users/${userId}`, { method: "DELETE" });
        setMessage("User deleted.", false);
        await loadAdminData();
      } catch (error) {
        setMessage(error.message);
      }
    });
  }
}

async function loadAdminData() {
  if (!currentUser || !currentUser.isAdmin) {
    adminList.innerHTML = "";
    adminUsersList.innerHTML = "";
    return;
  }

  const [stockData, userData] = await Promise.all([
    api("/api/admin/recommendations"),
    api("/api/admin/users"),
  ]);
  renderAdminList(stockData.stocks);
  renderAdminUsers(userData.users);
}

async function handleAuth() {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (!name || !email || !password) {
    setMessage("Please enter name, email, and password.");
    return;
  }

  if (authMode === "register") {
    if (!confirmPassword) {
      setMessage("Please retype your password.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (!agreeTermsInput.checked) {
      setMessage("You must agree to the Terms and Conditions to register.");
      return;
    }
  }

  try {
    const payload = { name, email, password };
    if (authMode === "register") {
      payload.termsAccepted = true;
      payload.termsVersion = TERMS_VERSION;
    }

    const authResult = await api(`/api/auth/${authMode}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setMessage("Signed in successfully.", false);
    passwordInput.value = "";
    confirmPasswordInput.value = "";
    const appState = await loadAppData();

    if (authResult.mustAcceptTerms || appState.requiresTermsAcceptance) {
      acceptUpdatedTermsInput.checked = false;
      showPage("termsAcceptance");
      setMessage("Please accept the latest Terms and Conditions to continue.");
      return;
    }

    if (currentUser && currentUser.isAdmin) {
      showPage("admin");
      setAdminTab("stocks");
      await loadAdminData();
      setMessage("Signed in as admin. Welcome to Admin View.", false);
      return;
    }

    showPage("stocks");
  } catch (error) {
    setMessage(error.message);
  }
}

async function handleAcceptUpdatedTerms() {
  if (!currentUser) {
    setMessage("Please log in first.");
    showPage("auth");
    return;
  }

  if (!acceptUpdatedTermsInput.checked) {
    setMessage("Please check the box to accept Terms and Conditions.");
    return;
  }

  try {
    await api("/api/auth/accept-terms", {
      method: "POST",
      body: JSON.stringify({ termsAccepted: true, termsVersion: TERMS_VERSION }),
    });

    const appState = await loadAppData();
    if (appState.requiresTermsAcceptance) {
      setMessage("Unable to verify terms acceptance. Please try again.");
      return;
    }

    setMessage("Terms accepted. Welcome.", false);
    showPage("stocks");
  } catch (error) {
    setMessage(error.message);
  }
}

authSubmitBtn.addEventListener("click", () => {
  handleAuth();
});

acceptTermsBtn.addEventListener("click", () => {
  handleAcceptUpdatedTerms();
});

switchAuthModeBtn.addEventListener("click", () => {
  setAuthMode(authMode === "register" ? "login" : "register");
  confirmPasswordInput.value = "";
  setMessage("", false);
});

homeNavBtn.addEventListener("click", () => {
  if (guardTermsAcceptance()) {
    return;
  }
  showPage("home");
});

footerPageLinks.forEach((link) => {
  link.addEventListener("click", async (event) => {
    event.preventDefault();
    const page = link.dataset.footerPage;
    if (!page) {
      return;
    }

    if (guardTermsAcceptance()) {
      return;
    }

    if (page === "stocks" && currentUser) {
      showPage("stocks");
      try {
        await loadAppData();
      } catch {
        setLoggedOutUi();
      }
      return;
    }

    showPage(page);
  });
});

whatIsInvestingNavBtn.addEventListener("click", () => {
  if (guardTermsAcceptance()) {
    return;
  }
  showPage("whatIsInvesting");
});

investingInStocksNavBtn.addEventListener("click", () => {
  if (guardTermsAcceptance()) {
    return;
  }
  showPage("investingInStocks");
});

howToStartInvestingNavBtn.addEventListener("click", () => {
  if (guardTermsAcceptance()) {
    return;
  }
  showPage("howToStartInvesting");
});

passwordVisibilityBtn.addEventListener("click", () => {
  const showingPassword = passwordInput.type === "text";
  passwordInput.type = showingPassword ? "password" : "text";
  confirmPasswordInput.type = showingPassword ? "password" : "text";
  passwordEyeOpenIcon.classList.toggle("hidden", !showingPassword);
  passwordEyeClosedIcon.classList.toggle("hidden", showingPassword);
  passwordVisibilityBtn.setAttribute(
    "aria-label",
    showingPassword ? "Show password" : "Hide password"
  );
});

stocksNavBtn.addEventListener("click", async () => {
  if (guardTermsAcceptance()) {
    return;
  }
  showPage("stocks");
  if (currentUser) {
    try {
      await loadAppData();
    } catch {
      setLoggedOutUi();
    }
  }
});

stockDetailBackBtn.addEventListener("click", () => {
  showPage("stocks");
});

stockRangeSelect.addEventListener("change", async () => {
  if (!currentStock) {
    customRangeControls.classList.toggle("hidden", stockRangeSelect.value !== "custom");
    if (stockRangeSelect.value !== "custom") {
      setMessage("", false);
    }
    return;
  }

  customRangeControls.classList.toggle("hidden", stockRangeSelect.value !== "custom");
  if (stockRangeSelect.value === "custom") {
    updateHistoryToggleUi("custom");
    investmentResult.textContent = "";
    return;
  }

  setMessage("", false);

  await openStockDetails(currentStock.ticker, currentStock.company, currentStock.rationale);
});

applyCustomRangeBtn.addEventListener("click", async () => {
  if (!currentStock) {
    return;
  }
  await openStockDetails(currentStock.ticker, currentStock.company, currentStock.rationale);
});

calculateInvestmentBtn.addEventListener("click", () => {
  calculateInvestmentOutcome();
});

investmentDatePicker.addEventListener("change", () => {
  investmentResult.textContent = "";
  investmentOutcomeBox.classList.add("hidden");
  investmentOutcomeBox.classList.remove("resultGain", "resultLoss");
});

investmentMode.addEventListener("change", () => {
  setInvestmentModeUi();
  investmentResult.textContent = "";
  investmentOutcomeBox.classList.add("hidden");
  investmentOutcomeBox.classList.remove("resultGain", "resultLoss");
});

toggleHistoryBtn.addEventListener("click", () => {
  const isHidden = stockHistorySection.classList.contains("hidden");
  stockHistorySection.classList.toggle("hidden", !isHidden);
  toggleHistoryBtn.textContent = isHidden ? "Hide Price History" : "Show Price History";
});

stockHistoryCanvas.addEventListener("mousemove", (event) => {
  if (!currentStockHistory.length || !graphArea) {
    return;
  }

  const rect = stockHistoryCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;

  if (x < graphArea.left || x > graphArea.right) {
    stockGraphTooltip.classList.add("hidden");
    renderHistoryGraph(currentStockHistory);
    return;
  }

  const ratio = (x - graphArea.left) / Math.max(graphArea.right - graphArea.left, 1);
  const index = Math.round(ratio * (currentStockHistory.length - 1));
  drawHistoryHover(index);
});

stockHistoryCanvas.addEventListener("mouseleave", () => {
  stockGraphTooltip.classList.add("hidden");
  if (currentStockHistory.length) {
    renderHistoryGraph(currentStockHistory);
  }
});

window.addEventListener("resize", () => {
  if (currentStockHistory.length) {
    renderHistoryGraph(currentStockHistory);
  }
});

adminNavBtn.addEventListener("click", async () => {
  if (guardTermsAcceptance()) {
    return;
  }
  if (!currentUser || !currentUser.isAdmin) {
    setMessage("Admin access required.");
    return;
  }

  showPage("admin");
  setAdminTab("stocks");
  try {
    await loadAdminData();
  } catch (error) {
    setMessage(error.message);
  }
});

authActionBtn.addEventListener("click", async () => {
  if (!currentUser) {
    setAuthMode("login");
    setMessage("", false);
    showPage("auth");
    return;
  }

  try {
    await api("/api/auth/logout", { method: "POST" });
    setLoggedOutUi();
    setMessage("Signed out.", false);
  } catch (error) {
    setMessage(error.message);
  }
});

adminSaveBtn.addEventListener("click", async () => {
  if (!currentUser || !currentUser.isAdmin) {
    setMessage("Admin access required.");
    return;
  }

  const payload = {
    ticker: adminTicker.value.trim().toUpperCase(),
    company: adminCompany.value.trim(),
    action: adminAction.value,
    sector: normalizeSectorName(adminSector.value),
    rationale: adminRationale.value.trim(),
  };

  if (!payload.ticker || !payload.company || !payload.sector || !payload.rationale) {
    setMessage("Please complete all Stock Insight fields.");
    return;
  }

  try {
    const existingId = adminRecommendationId.value.trim();
    if (existingId) {
      await api(`/api/admin/recommendations/${existingId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setMessage("Stock Insight updated.", false);
    } else {
      await api("/api/admin/recommendations", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage("Stock Insight added.", false);
    }

    resetAdminForm();
    await loadAppData();
    await loadAdminData();
  } catch (error) {
    setMessage(error.message);
  }
});

adminResetBtn.addEventListener("click", () => {
  resetAdminForm();
  setMessage("Form cleared.", false);
});

adminStocksTabBtn.addEventListener("click", () => {
  setAdminTab("stocks");
});

adminUsersTabBtn.addEventListener("click", () => {
  setAdminTab("users");
});

adminForm.addEventListener("submit", (event) => {
  event.preventDefault();
  adminSaveBtn.click();
});

stockFilterType.addEventListener("change", () => {
  updateStockFilterInputMode();
  applyStockFilter(false);
});

applyStockFilterBtn.addEventListener("click", () => {
  applyStockFilter(true);
});

clearStockFilterBtn.addEventListener("click", () => {
  stockFilterType.value = "name";
  stockFilterValue.value = "";
  stockSectorFilter.value = "all";
  updateStockFilterInputMode();
  applyStockFilter(false);
});

currentRecsTabBtn.addEventListener("click", () => {
  setStocksTab("current");
});

pastRecsTabBtn.addEventListener("click", () => {
  setStocksTab("past");
});

(async () => {
  const initialPage = getInitialPageFromUrl();

  setSectorDropdownOptions();
  setInvestmentModeUi();
  resetAdminForm();
  startMarketCountdown();
  setAdminTab("stocks");
  showPage(initialPage === "admin" ? "home" : initialPage);
  try {
    const appState = await loadAppData();
    setMessage("", false);

    if (appState.requiresTermsAcceptance) {
      showPage("termsAcceptance");
      setMessage("Please accept the latest Terms and Conditions to continue.");
      return;
    }

    if (initialPage === "admin") {
      if (currentUser && currentUser.isAdmin) {
        showPage("admin");
        await loadAdminData();
      } else {
        showPage("home");
        setMessage("Admin access required.");
      }
      return;
    }

    if (initialPage === "auth" && currentUser) {
      showPage("home");
      return;
    }

    showPage(initialPage);
  } catch {
    setLoggedOutUi();

    if (initialPage === "auth" || initialPage === "stocks") {
      showPage(initialPage);
    } else if (
      initialPage === "whatIsInvesting" ||
      initialPage === "investingInStocks" ||
      initialPage === "howToStartInvesting"
    ) {
      showPage(initialPage);
    }
  }
})();
