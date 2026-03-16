const STORAGE_KEY = "monthmap-budget-state-v2";

const CATEGORY_CONFIG = [
  { key: "Housing", label: "Housing Budget", placeholder: "1400" },
  { key: "Food", label: "Food Budget", placeholder: "500" },
  { key: "Transport", label: "Transport Budget", placeholder: "240" },
  { key: "Bills", label: "Bills Budget", placeholder: "350" },
  { key: "Fun", label: "Fun Budget", placeholder: "280" },
  { key: "Savings", label: "Savings Goal", placeholder: "600" },
  { key: "Debt", label: "Debt Budget", placeholder: "700" },
  { key: "Health", label: "Health Budget", placeholder: "120" },
  { key: "Travel", label: "Travel Budget", placeholder: "120" },
  { key: "Other", label: "Other Budget", placeholder: "150" },
];

const SPENDING_CATEGORIES = CATEGORY_CONFIG
  .filter((category) => category.key !== "Savings")
  .map((category) => category.key);

const INCOME_CATEGORIES = ["Fixed Salary", "Extra Income", "Other"];
const SAVINGS_CATEGORIES = ["Emergency Fund", "General Savings", "Vacation Fund"];
const BUDGET_COLUMN_MAP = {
  Housing: "housing",
  Food: "food",
  Transport: "transport",
  Bills: "bills",
  Fun: "fun",
  Savings: "savings_goal",
  Debt: "debt",
  Health: "health",
  Travel: "travel",
  Other: "other",
};
const CHART_LABELS = {
  Housing: "Housing",
  Food: "Food",
  Transport: "Transit",
  Bills: "Bills",
  Fun: "Fun",
  Debt: "Debt",
  Health: "Health",
  Travel: "Travel",
  Other: "Other",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const sampleState = {
  month: "2026-03",
  budgets: {
    Housing: 1400,
    Food: 520,
    Transport: 240,
    Bills: 360,
    Fun: 280,
    Savings: 650,
    Debt: 700,
    Health: 120,
    Travel: 120,
    Other: 150,
  },
  incomes: [
    { id: 101, category: "Fixed Salary", title: "Bi-weekly pay", amount: 3500, date: "2026-03-01" },
    { id: 102, category: "Extra Income", title: "Freelance", amount: 400, date: "2026-03-08" },
  ],
  savingsActivities: [
    { id: 201, category: "Emergency Fund", title: "Automatic transfer", amount: 300, date: "2026-03-03" },
    { id: 202, category: "Vacation Fund", title: "Weekend trip fund", amount: 150, date: "2026-03-11" },
  ],
  expenses: [
    { id: 1, title: "Rent", amount: 1400, category: "Housing", date: "2026-03-01" },
    { id: 2, title: "Supermarket", amount: 300, category: "Food", date: "2026-03-05" },
    { id: 3, title: "Gas and tolls", amount: 300, category: "Transport", date: "2026-03-08" },
    { id: 4, title: "Course payment", amount: 300, category: "Other", date: "2026-03-10" },
    { id: 5, title: "Phone and gym", amount: 150, category: "Bills", date: "2026-03-11" },
    { id: 6, title: "Debt payment", amount: 700, category: "Debt", date: "2026-03-12" },
  ],
};

function createEmptyBudgets() {
  return Object.fromEntries(CATEGORY_CONFIG.map((category) => [category.key, 0]));
}

const state = {
  month: "",
  budgets: createEmptyBudgets(),
  incomes: [],
  expenses: [],
  savingsActivities: [],
  analysis: null,
  supabase: null,
  session: null,
  user: null,
  authMode: "login",
  budgetSaveTimer: null,
  editing: { type: null, id: null },
  feedbackTimer: null,
};

const els = {
  budgetForm: document.getElementById("budgetForm"),
  incomeForm: document.getElementById("incomeForm"),
  expenseForm: document.getElementById("expenseForm"),
  savingsForm: document.getElementById("savingsForm"),
  stepTabs: Array.from(document.querySelectorAll(".step-tab")),
  stepPanels: Array.from(document.querySelectorAll(".step-panel")),
  stepButtons: Array.from(document.querySelectorAll("[data-step-go]")),
  budgetFields: document.getElementById("budgetFields"),
  monthInput: document.getElementById("monthInput"),
  incomeCategory: document.getElementById("incomeCategory"),
  incomeName: document.getElementById("incomeName"),
  incomeAmount: document.getElementById("incomeAmount"),
  incomeDate: document.getElementById("incomeDate"),
  expenseName: document.getElementById("expenseName"),
  expenseAmount: document.getElementById("expenseAmount"),
  expenseCategory: document.getElementById("expenseCategory"),
  expenseDate: document.getElementById("expenseDate"),
  savingsName: document.getElementById("savingsName"),
  savingsAmount: document.getElementById("savingsAmount"),
  savingsCategory: document.getElementById("savingsCategory"),
  savingsDate: document.getElementById("savingsDate"),
  categoryList: document.getElementById("categoryList"),
  insightsList: document.getElementById("insightsList"),
  incomeList: document.getElementById("incomeList"),
  savingsList: document.getElementById("savingsList"),
  transactionList: document.getElementById("transactionList"),
  plannedTotal: document.getElementById("plannedTotal"),
  incomeTotal: document.getElementById("incomeTotal"),
  spentTotal: document.getElementById("spentTotal"),
  remainingTotal: document.getElementById("remainingTotal"),
  healthStatus: document.getElementById("healthStatus"),
  healthCopy: document.getElementById("healthCopy"),
  savingsGoalTotal: document.getElementById("savingsGoalTotal"),
  savedTotal: document.getElementById("savedTotal"),
  plannedCard: document.getElementById("plannedCard"),
  incomeCard: document.getElementById("incomeCard"),
  spentCard: document.getElementById("spentCard"),
  balanceCard: document.getElementById("balanceCard"),
  healthCard: document.getElementById("healthCard"),
  savingsGoalCard: document.getElementById("savingsGoalCard"),
  savedCard: document.getElementById("savedCard"),
  heroBudget: document.getElementById("heroBudget"),
  heroSpent: document.getElementById("heroSpent"),
  heroRemaining: document.getElementById("heroRemaining"),
  startPlanningBtn: document.getElementById("startPlanningBtn"),
  analyzeSpendingBtn: document.getElementById("analyzeSpendingBtn"),
  analysisStatus: document.getElementById("analysisStatus"),
  analysisResult: document.getElementById("analysisResult"),
  loadSampleBtn: document.getElementById("loadSampleBtn"),
  clearIncomeBtn: document.getElementById("clearIncomeBtn"),
  clearExpensesBtn: document.getElementById("clearExpensesBtn"),
  clearSavingsBtn: document.getElementById("clearSavingsBtn"),
  budgetChart: document.getElementById("budgetChart"),
  chartTooltip: document.getElementById("chartTooltip"),
  appFeedback: document.getElementById("appFeedback"),
  authScreen: document.getElementById("authScreen"),
  appShell: document.querySelector(".app-shell"),
  authForm: document.getElementById("authForm"),
  authEmail: document.getElementById("authEmail"),
  authPassword: document.getElementById("authPassword"),
  authSubmitBtn: document.getElementById("authSubmitBtn"),
  authToggleBtn: document.getElementById("authToggleBtn"),
  authStatus: document.getElementById("authStatus"),
  userEmailLabel: document.getElementById("userEmailLabel"),
  logoutBtn: document.getElementById("logoutBtn"),
};

function formatCurrency(value) {
  return currencyFormatter.format(value || 0);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseAmount(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function setDefaultDates() {
  const today = getToday();
  els.incomeDate.value = today;
  els.expenseDate.value = today;
  els.savingsDate.value = today;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function showFeedback(message, type = "success") {
  if (!els.appFeedback || !message) {
    return;
  }

  window.clearTimeout(state.feedbackTimer);
  els.appFeedback.innerHTML = `
    <div class="app-feedback-message ${type === "error" ? "is-error" : ""}">
      ${escapeHtml(message)}
    </div>
  `;

  state.feedbackTimer = window.setTimeout(() => {
    if (els.appFeedback) {
      els.appFeedback.innerHTML = "";
    }
  }, 2200);
}

function animatePanelEntrance(element) {
  if (!element || prefersReducedMotion() || typeof element.animate !== "function") {
    return;
  }

  element.animate(
    [
      { opacity: 0, transform: "translate3d(0, 12px, 0)" },
      { opacity: 1, transform: "translate3d(0, 0, 0)" },
    ],
    { duration: 340, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
  );
}

function pulseElements(selector) {
  if (!selector) {
    return;
  }

  document.querySelectorAll(selector).forEach((element, index) => {
    const className = selector.includes("summary-card") ? "is-highlighted" : "is-new";
    window.setTimeout(() => {
      element.classList.add(className);
      window.setTimeout(() => element.classList.remove(className), 950);
    }, index * 45);
  });
}

function flashFormState(form, className) {
  if (!form) {
    return;
  }

  form.classList.remove("has-error", "is-success");
  form.classList.add(className);
  window.setTimeout(() => form.classList.remove(className), 1200);
}

function getDefaultMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function setAuthScreen(isAuthenticated) {
  els.authScreen?.classList.toggle("is-hidden", isAuthenticated);
  els.appShell?.classList.toggle("is-auth-hidden", !isAuthenticated);
}

function setAuthMode(mode) {
  state.authMode = mode === "signup" ? "signup" : "login";
  if (els.authSubmitBtn) {
    els.authSubmitBtn.textContent = state.authMode === "signup" ? "Create Account" : "Log In";
  }
  if (els.authToggleBtn) {
    els.authToggleBtn.textContent = state.authMode === "signup"
      ? "Already have an account? Log in"
      : "Need an account? Sign up";
  }
  if (els.authPassword) {
    els.authPassword.setAttribute("autocomplete", state.authMode === "signup" ? "new-password" : "current-password");
  }
}

function setAuthStatus(message, tone = "default") {
  if (!els.authStatus) {
    return;
  }

  els.authStatus.textContent = message;
  els.authStatus.dataset.tone = tone;
}

async function fetchPublicConfig() {
  const response = await fetch("/api/config");
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Unable to load app configuration.");
  }
  return payload;
}

async function initializeSupabase() {
  if (state.supabase) {
    return state.supabase;
  }

  if (!window.supabase?.createClient) {
    throw new Error("Supabase client library failed to load.");
  }

  const config = await fetchPublicConfig();
  state.supabase = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return state.supabase;
}

function buildBudgetRow() {
  updateStateFromForm();
  const row = {
    user_id: state.user.id,
    month: state.month,
  };

  Object.entries(BUDGET_COLUMN_MAP).forEach(([key, column]) => {
    row[column] = state.budgets[key] || 0;
  });

  return row;
}

function applyBudgetRow(row) {
  state.budgets = createEmptyBudgets();
  if (!row) {
    return;
  }

  Object.entries(BUDGET_COLUMN_MAP).forEach(([key, column]) => {
    state.budgets[key] = Number(row[column]) || 0;
  });
}

function mapIncomeRow(row) {
  return {
    id: row.id,
    category: row.source,
    title: row.description,
    amount: Number(row.amount) || 0,
    date: row.date,
  };
}

function mapExpenseRow(row) {
  return {
    id: row.id,
    category: row.category,
    title: row.description,
    amount: Number(row.amount) || 0,
    date: row.date,
  };
}

function mapSavingsRow(row) {
  return {
    id: row.id,
    category: row.account,
    title: row.note,
    amount: Number(row.amount) || 0,
    date: row.date,
  };
}

async function ensureProfile() {
  if (!state.supabase || !state.user) {
    return;
  }

  await state.supabase.from("profiles").upsert({
    id: state.user.id,
    email: state.user.email,
  });
}

async function loadMonthData(month) {
  if (!state.supabase || !state.user || !month) {
    return;
  }

  state.month = month;
  const [budgetResult, incomeResult, expenseResult, savingsResult] = await Promise.all([
    state.supabase.from("monthly_budgets").select("*").eq("user_id", state.user.id).eq("month", month).maybeSingle(),
    state.supabase.from("income_entries").select("*").eq("user_id", state.user.id).eq("month", month).order("date", { ascending: false }),
    state.supabase.from("expense_entries").select("*").eq("user_id", state.user.id).eq("month", month).order("date", { ascending: false }),
    state.supabase.from("savings_entries").select("*").eq("user_id", state.user.id).eq("month", month).order("date", { ascending: false }),
  ]);

  if (budgetResult.error || incomeResult.error || expenseResult.error || savingsResult.error) {
    throw new Error(
      budgetResult.error?.message
      || incomeResult.error?.message
      || expenseResult.error?.message
      || savingsResult.error?.message
      || "Unable to load your saved budget."
    );
  }

  applyBudgetRow(budgetResult.data);
  state.incomes = (incomeResult.data || []).map(mapIncomeRow);
  state.expenses = (expenseResult.data || []).map(mapExpenseRow);
  state.savingsActivities = (savingsResult.data || []).map(mapSavingsRow);
  state.analysis = null;
  populateBudgetForm();
  renderSummary();
}

async function saveBudgetPlan() {
  if (!state.supabase || !state.user || !state.month) {
    return;
  }

  const { error } = await state.supabase
    .from("monthly_budgets")
    .upsert(buildBudgetRow(), { onConflict: "user_id,month" });

  if (error) {
    throw new Error(error.message || "Unable to save your budget plan.");
  }
}

function scheduleBudgetSave() {
  window.clearTimeout(state.budgetSaveTimer);
  state.budgetSaveTimer = window.setTimeout(async () => {
    try {
      await saveBudgetPlan();
    } catch (error) {
      showFeedback(error.message, "error");
    }
  }, 250);
}

async function replaceMonthEntries(tableName, rows) {
  if (!state.supabase || !state.user || !state.month) {
    return;
  }

  const removeResult = await state.supabase
    .from(tableName)
    .delete()
    .eq("user_id", state.user.id)
    .eq("month", state.month);

  if (removeResult.error) {
    throw new Error(removeResult.error.message || `Unable to clear ${tableName}.`);
  }

  if (rows.length === 0) {
    return;
  }

  const insertResult = await state.supabase.from(tableName).insert(rows);
  if (insertResult.error) {
    throw new Error(insertResult.error.message || `Unable to save ${tableName}.`);
  }
}

async function saveCurrentMonthSnapshot() {
  if (!state.supabase || !state.user || !state.month) {
    return;
  }

  await saveBudgetPlan();
  await Promise.all([
    replaceMonthEntries(
      "income_entries",
      state.incomes.map((entry) => ({
        user_id: state.user.id,
        month: state.month,
        source: entry.category,
        description: entry.title,
        amount: entry.amount,
        date: entry.date,
      }))
    ),
    replaceMonthEntries(
      "expense_entries",
      state.expenses.map((entry) => ({
        user_id: state.user.id,
        month: state.month,
        category: entry.category,
        description: entry.title,
        amount: entry.amount,
        date: entry.date,
      }))
    ),
    replaceMonthEntries(
      "savings_entries",
      state.savingsActivities.map((entry) => ({
        user_id: state.user.id,
        month: state.month,
        account: entry.category,
        note: entry.title,
        amount: entry.amount,
        date: entry.date,
      }))
    ),
  ]);
}

async function persistEntry(type, values) {
  if (!state.supabase || !state.user || !state.month) {
    throw new Error("You need to be logged in to save entries.");
  }

  const isEditing = state.editing.type === type;
  const tableName = type === "income" ? "income_entries" : type === "savings" ? "savings_entries" : "expense_entries";
  const payload = type === "income"
    ? {
      user_id: state.user.id,
      month: state.month,
      source: values.category,
      description: values.title,
      amount: values.amount,
      date: values.date,
    }
    : type === "savings"
      ? {
        user_id: state.user.id,
        month: state.month,
        account: values.category,
        note: values.title,
        amount: values.amount,
        date: values.date,
      }
      : {
        user_id: state.user.id,
        month: state.month,
        category: values.category,
        description: values.title,
        amount: values.amount,
        date: values.date,
      };

  if (isEditing) {
    const { data, error } = await state.supabase
      .from(tableName)
      .update(payload)
      .eq("id", state.editing.id)
      .eq("user_id", state.user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || "Unable to update this entry.");
    }
    return data.id;
  }

  const { data, error } = await state.supabase.from(tableName).insert(payload).select().single();
  if (error) {
    throw new Error(error.message || "Unable to save this entry.");
  }
  return data.id;
}

async function deleteEntry(type, id) {
  if (!state.supabase || !state.user) {
    throw new Error("You need to be logged in to remove entries.");
  }

  const tableName = type === "income" ? "income_entries" : type === "savings" ? "savings_entries" : "expense_entries";
  const { error } = await state.supabase.from(tableName).delete().eq("id", id).eq("user_id", state.user.id);
  if (error) {
    throw new Error(error.message || "Unable to remove this entry.");
  }
}

async function clearEntries(type) {
  if (!state.supabase || !state.user || !state.month) {
    return;
  }

  const tableName = type === "income" ? "income_entries" : type === "savings" ? "savings_entries" : "expense_entries";
  const { error } = await state.supabase.from(tableName).delete().eq("user_id", state.user.id).eq("month", state.month);
  if (error) {
    throw new Error(error.message || "Unable to clear entries.");
  }
}

async function handleSession(session) {
  state.session = session;
  state.user = session?.user || null;
  if (els.userEmailLabel) {
    els.userEmailLabel.textContent = state.user?.email || "Not signed in";
  }

  if (!state.user) {
    setAuthScreen(false);
    state.budgets = createEmptyBudgets();
    state.incomes = [];
    state.expenses = [];
    state.savingsActivities = [];
    state.analysis = null;
    renderSummary();
    return;
  }

  setAuthScreen(true);
  await ensureProfile();
  state.month = state.month || getDefaultMonth();
  populateBudgetForm();
  await loadMonthData(state.month);
}

function setCardTone(card, tone) {
  if (!card) {
    return;
  }

  card.classList.remove("is-good", "is-warning", "is-danger");
  if (tone) {
    card.classList.add(tone);
  }
}

function saveState() {
  const persistedState = { month: state.month };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
}

function normalizeEntry(entry, categories) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const title = typeof entry.title === "string" ? entry.title.trim() : "";
  const category = typeof entry.category === "string" ? entry.category : "";
  const amount = Number(entry.amount);
  const date = typeof entry.date === "string" ? entry.date : "";
  const id = Number(entry.id);

  if (!title || !categories.includes(category) || !Number.isFinite(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  return { id: Number.isFinite(id) ? id : generateId(), title, category, amount, date };
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return false;
    }

    const parsed = JSON.parse(raw);
    state.month = typeof parsed.month === "string" ? parsed.month : "";
    return true;
  } catch (error) {
    console.warn("Failed to load saved state.", error);
    return false;
  }
}

function renderStaticFields() {
  if (els.budgetFields) {
    els.budgetFields.innerHTML = CATEGORY_CONFIG.map((category) => `
      <label>
        <span>${category.label}</span>
        <input
          class="category-budget"
          data-category="${category.key}"
          type="number"
          min="0"
          step="0.01"
          placeholder="${category.placeholder}"
        >
      </label>
    `).join("");
  }

  if (els.expenseCategory) {
    els.expenseCategory.innerHTML = SPENDING_CATEGORIES.map((category) => `
      <option value="${category}">${category}</option>
    `).join("");
  }

  if (els.savingsCategory) {
    els.savingsCategory.innerHTML = SAVINGS_CATEGORIES.map((category) => `
      <option value="${category}">${category}</option>
    `).join("");
  }

  els.budgetInputs = Array.from(document.querySelectorAll(".category-budget"));
}

function setActiveStep(stepName) {
  if (!stepName) {
    return;
  }

  const nextPanel = els.stepPanels.find((panel) => panel.dataset.stepPanel === stepName);
  const currentPanel = els.stepPanels.find((panel) => panel.classList.contains("is-active"));

  els.stepTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.stepTarget === stepName);
  });

  els.stepPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.stepPanel === stepName);
  });

  if (nextPanel && nextPanel !== currentPanel) {
    animatePanelEntrance(nextPanel);
  }

  nextPanel?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}

function updateStateFromForm() {
  state.month = els.monthInput.value;

  els.budgetInputs.forEach((input) => {
    const amount = Number.parseFloat(input.value);
    state.budgets[input.dataset.category] = Number.isFinite(amount) && amount >= 0 ? amount : 0;
  });
}

function populateBudgetForm() {
  els.monthInput.value = state.month;

  els.budgetInputs.forEach((input) => {
    const value = state.budgets[input.dataset.category] || 0;
    input.value = value ? value : "";
  });
}

function getSpentByCategory() {
  const spent = Object.fromEntries(SPENDING_CATEGORIES.map((category) => [category, 0]));

  state.expenses.forEach((expense) => {
    spent[expense.category] = (spent[expense.category] || 0) + expense.amount;
  });

  return spent;
}

function getTotalIncome() {
  return sum(state.incomes.map((income) => income.amount));
}

function getTotalSaved() {
  return sum(state.savingsActivities.map((entry) => entry.amount));
}

function buildInsights(totalIncome, spentByCategory, totalSaved) {
  const rentRatio = totalIncome > 0 ? (spentByCategory.Housing || 0) / totalIncome : 0;
  const savingsRatio = totalIncome > 0 ? totalSaved / totalIncome : 0;
  const fixedTotal = (spentByCategory.Bills || 0) + (spentByCategory.Food || 0) + (spentByCategory.Health || 0);
  const fixedRatio = totalIncome > 0 ? fixedTotal / totalIncome : 0;
  const debtRatio = totalIncome > 0 ? (spentByCategory.Debt || 0) / totalIncome : 0;

  return [
    {
      title: "Savings",
      value: `${Math.round(savingsRatio * 100)}% of income`,
      body:
        savingsRatio === 0
          ? "No savings activity is logged yet. Even one transfer is a useful start."
          : savingsRatio < 0.1
            ? "Savings activity is moving, but still under 10% of income. Increasing the transfer slightly would help."
            : "Savings activity is at or above 10% of income, which is a strong monthly habit.",
    },
    {
      title: "Housing",
      value: `${Math.round(rentRatio * 100)}% of income`,
      body:
        rentRatio <= 0.3
          ? "Housing is in a healthy range. Keeping rent near or below 30% is a strong benchmark."
          : rentRatio <= 0.4
            ? "Housing is a little high. This can happen in expensive cities, but try to keep it closer to 30%."
            : "Housing is taking a large share of income. Reducing it or raising income would improve flexibility.",
    },
    {
      title: "Fixed Expenses",
      value: `${Math.round(fixedRatio * 100)}% of income`,
      body:
        fixedRatio <= 0.2
          ? "Bills, food, and health costs are at a healthy level."
          : fixedRatio <= 0.3
            ? "Fixed costs are getting a bit high. Review subscriptions and recurring spending."
            : "Fixed costs are above the suggested range. Tightening them would likely help quickly.",
    },
    {
      title: "Debt",
      value: `${Math.round(debtRatio * 100)}% of income`,
      body:
        debtRatio === 0
          ? "No debt payment logged this month. If you have debt, try to at least cover the minimum payment."
          : "Putting money toward debt each month is a solid habit. Keep chipping away consistently.",
    },
  ];
}

function renderCategoryBreakdown() {
  const spentByCategory = getSpentByCategory();
  const savingsGoal = state.budgets.Savings || 0;
  const totalSaved = getTotalSaved();

  const cards = SPENDING_CATEGORIES.map((category) => {
    const budget = state.budgets[category] || 0;
    const spent = spentByCategory[category] || 0;
    const ratio = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const percentLabel = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    const overBudget = budget > 0 && spent > budget;

    return `
      <article class="category-card">
        <div class="category-meta">
          <strong>${category}</strong>
          <span>${formatCurrency(spent)} / ${formatCurrency(budget)}</span>
        </div>
        <div class="category-progress">
          <div class="progress-track">
            <div class="progress-bar ${overBudget ? "progress-over" : ""}" style="width: ${ratio}%"></div>
          </div>
          <span>${percentLabel}%</span>
        </div>
      </article>
    `;
  });

  const savingsRatio = savingsGoal > 0 ? Math.min((totalSaved / savingsGoal) * 100, 100) : 0;
  const savingsPercentLabel = savingsGoal > 0 ? Math.round((totalSaved / savingsGoal) * 100) : 0;

  cards.unshift(`
    <article class="category-card category-card-savings">
      <div class="category-meta">
        <strong>Savings Progress</strong>
        <span>${formatCurrency(totalSaved)} / ${formatCurrency(savingsGoal)}</span>
      </div>
      <div class="category-progress">
        <div class="progress-track">
          <div class="progress-bar" style="width: ${savingsRatio}%"></div>
        </div>
        <span>${savingsPercentLabel}%</span>
      </div>
    </article>
  `);

  els.categoryList.innerHTML = cards.join("");
}

function renderEntries(listElement, entries, type, emptyCopy) {
  if (entries.length === 0) {
    listElement.innerHTML = `<div class="empty-state">${emptyCopy}</div>`;
    return;
  }

  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  listElement.innerHTML = sortedEntries.map((entry) => `
    <article class="transaction-item">
      <div class="transaction-main">
        <div class="transaction-badge">${entry.category.slice(0, 1)}</div>
        <div>
          <strong>${escapeHtml(entry.title)}</strong>
          <div class="transaction-meta">${escapeHtml(entry.category)} - ${escapeHtml(entry.date)}</div>
        </div>
      </div>
      <div class="transaction-amount">
        <strong>${formatCurrency(entry.amount)}</strong>
        <div class="transaction-actions">
          <button class="text-button text-button-neutral" type="button" data-action="edit" data-type="${type}" data-id="${entry.id}">Edit</button>
          <button class="text-button" type="button" data-action="remove" data-type="${type}" data-id="${entry.id}">Remove</button>
        </div>
      </div>
    </article>
  `).join("");
}

function revealNewEntry(type, id) {
  if (!type || !id) {
    return;
  }

  const selector = `[data-type="${type}"][data-id="${id}"]`;
  const button = document.querySelector(selector);
  const item = button?.closest(".transaction-item");
  if (!item) {
    return;
  }

  item.classList.add("is-new");
  window.setTimeout(() => item.classList.remove("is-new"), 950);
}

function drawRoundedBar(ctx, x, y, width, height, radius, color) {
  if (height <= 0) {
    return;
  }

  const cappedRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x, y + height);
  ctx.lineTo(x, y + cappedRadius);
  ctx.quadraticCurveTo(x, y, x + cappedRadius, y);
  ctx.lineTo(x + width - cappedRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + cappedRadius);
  ctx.lineTo(x + width, y + height);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function showChartTooltip(content, x, y) {
  if (!els.chartTooltip) {
    return;
  }

  els.chartTooltip.innerHTML = content;
  els.chartTooltip.classList.add("is-visible");
  els.chartTooltip.setAttribute("aria-hidden", "false");
  els.chartTooltip.style.left = `${x}px`;
  els.chartTooltip.style.top = `${y}px`;
}

function hideChartTooltip() {
  if (!els.chartTooltip) {
    return;
  }

  els.chartTooltip.classList.remove("is-visible");
  els.chartTooltip.setAttribute("aria-hidden", "true");
}

function bindChartTooltip(hoverRegions) {
  if (!els.budgetChart) {
    return;
  }

  els.budgetChart.onmousemove = (event) => {
    const bounds = els.budgetChart.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const match = hoverRegions.find((region) => (
      x >= region.x
      && x <= region.x + region.width
      && y >= region.y
      && y <= region.y + region.height
    ));

    if (!match) {
      hideChartTooltip();
      return;
    }

    const tooltipX = Math.min(match.x + match.width + 14, bounds.width - 196);
    const tooltipY = Math.max(match.y - 8, 14);
    showChartTooltip(`
      <strong>${escapeHtml(match.label)}</strong>
      <span>Budget: ${formatCurrency(match.budget)}</span>
      <span>Actual: ${formatCurrency(match.actual)}</span>
      <span>Difference: ${formatCurrency(match.actual - match.budget)}</span>
    `, tooltipX, tooltipY);
  };

  els.budgetChart.onmouseleave = hideChartTooltip;
}

function drawBudgetChart(spentByCategory) {
  if (!els.budgetChart) {
    return;
  }

  const canvas = els.budgetChart;
  const ctx = canvas.getContext("2d");
  const categories = SPENDING_CATEGORIES
    .map((category) => ({
      key: category,
      budget: state.budgets[category] || 0,
      actual: spentByCategory[category] || 0,
      gap: (spentByCategory[category] || 0) - (state.budgets[category] || 0),
    }))
    .filter((category) => category.budget > 0 || category.actual > 0)
    .sort((a, b) => {
      const aOver = a.gap > 0 ? a.gap : -1;
      const bOver = b.gap > 0 ? b.gap : -1;
      if (bOver !== aOver) {
        return bOver - aOver;
      }
      return b.actual - a.actual;
    })
    .slice(0, 6);

  const width = canvas.clientWidth || canvas.width;
  const height = canvas.clientHeight || 350;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  if (categories.length === 0) {
    ctx.fillStyle = "#665f57";
    ctx.font = '16px "Space Grotesk", sans-serif';
    ctx.fillText("Add budgets and expenses to see the chart.", 24, 40);
    hideChartTooltip();
    return;
  }

  const chartTop = 56;
  const chartBottom = height - 46;
  const chartHeight = chartBottom - chartTop;
  const chartLeft = 22;
  const chartRight = width - 18;
  const chartWidth = chartRight - chartLeft;
  const barGroupWidth = chartWidth / categories.length;
  const maxValue = Math.max(
    ...categories.flatMap((category) => [category.budget, category.actual]),
    1
  );
  const hoverRegions = [];

  ctx.textBaseline = "alphabetic";
  ctx.font = '12px "Space Grotesk", sans-serif';

  ctx.textAlign = "right";
  ctx.fillStyle = "#3b332d";
  ctx.font = '12px "Space Grotesk", sans-serif';
  ctx.fillText("Budget", width - 94, 24);
  ctx.fillStyle = "#8f877f";
  ctx.fillText("Actual", width - 24, 24);

  ctx.fillStyle = "#3a7d6d";
  ctx.beginPath();
  ctx.arc(width - 118, 20, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#c96f52";
  ctx.beginPath();
  ctx.arc(width - 48, 20, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(29, 26, 22, 0.06)";
  ctx.lineWidth = 1;
  for (let step = 0; step < 4; step += 1) {
    const y = chartTop + (chartHeight / 3) * step;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();
  }

  categories.forEach((category, index) => {
    const groupX = chartLeft + index * barGroupWidth;
    const barWidth = Math.min(18, barGroupWidth * 0.18);
    const budgetHeight = (category.budget / maxValue) * chartHeight;
    const actualHeight = (category.actual / maxValue) * chartHeight;
    const label = CHART_LABELS[category.key] || category.key;
    const budgetX = groupX + barGroupWidth * 0.2;
    const actualX = groupX + barGroupWidth * 0.58;
    const budgetColor = "#3a7d6d";
    const actualColor = category.actual > category.budget && category.budget > 0 ? "#bc4f4f" : "#b9a79b";

    drawRoundedBar(ctx, budgetX, chartBottom - budgetHeight, barWidth, budgetHeight, 7, budgetColor);
    drawRoundedBar(ctx, actualX, chartBottom - actualHeight, barWidth, actualHeight, 7, actualColor);

    ctx.fillStyle = "#2c2622";
    ctx.textAlign = "center";
    ctx.fillText(label, groupX + barGroupWidth / 2, height - 18);

    if (category.budget > 0) {
      ctx.fillStyle = "#4f4741";
      ctx.font = '11px "Space Grotesk", sans-serif';
      ctx.fillText(
        Math.round(category.budget).toString(),
        budgetX + barWidth / 2,
        Math.max(chartBottom - budgetHeight - 8, chartTop - 6)
      );
    }

    if (category.actual > 0) {
      ctx.fillStyle = category.actual > category.budget && category.budget > 0 ? "#9e3f3f" : "#6d645e";
      ctx.font = '11px "Space Grotesk", sans-serif';
      ctx.fillText(
        Math.round(category.actual).toString(),
        actualX + barWidth / 2,
        Math.max(chartBottom - actualHeight - 8, chartTop - 6)
      );
    }

    hoverRegions.push({
      label,
      budget: category.budget,
      actual: category.actual,
      x: groupX + barGroupWidth * 0.12,
      y: chartTop,
      width: barGroupWidth * 0.78,
      height: chartBottom - chartTop,
    });
  });

  bindChartTooltip(hoverRegions);
}

function getBudgetSnapshot() {
  updateStateFromForm();

  const totalIncome = getTotalIncome();
  const totalSpent = sum(state.expenses.map((expense) => expense.amount));
  const totalSaved = getTotalSaved();
  const spentByCategory = getSpentByCategory();
  const topCategories = Object.entries(spentByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const overBudgetCategories = SPENDING_CATEGORIES.filter((category) => {
    const budget = state.budgets[category] || 0;
    return budget > 0 && (spentByCategory[category] || 0) > budget;
  }).map((category) => ({
    category,
    budget: state.budgets[category] || 0,
    spent: spentByCategory[category] || 0,
  }));

  return {
    month: state.month,
    totals: {
      income: totalIncome,
      spent: totalSpent,
      saved: totalSaved,
      remaining: totalIncome - totalSpent - totalSaved,
      planned: sum(Object.values(state.budgets)),
      savingsGoal: state.budgets.Savings || 0,
    },
    budgets: state.budgets,
    spentByCategory,
    topCategories,
    overBudgetCategories,
    incomes: state.incomes,
    savingsActivities: state.savingsActivities,
    expenses: state.expenses,
  };
}

function renderAnalysis() {
  if (!els.analysisResult) {
    return;
  }

  if (!state.analysis) {
    els.analysisResult.classList.remove("is-loading");
    els.analysisResult.classList.add("is-empty");
    els.analysisResult.innerHTML = `<p class="empty-state">Your AI analysis will appear here after you run it.</p>`;
    return;
  }

  els.analysisResult.classList.remove("is-loading");
  els.analysisResult.classList.remove("is-empty");
  const summary = escapeHtml(state.analysis.summary || "No summary returned.");
  const risks = Array.isArray(state.analysis.risks) ? state.analysis.risks : [];
  const actions = Array.isArray(state.analysis.actions) ? state.analysis.actions : [];

  els.analysisResult.innerHTML = `
    <div class="analysis-grid">
      <div class="analysis-block">
        <h3>Summary</h3>
        <p>${summary}</p>
      </div>
      <div class="analysis-block">
        <h3>Risks</h3>
        <ul>${risks.map((risk) => `<li>${escapeHtml(risk)}</li>`).join("") || "<li>No major risks highlighted.</li>"}</ul>
      </div>
      <div class="analysis-block">
        <h3>Recommended Actions</h3>
        <ul>${actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("") || "<li>No actions returned.</li>"}</ul>
      </div>
    </div>
  `;
}

function setFormEditingState(form, isEditing, defaultLabel) {
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = isEditing ? "Save Changes" : defaultLabel;
  }
}

function resetEditing(type) {
  if (state.editing.type === type) {
    state.editing = { type: null, id: null };
  }

  if (type === "income") {
    els.incomeForm.reset();
    setFormEditingState(els.incomeForm, false, "Add Income");
    els.incomeDate.value = getToday();
  }

  if (type === "expense") {
    els.expenseForm.reset();
    setFormEditingState(els.expenseForm, false, "Add Expense");
    els.expenseDate.value = getToday();
  }

  if (type === "savings") {
    els.savingsForm.reset();
    setFormEditingState(els.savingsForm, false, "Add Savings Activity");
    els.savingsDate.value = getToday();
  }
}

function renderSummary() {
  updateStateFromForm();

  const planned = sum(Object.values(state.budgets));
  const income = getTotalIncome();
  const spent = sum(state.expenses.map((expense) => expense.amount));
  const saved = getTotalSaved();
  const remaining = income - spent - saved;
  const savingsGoal = state.budgets.Savings || 0;
  const spentByCategory = getSpentByCategory();
  const insights = buildInsights(income, spentByCategory, saved);
  const overBudget = remaining < 0 && income > 0;
  const overPlanned = income > 0 && planned > income;
  const strongSavings = savingsGoal > 0 ? saved >= savingsGoal : saved > 0 && income > 0 && saved / income >= 0.15;
  const strongBalance = income > 0 && remaining >= income * 0.2;
  const healthyRun = income > 0 && !overPlanned && !overBudget && strongSavings;

  els.plannedTotal.textContent = formatCurrency(planned);
  els.incomeTotal.textContent = formatCurrency(income);
  els.spentTotal.textContent = formatCurrency(spent);
  els.remainingTotal.textContent = formatCurrency(remaining);
  els.savingsGoalTotal.textContent = formatCurrency(savingsGoal);
  els.savedTotal.textContent = formatCurrency(saved);
  els.healthStatus.textContent = overBudget
    ? "Overspending"
    : overPlanned
      ? "Overplanned"
      : healthyRun
        ? "Doing Great"
        : "On Track";
  els.healthCopy.textContent = overBudget
    ? "Expenses and savings transfers are currently higher than income."
    : overPlanned
      ? "Your planned budget is higher than your logged income. Trim categories or add more income."
      : healthyRun
        ? "Your income covers the plan comfortably and savings progress looks strong."
        : "Income currently covers spending and savings activity.";

  els.heroBudget.textContent = formatCurrency(planned);
  els.heroSpent.textContent = formatCurrency(spent + saved);
  els.heroRemaining.textContent = formatCurrency(remaining);

  setCardTone(els.plannedCard, overPlanned ? "is-warning" : null);
  setCardTone(els.incomeCard, healthyRun || strongBalance ? "is-good" : null);
  setCardTone(els.spentCard, overBudget ? "is-danger" : null);
  setCardTone(els.balanceCard, overBudget ? "is-danger" : strongBalance ? "is-good" : null);
  setCardTone(els.healthCard, overBudget ? "is-danger" : overPlanned ? "is-warning" : healthyRun ? "is-good" : null);
  setCardTone(els.savingsGoalCard, overPlanned && savingsGoal > 0 ? "is-warning" : null);
  setCardTone(els.savedCard, strongSavings ? "is-good" : saved > 0 ? "is-warning" : null);

  renderCategoryBreakdown();
  renderEntries(els.incomeList, state.incomes, "income", "No income entries yet. Add a paycheck or side income to begin.");
  renderEntries(els.savingsList, state.savingsActivities, "savings", "No savings activity yet. Log transfers to track progress toward your goal.");
  renderEntries(els.transactionList, state.expenses, "expense", "No expenses yet. Add your first purchase to start tracking this month.");
  drawBudgetChart(spentByCategory);
  renderAnalysis();

  els.insightsList.innerHTML = insights.map((insight) => `
    <article class="insight-card">
      <div class="category-meta">
        <strong>${insight.title}</strong>
        <span>${insight.value}</span>
      </div>
      <p>${insight.body}</p>
    </article>
  `).join("");

  saveState();
}

function upsertEntry(listName, type, values, entryIdOverride) {
  if (state.editing.type === type) {
    state[listName] = state[listName].map((entry) => (
      entry.id === state.editing.id ? { ...entry, ...values, id: state.editing.id } : entry
    ));
    return state.editing.id;
  } else {
    const id = entryIdOverride ?? generateId();
    state[listName].push({ id, ...values });
    return id;
  }
}

async function addIncome(event) {
  event.preventDefault();

  const title = els.incomeName.value.trim();
  const amount = parseAmount(els.incomeAmount.value);
  const category = els.incomeCategory.value;
  const date = els.incomeDate.value;

  if (!title || !amount || !date) {
    flashFormState(els.incomeForm, "has-error");
    showFeedback("Add a title, amount, and date for income.", "error");
    return;
  }

  const wasEditing = state.editing.type === "income";
  let entryId;
  try {
    entryId = await persistEntry("income", { title, amount, category, date });
  } catch (error) {
    flashFormState(els.incomeForm, "has-error");
    showFeedback(error.message, "error");
    return;
  }

  upsertEntry("incomes", "income", { title, amount, category, date }, entryId);
  resetEditing("income");
  renderSummary();
  flashFormState(els.incomeForm, "is-success");
  showFeedback(wasEditing ? "Income updated." : "Income added.");
  pulseElements(".summary-card:nth-child(-n+4)");
  revealNewEntry("income", entryId);
}

async function addExpense(event) {
  event.preventDefault();

  const title = els.expenseName.value.trim();
  const amount = parseAmount(els.expenseAmount.value);
  const category = els.expenseCategory.value;
  const date = els.expenseDate.value;

  if (!title || !amount || !date) {
    flashFormState(els.expenseForm, "has-error");
    showFeedback("Add a title, amount, and date for the expense.", "error");
    return;
  }

  const wasEditing = state.editing.type === "expense";
  let entryId;
  try {
    entryId = await persistEntry("expense", { title, amount, category, date });
  } catch (error) {
    flashFormState(els.expenseForm, "has-error");
    showFeedback(error.message, "error");
    return;
  }

  upsertEntry("expenses", "expense", { title, amount, category, date }, entryId);
  resetEditing("expense");
  renderSummary();
  flashFormState(els.expenseForm, "is-success");
  showFeedback(wasEditing ? "Expense updated." : "Expense added.");
  pulseElements(".summary-card:nth-child(-n+4)");
  revealNewEntry("expense", entryId);
}

async function addSavings(event) {
  event.preventDefault();

  const title = els.savingsName.value.trim();
  const amount = parseAmount(els.savingsAmount.value);
  const category = els.savingsCategory.value;
  const date = els.savingsDate.value;

  if (!title || !amount || !date) {
    flashFormState(els.savingsForm, "has-error");
    showFeedback("Add a title, amount, and date for savings activity.", "error");
    return;
  }

  const wasEditing = state.editing.type === "savings";
  let entryId;
  try {
    entryId = await persistEntry("savings", { title, amount, category, date });
  } catch (error) {
    flashFormState(els.savingsForm, "has-error");
    showFeedback(error.message, "error");
    return;
  }

  upsertEntry("savingsActivities", "savings", { title, amount, category, date }, entryId);
  resetEditing("savings");
  renderSummary();
  flashFormState(els.savingsForm, "is-success");
  showFeedback(wasEditing ? "Savings activity updated." : "Savings activity added.");
  pulseElements(".summary-card:nth-child(-n+4)");
  revealNewEntry("savings", entryId);
}

function startEditing(type, id) {
  const sourceMap = {
    income: state.incomes,
    expense: state.expenses,
    savings: state.savingsActivities,
  };

  const entry = sourceMap[type]?.find((item) => item.id === id);
  if (!entry) {
    return;
  }

  setActiveStep("track");
  state.editing = { type, id };

  if (type === "income") {
    els.incomeCategory.value = entry.category;
    els.incomeName.value = entry.title;
    els.incomeAmount.value = entry.amount;
    els.incomeDate.value = entry.date;
    setFormEditingState(els.incomeForm, true, "Add Income");
    requestAnimationFrame(() => {
      els.incomeForm.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
    });
  }

  if (type === "expense") {
    els.expenseCategory.value = entry.category;
    els.expenseName.value = entry.title;
    els.expenseAmount.value = entry.amount;
    els.expenseDate.value = entry.date;
    setFormEditingState(els.expenseForm, true, "Add Expense");
    requestAnimationFrame(() => {
      els.expenseForm.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
    });
  }

  if (type === "savings") {
    els.savingsCategory.value = entry.category;
    els.savingsName.value = entry.title;
    els.savingsAmount.value = entry.amount;
    els.savingsDate.value = entry.date;
    setFormEditingState(els.savingsForm, true, "Add Savings Activity");
    requestAnimationFrame(() => {
      els.savingsForm.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
    });
  }
}

async function removeOrEditEntry(event) {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const id = Number(button.dataset.id);
  const type = button.dataset.type;
  const action = button.dataset.action;

  if (action === "edit") {
    startEditing(type, id);
    return;
  }

  try {
    await deleteEntry(type, id);
  } catch (error) {
    showFeedback(error.message, "error");
    return;
  }

  const listName = type === "income" ? "incomes" : type === "savings" ? "savingsActivities" : "expenses";
  state[listName] = state[listName].filter((entry) => entry.id !== id);

  if (state.editing.type === type && state.editing.id === id) {
    resetEditing(type);
  }

  renderSummary();
  showFeedback(type === "income" ? "Income removed." : type === "savings" ? "Savings activity removed." : "Expense removed.");
}

async function loadSampleData() {
  state.month = sampleState.month;
  state.budgets = { ...createEmptyBudgets(), ...sampleState.budgets };
  state.incomes = sampleState.incomes.map((income) => ({ ...income }));
  state.expenses = sampleState.expenses.map((expense) => ({ ...expense }));
  state.savingsActivities = sampleState.savingsActivities.map((entry) => ({ ...entry }));
  state.analysis = null;
  populateBudgetForm();
  resetEditing("income");
  resetEditing("expense");
  resetEditing("savings");
  try {
    await saveCurrentMonthSnapshot();
  } catch (error) {
    showFeedback(error.message, "error");
  }
  renderSummary();
  showFeedback("Sample data loaded into your account.");
}

async function clearIncome() {
  try {
    await clearEntries("income");
  } catch (error) {
    showFeedback(error.message, "error");
    return;
  }
  state.incomes = [];
  resetEditing("income");
  renderSummary();
  showFeedback("Income cleared for this month.");
}

async function clearExpenses() {
  try {
    await clearEntries("expense");
  } catch (error) {
    showFeedback(error.message, "error");
    return;
  }
  state.expenses = [];
  resetEditing("expense");
  renderSummary();
  showFeedback("Expenses cleared for this month.");
}

async function clearSavings() {
  try {
    await clearEntries("savings");
  } catch (error) {
    showFeedback(error.message, "error");
    return;
  }
  state.savingsActivities = [];
  resetEditing("savings");
  renderSummary();
  showFeedback("Savings activity cleared for this month.");
}

async function analyzeSpending() {
  if (!els.analysisStatus || !els.analyzeSpendingBtn) {
    return;
  }

  if (window.location.protocol === "file:") {
    els.analysisStatus.textContent = "Open the app through http://localhost:3000. The AI button will not work from a file preview.";
    return;
  }

  const snapshot = getBudgetSnapshot();
  if (snapshot.totals.income === 0 && snapshot.totals.spent === 0 && snapshot.totals.saved === 0) {
    els.analysisStatus.textContent = "Add some activity first so the AI has something to analyze.";
    return;
  }

  els.analyzeSpendingBtn.disabled = true;
  els.analyzeSpendingBtn.setAttribute("aria-busy", "true");
  els.analysisStatus.textContent = "Analyzing your spending...";
  els.analysisResult.classList.remove("is-empty");
  els.analysisResult.classList.add("is-loading");
  els.analysisResult.innerHTML = `
    <p class="empty-state">Reviewing your monthly activity and preparing recommendations.</p>
  `;

  try {
    const response = await fetch("/api/analyze-budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || `Analysis failed with status ${response.status}.`);
    }

    state.analysis = payload.analysis;
    els.analysisStatus.textContent = "AI analysis ready.";
    renderSummary();
    showFeedback("AI analysis is ready.");
  } catch (error) {
    els.analysisResult.classList.remove("is-loading");
    els.analysisStatus.textContent = error.message.includes("Failed to fetch")
      ? "The AI server is not running yet. Start the local server first."
      : error.message;
    showFeedback(els.analysisStatus.textContent, "error");
  } finally {
    els.analyzeSpendingBtn.disabled = false;
    els.analyzeSpendingBtn.setAttribute("aria-busy", "false");
  }
}

async function handleMonthChange() {
  if (!els.monthInput) {
    return;
  }

  const nextMonth = els.monthInput.value;
  if (!nextMonth || !state.user) {
    return;
  }

  try {
    await loadMonthData(nextMonth);
    saveState();
    showFeedback(`Loaded ${nextMonth} budget.`);
  } catch (error) {
    showFeedback(error.message, "error");
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  if (!state.supabase) {
    return;
  }

  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;
  if (!email || !password) {
    setAuthStatus("Enter both email and password.", "error");
    return;
  }

  els.authSubmitBtn.disabled = true;
  setAuthStatus(state.authMode === "signup" ? "Creating your account..." : "Logging you in...");

  try {
    if (state.authMode === "signup") {
      const { data, error } = await state.supabase.auth.signUp({ email, password });
      if (error) {
        throw error;
      }
      setAuthStatus(
        data.session
          ? "Account created. Loading your workspace..."
          : "Account created. Check your email to confirm your sign-up.",
        "success"
      );
    } else {
      const { error } = await state.supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
      setAuthStatus("Login successful. Loading your workspace...", "success");
    }
  } catch (error) {
    setAuthStatus(error.message || "Authentication failed.", "error");
  } finally {
    els.authSubmitBtn.disabled = false;
  }
}

async function logout() {
  if (!state.supabase) {
    return;
  }

  await state.supabase.auth.signOut();
  setAuthStatus("Logged out. Log back in to continue.", "default");
}

async function initialize() {
  if (!els.monthInput || !els.expenseForm || !els.incomeForm || !els.savingsForm || !els.budgetFields) {
    return;
  }

  renderStaticFields();
  const hasSavedState = loadState();
  if (!hasSavedState || !state.month) {
    state.month = getDefaultMonth();
  }

  populateBudgetForm();
  setDefaultDates();
  resetEditing("income");
  resetEditing("expense");
  resetEditing("savings");
  setAuthMode("login");
  setAuthScreen(false);

  els.stepTabs.forEach((tab) => {
    tab.addEventListener("click", () => setActiveStep(tab.dataset.stepTarget));
  });

  els.stepButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveStep(button.dataset.stepGo));
  });

  if (els.startPlanningBtn) {
    els.startPlanningBtn.addEventListener("click", () => setActiveStep("plan"));
  }

  els.budgetForm.addEventListener("input", (event) => {
    renderSummary();
    if (event.target !== els.monthInput) {
      scheduleBudgetSave();
    }
  });
  els.budgetForm.addEventListener("change", async (event) => {
    if (event.target === els.monthInput) {
      await handleMonthChange();
      return;
    }

    try {
      await saveBudgetPlan();
      flashFormState(els.budgetForm, "is-success");
      pulseElements(".summary-card:nth-child(-n+4)");
      showFeedback("Budget plan updated.");
    } catch (error) {
      showFeedback(error.message, "error");
    }
  });
  els.incomeForm.addEventListener("submit", addIncome);
  els.expenseForm.addEventListener("submit", addExpense);
  els.savingsForm.addEventListener("submit", addSavings);

  [els.incomeList, els.savingsList, els.transactionList].forEach((list) => {
    if (list) {
      list.addEventListener("click", removeOrEditEntry);
    }
  });

  if (els.loadSampleBtn) {
    els.loadSampleBtn.addEventListener("click", loadSampleData);
  }
  if (els.analyzeSpendingBtn) {
    els.analyzeSpendingBtn.addEventListener("click", analyzeSpending);
  }
  if (els.clearIncomeBtn) {
    els.clearIncomeBtn.addEventListener("click", clearIncome);
  }
  if (els.clearExpensesBtn) {
    els.clearExpensesBtn.addEventListener("click", clearExpenses);
  }
  if (els.clearSavingsBtn) {
    els.clearSavingsBtn.addEventListener("click", clearSavings);
  }
  if (els.authForm) {
    els.authForm.addEventListener("submit", handleAuthSubmit);
  }
  if (els.authToggleBtn) {
    els.authToggleBtn.addEventListener("click", () => {
      setAuthMode(state.authMode === "login" ? "signup" : "login");
      setAuthStatus(
        state.authMode === "signup"
          ? "Create an account to start saving your budget securely."
          : "Log in to load your saved budget.",
        "default"
      );
    });
  }
  if (els.logoutBtn) {
    els.logoutBtn.addEventListener("click", logout);
  }

  if (window.location.protocol === "file:" && els.analysisStatus) {
    els.analysisStatus.textContent = "AI analysis needs the local server. Start it and open http://localhost:3000.";
  }

  window.addEventListener("resize", () => drawBudgetChart(getSpentByCategory()));

  setActiveStep("welcome");
  renderSummary();

  try {
    const supabase = await initializeSupabase();
    supabase.auth.onAuthStateChange(async (_event, session) => {
      await handleSession(session);
    });
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }
    await handleSession(data.session);
    setAuthStatus("Log in to load your saved budget, or create an account to get started.");
  } catch (error) {
    setAuthStatus(error.message || "Unable to initialize authentication.", "error");
    showFeedback(error.message || "Unable to initialize authentication.", "error");
  }
}

initialize();
