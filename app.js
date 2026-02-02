// ===============================
// TELEGRAM WEBAPP
// ===============================
let tg = null;

if (window.Telegram && window.Telegram.WebApp) {
  tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();
}

// ===============================
// STATE
// ===============================
let currentPeriod = "all";

let lastValues = {
  income: 0,
  expense: 0,
  balance: 0,
  total: 0
};

const operations = [
  { type: "income", amount: 50000, date: "2026-01-20" },
  { type: "expense", amount: 15000, date: "2026-01-22" }
];

let goals = [
  { id: 1, name: "Домик у моря", current: 417507, target: 1500000 },
  { id: 2, name: "Путешествия", current: 446274, target: 620000 }
];

// ===============================
// UTILS
// ===============================
function animateValue(el, start, end, duration = 500) {
  let startTime = null;

  function frame(time) {
    if (!startTime) startTime = time;
    const progress = Math.min((time - startTime) / duration, 1);
    const value = Math.floor(start + (end - start) * progress);
    el.innerText = value.toLocaleString() + " ₽";
    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function haptic(type = "light") {
  if (!tg) return;
  tg.HapticFeedback.impactOccurred(type);
}

function showSaveButton() {
  if (!tg) return;
  tg.MainButton.setText("Сохранить");
  tg.MainButton.show();
}

// ===============================
// PERIOD
// ===============================
function setPeriod(period) {
  currentPeriod = period;
  document
    .querySelectorAll(".periods button")
    .forEach(b => b.classList.remove("active"));
  event.target.classList.add("active");
  calculate();
}

// ===============================
// OPERATIONS
// ===============================
function addOperation(type) {
  const amount = +prompt(
    type === "income" ? "Введите доход" : "Введите расход"
  );
  if (!amount) return;

  operations.push({
    type,
    amount,
    date: new Date().toISOString().split("T")[0]
  });

  calculate();
  haptic("medium");
  showSaveButton();
}

// ===============================
// CALCULATION
// ===============================
function calculate() {
  const now = new Date();

  const filtered = operations.filter(op => {
    if (currentPeriod === "all") return true;
    const days = (now - new Date(op.date)) / 86400000;
    return days <= currentPeriod;
  });

  const income = filtered
    .filter(o => o.type === "income")
    .reduce((s, o) => s + o.amount, 0);

  const expense = filtered
    .filter(o => o.type === "expense")
    .reduce((s, o) => s + o.amount, 0);

  const total = operations.reduce(
    (s, o) => (o.type === "income" ? s + o.amount : s - o.amount),
    0
  );

  animateValue(
    document.getElementById("income"),
    lastValues.income,
    income
  );

  animateValue(
    document.getElementById("expense"),
    lastValues.expense,
    expense
  );

  animateValue(
    document.getElementById("balance"),
    lastValues.balance,
    income - expense
  );

  animateValue(
    document.getElementById("total"),
    lastValues.total,
    total
  );

  lastValues = {
    income,
    expense,
    balance: income - expense,
    total
  };

  renderGoals();
}

// ===============================
// GOALS
// ===============================
function renderGoals() {
  const list = document.getElementById("goalsList");
  list.innerHTML = "";

  goals.forEach(goal => {
    const percent = Math.min(
      100,
      (goal.current / goal.target) * 100
    );

    list.innerHTML += `
      <div class="goal">
        <div class="goal-actions">
          <strong>${goal.name}</strong>
          <div>
            <button onclick="addToGoal(${goal.id})">+</button>
            <button onclick="deleteGoal(${goal.id})">🗑</button>
          </div>
        </div>
        <div class="progress">
          <div class="progress-bar" style="width:${percent}%"></div>
        </div>
        <div class="goal-info">
          ${goal.current.toLocaleString()} ₽ / ${goal.target.toLocaleString()} ₽
        </div>
      </div>
    `;
  });
}
function addGoal() {
  const name = prompt("Название цели");
  const target = +prompt("Сумма цели");
  if (!name || !target) return;

  goals.push({
    id: Date.now(),
    name,
    current: 0,
    target
  });

  renderGoals();
  haptic("light");
  showSaveButton();
}

function addToGoal(id) {
  const amount = +prompt("Сколько добавить?");
  if (!amount) return;

  const goal = goals.find(g => g.id === id);
  goal.current += amount;

  renderGoals();
  haptic("light");
  showSaveButton();

  document.querySelector(".goals").animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.02)" },
      { transform: "scale(1)" }
    ],
    { duration: 300 }
  );
}

// ===== УДАЛЕНИЕ ЦЕЛИ =====
function deleteGoal(id) {
  const goal = goals.find(g => g.id === id);
  if (!goal) return;

  const confirmDelete = confirm(
    'Удалить цель "${goal.name}"?'
  );
  if (!confirmDelete) return;

  goals = goals.filter(g => g.id !== id);

  renderGoals();
  haptic("warning");
  showSaveButton();
}

// ===============================
// TELEGRAM MAIN BUTTON ACTION
// ===============================
if (tg) {
  tg.MainButton.onClick(() => {
    tg.sendData(
      JSON.stringify({
        operations,
        goals
      })
    );

    tg.MainButton.hide();
    haptic("success");
  });
}

// ===============================
calculate();