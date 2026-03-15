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

const EXPENSE_CATEGORIES = CATEGORY_CONFIG.map((category) => category.key);
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
  expenses: [
    { id: 1, title: "Rent", amount: 1400, category: "Housing", date: "2026-03-01" },
    { id: 2, title: "Supermarket", amount: 300, category: "Food", date: "2026-03-05" },
    { id: 3, title: "Gas and tolls", amount: 300, category: "Transport", date: "2026-03-08" },
    { id: 4, title: "Course payment", amount: 300, category: "Other", date: "2026-03-10" },
    { id: 5, title: "Phone and gym", amount: 150, category: "Other", date: "2026-03-11" },
    { id: 6, title: "Debt payment", amount: 700, category: "Debt", date: "2026-03-12" },
  ],
};

const state = {
  month: "",
  budgets: Object.fromEntries(EXPENSE_CATEGORIES.map((category) => [category, 0])),
  incomes: [],
  expenses: [],
  analysis: null,
};

const els = {
  budgetForm: document.getElementById("budgetForm"),
  incomeForm: document.getElementById("incomeForm"),
  expenseForm: document.getElementById("expenseForm"),
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
  categoryList: document.getElementById("categoryList"),
  insightsList: document.getElementById("insightsList"),
  incomeList: document.getElementById("incomeList"),
  transactionList: document.getElementById("transactionList"),
  plannedTotal: document.getElementById("plannedTotal"),
  incomeTotal: document.getElementById("incomeTotal"),
  spentTotal: document.getElementById("spentTotal"),
  remainingTotal: document.getElementById("remainingTotal"),
  healthStatus: document.getElementById("healthStatus"),
  healthCopy: document.getElementById("healthCopy"),
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
};

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
    els.expenseCategory.innerHTML = EXPENSE_CATEGORIES.map((category) => `
      <option value="${category}">${category}</option>
    `).join("");
  }

  els.budgetInputs = Array.from(document.querySelectorAll(".category-budget"));
}

function setActiveStep(stepName) {
  if (!stepName) {
    return;
  }

  els.stepTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.stepTarget === stepName);
  });

  els.stepPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.stepPanel === stepName);
  });
}

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
  return Number.parseFloat(value) || 0;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function updateStateFromForm() {
  state.month = els.monthInput.value;

  els.budgetInputs.forEach((input) => {
    state.budgets[input.dataset.category] = parseAmount(input.value);
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
  const spent = Object.fromEntries(EXPENSE_CATEGORIES.map((category) => [category, 0]));

  state.expenses.forEach((expense) => {
    spent[expense.category] = (spent[expense.category] || 0) + expense.amount;
  });

  return spent;
}

function getTotalIncome() {
  return sum(state.incomes.map((income) => income.amount));
}

function buildInsights(totalIncome, spentByCategory) {
  const rentRatio = totalIncome > 0 ? (spentByCategory.Housing || 0) / totalIncome : 0;
  const savingsRatio = totalIncome > 0 ? (spentByCategory.Savings || 0) / totalIncome : 0;
  const fixedTotal = (spentByCategory.Bills || 0) + (spentByCategory.Food || 0) + (spentByCategory.Health || 0);
  const fixedRatio = totalIncome > 0 ? fixedTotal / totalIncome : 0;
  const debtRatio = totalIncome > 0 ? (spentByCategory.Debt || 0) / totalIncome : 0;

  return [
    {
      title: "Savings",
      value: `${Math.round(savingsRatio * 100)}% of income`,
      body:
        savingsRatio === 0
          ? "Try to save even a small amount this month. Small steps build long-term progress."
          : savingsRatio < 0.1
            ? "Nice start. If possible, increase savings a bit more and work toward 10% of income."
            : "Saving 10% or more of income is a strong habit. Keep that pace going.",
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
  const totalIncome = getTotalIncome();

  els.categoryList.innerHTML = "";

  els.categoryList.innerHTML = EXPENSE_CATEGORIES.map((category) => {
    const budget = state.budgets[category] || 0;
    const spent = spentByCategory[category] || 0;
    const hasBudget = budget > 0;
    const comparisonBase = hasBudget ? budget : totalIncome;
    const ratio = comparisonBase > 0 ? Math.min((spent / comparisonBase) * 100, 100) : 0;
    const percentLabel = comparisonBase > 0 ? Math.round((spent / comparisonBase) * 100) : 0;
    const overBudget = hasBudget && spent > budget;
    const comparisonLabel = hasBudget
      ? `${formatCurrency(spent)} / ${formatCurrency(budget)}`
      : `${formatCurrency(spent)} / ${formatCurrency(totalIncome)} income`;

    return `
      <article class="category-card">
      <div class="category-meta">
        <strong>${category}</strong>
        <span>${comparisonLabel}</span>
      </div>
      <div class="category-progress">
        <div class="progress-track">
          <div class="progress-bar ${overBudget ? "progress-over" : ""}" style="width: ${ratio}%"></div>
        </div>
        <span>${percentLabel}%</span>
      </div>
      </article>
    `;
  }).join("");
}

function renderEntries(listElement, entries, emptyCopy) {
  if (entries.length === 0) {
    listElement.innerHTML = `
      <div class="empty-state">
        ${emptyCopy}
      </div>
    `;
    return;
  }

  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  listElement.innerHTML = sortedEntries.map((entry) => `
    <article class="transaction-item">
      <div class="transaction-main">
        <div class="transaction-badge">${entry.category.slice(0, 1)}</div>
        <div>
          <strong>${entry.title}</strong>
          <div class="transaction-meta">${entry.category} - ${entry.date}</div>
        </div>
      </div>
      <div class="transaction-amount">
        <strong>${formatCurrency(entry.amount)}</strong>
        <button class="text-button" type="button" data-id="${entry.id}">Remove</button>
      </div>
    </article>
  `).join("");
}

function getBudgetSnapshot() {
  updateStateFromForm();

  const totalIncome = getTotalIncome();
  const totalSpent = sum(state.expenses.map((expense) => expense.amount));
  const spentByCategory = getSpentByCategory();
  const topCategories = Object.entries(spentByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const overBudgetCategories = EXPENSE_CATEGORIES.filter((category) => {
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
      remaining: totalIncome - totalSpent,
      planned: sum(Object.values(state.budgets)),
    },
    budgets: state.budgets,
    spentByCategory,
    topCategories,
    overBudgetCategories,
    incomes: state.incomes,
    expenses: state.expenses,
  };
}

function renderAnalysis() {
  if (!els.analysisResult) {
    return;
  }

  if (!state.analysis) {
    els.analysisResult.classList.add("is-empty");
    els.analysisResult.innerHTML = `<p class="empty-state">Your AI analysis will appear here after you run it.</p>`;
    return;
  }

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

function renderSummary() {
  updateStateFromForm();

  const planned = sum(Object.values(state.budgets));
  const income = getTotalIncome();
  const spent = sum(state.expenses.map((expense) => expense.amount));
  const remaining = income - spent;
  const spentByCategory = getSpentByCategory();
  const insights = buildInsights(income, spentByCategory);
  const overBudget = spent > income && income > 0;

  els.plannedTotal.textContent = formatCurrency(planned);
  els.incomeTotal.textContent = formatCurrency(income);
  els.spentTotal.textContent = formatCurrency(spent);
  els.remainingTotal.textContent = formatCurrency(remaining);
  els.healthStatus.textContent = overBudget ? "Overspending" : "On Track";
  els.healthCopy.textContent = overBudget
    ? "Expenses are higher than income right now."
    : "Spending is currently within your income.";

  els.heroBudget.textContent = formatCurrency(planned);
  els.heroSpent.textContent = formatCurrency(spent);
  els.heroRemaining.textContent = formatCurrency(remaining);

  renderCategoryBreakdown();
  renderEntries(els.incomeList, state.incomes, "No income entries yet. Add a paycheck or side income to begin.");
  renderEntries(els.transactionList, state.expenses, "No expenses yet. Add your first purchase to start tracking this month.");
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
}

function addIncome(event) {
  event.preventDefault();

  const title = els.incomeName.value.trim();
  const amount = parseAmount(els.incomeAmount.value);
  const category = els.incomeCategory.value;
  const date = els.incomeDate.value;

  if (!title || !amount || !date) {
    return;
  }

  state.incomes.push({
    id: Date.now(),
    title,
    amount,
    category,
    date,
  });

  els.incomeForm.reset();
  els.incomeDate.value = new Date().toISOString().split("T")[0];
  renderSummary();
}

function addExpense(event) {
  event.preventDefault();

  const title = els.expenseName.value.trim();
  const amount = parseAmount(els.expenseAmount.value);
  const category = els.expenseCategory.value;
  const date = els.expenseDate.value;

  if (!title || !amount || !date) {
    return;
  }

  state.expenses.push({
    id: Date.now(),
    title,
    amount,
    category,
    date,
  });

  els.expenseForm.reset();
  els.expenseDate.value = new Date().toISOString().split("T")[0];
  renderSummary();
}

function removeExpense(event) {
  const button = event.target.closest("[data-id]");
  if (!button) {
    return;
  }

  const expenseId = Number(button.dataset.id);
  const incomeMatch = state.incomes.some((income) => income.id === expenseId);
  if (incomeMatch) {
    state.incomes = state.incomes.filter((income) => income.id !== expenseId);
  } else {
    state.expenses = state.expenses.filter((expense) => expense.id !== expenseId);
  }
  renderSummary();
}

function loadSampleData() {
  state.month = sampleState.month;
  state.budgets = { ...state.budgets, ...sampleState.budgets };
  state.incomes = sampleState.incomes.map((income) => ({ ...income }));
  state.expenses = sampleState.expenses.map((expense) => ({ ...expense }));
  populateBudgetForm();
  els.incomeDate.value = new Date().toISOString().split("T")[0];
  els.expenseDate.value = new Date().toISOString().split("T")[0];
  renderSummary();
}

function clearIncome() {
  state.incomes = [];
  renderSummary();
}

function clearExpenses() {
  state.expenses = [];
  renderSummary();
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
  if (snapshot.totals.income === 0 && snapshot.totals.spent === 0) {
    els.analysisStatus.textContent = "Add some income or expenses first so the AI has something to analyze.";
    return;
  }

  els.analyzeSpendingBtn.disabled = true;
  els.analysisStatus.textContent = "Analyzing your spending...";

  try {
    const response = await fetch("/api/analyze-budget", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(snapshot),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Analysis failed.");
    }

    state.analysis = payload.analysis;
    els.analysisStatus.textContent = "AI analysis ready.";
    renderAnalysis();
  } catch (error) {
    els.analysisStatus.textContent = error.message.includes("Failed to fetch")
      ? "The AI server is not running yet. Start the local server first."
      : error.message;
  } finally {
    els.analyzeSpendingBtn.disabled = false;
  }
}

function initialize() {
  if (!els.monthInput || !els.expenseForm || !els.incomeForm || !els.budgetFields) {
    return;
  }

  renderStaticFields();

  const today = new Date();
  els.monthInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  els.incomeDate.value = today.toISOString().split("T")[0];
  els.expenseDate.value = today.toISOString().split("T")[0];

  els.stepTabs.forEach((tab) => {
    tab.addEventListener("click", () => setActiveStep(tab.dataset.stepTarget));
  });

  els.stepButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveStep(button.dataset.stepGo));
  });

  if (els.startPlanningBtn) {
    els.startPlanningBtn.addEventListener("click", () => setActiveStep("plan"));
  }
  els.budgetForm.addEventListener("input", renderSummary);
  els.incomeForm.addEventListener("submit", addIncome);
  els.expenseForm.addEventListener("submit", addExpense);
  if (els.incomeList) {
    els.incomeList.addEventListener("click", removeExpense);
  }
  if (els.transactionList) {
    els.transactionList.addEventListener("click", removeExpense);
  }
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

  if (window.location.protocol === "file:" && els.analysisStatus) {
    els.analysisStatus.textContent = "AI analysis needs the local server. Start it and open http://localhost:3000.";
  }

  setActiveStep("welcome");
  renderSummary();
}

initialize();
