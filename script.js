let startingBalance = 0;
let balance = 0;
let transactions = [];
let automation = { amount: 0, day: null };
let lineChart, pieChart, barChart;

// Show page function
function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(page).classList.remove("hidden");
}

// Add transaction
function addTransaction() {
  const desc = document.getElementById("desc").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;

  if (!desc || isNaN(amount)) {
    alert("Enter description and amount.");
    return;
  }

  const signedAmount = type === "out" ? -amount : amount;
  const date = new Date().toLocaleString();
  transactions.push({ desc, amount: signedAmount, type, date });

  balance += signedAmount;
  document.getElementById("balance").innerText = balance.toFixed(2);
  updateNetChange();

  renderTransactions();
  updateCharts();
  saveData();

  document.getElementById("desc").value = "";
  document.getElementById("amount").value = "";
}

// Render transactions with date
function renderTransactions() {
  const list = document.getElementById("transactions");
  list.innerHTML = "";
  transactions.forEach(t => {
    const li = document.createElement("li");
    li.innerText = `${t.date} — ${t.desc}: £${t.amount}`;
    list.appendChild(li);
  });
}

// Setup charts
function setupCharts() {
  const lineCtx = document.getElementById("lineChart").getContext("2d");
  lineChart = new Chart(lineCtx, {
    type: "line",
    data: { labels: [], datasets: [{ label: "Total Balance", data: [], borderColor: "blue", fill: false }] },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 50 }
        }
      }
    }
  });

  const pieCtx = document.getElementById("pieChart").getContext("2d");
  pieChart = new Chart(pieCtx, {
    type: "pie",
    data: { labels: ["Balance", "Expenses"], datasets: [{ data: [0, 0], backgroundColor: ["green", "red"] }] },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const dataset = context.dataset;
              const total = dataset.data.reduce((a,b)=>a+b,0);
              const value = dataset.data[context.dataIndex];
              const percent = total > 0 ? ((value/total)*100).toFixed(1) : 0;
              return `${context.label}: £${value} (${percent}%)`;
            }
          }
        }
      }
    }
  });

  const barCtx = document.getElementById("barChart").getContext("2d");
  barChart = new Chart(barCtx, {
    type: "bar",
    data: { labels: ["Income", "Expenses"], datasets: [{ data: [0, 0], backgroundColor: ["green", "red"] }] },
    options: { responsive: true }
  });
}

// Update charts
function updateCharts() {
  const totalIncome = transactions.filter(t => t.type === "in").reduce((a,b)=>a+b.amount,0);
  const totalExpenses = -transactions.filter(t => t.type === "out").reduce((a,b)=>a+b.amount,0);

  // Line chart
  const lineData = [];
  let runningTotal = startingBalance;
  lineChart.data.labels = transactions.map((t,i)=>i+1);
  transactions.forEach(t => {
    runningTotal += t.amount;
    lineData.push(runningTotal);
  });
  lineChart.data.datasets[0].data = lineData;
  lineChart.update();

  // Pie chart
  pieChart.data.datasets[0].data = [balance, totalExpenses];
  pieChart.update();

  // Bar chart
  barChart.data.datasets[0].data = [totalIncome, totalExpenses];
  barChart.update();
}

// Update Y-axis step
function updateYStep(step) {
  const numStep = Number(step);
  document.getElementById("yStepValue").innerText = numStep;
  lineChart.options.scales.y.ticks.stepSize = numStep;
  lineChart.update();
}

// Update net change
function updateNetChange() {
  const net = balance - startingBalance;
  document.getElementById("netChange").innerText = net.toFixed(2);
}

// Settings functions
function setStartingBalance() {
  const start = parseFloat(document.getElementById("startBalance").value);
  if (!isNaN(start)) {
    startingBalance = start;
    balance = startingBalance + transactions.reduce((a,b)=>a+b.amount,0);
    document.getElementById("balance").innerText = balance.toFixed(2);
    updateNetChange();
    updateCharts();
    saveData();
  }
}

function setAutomation() {
  const amount = parseFloat(document.getElementById("autoAmount").value);
  const day = parseInt(document.getElementById("autoDay").value);
  if (!isNaN(amount) && !isNaN(day)) {
    automation = { amount, day };
    alert("Automation saved!");
    saveData();
  }
}

// Manual save
function forceSave() {
  saveData();
  alert("Data saved!");
}

// Reset all data
function resetData() {
  if (confirm("Are you sure you want to reset all data?")) {
    startingBalance = 0;
    balance = 0;
    transactions = [];
    automation = { amount: 0, day: null };
    document.getElementById("balance").innerText = "0";
    document.getElementById("netChange").innerText = "0";
    document.getElementById("startBalance").value = "";
    document.getElementById("autoAmount").value = "";
    document.getElementById("autoDay").value = "";
    document.getElementById("salary").value = "";
    document.getElementById("taxResult").innerText = "";
    renderTransactions();
    updateCharts();
    saveData();
  }
}

// Save everything to localStorage
function saveData() {
  const data = { startingBalance, transactions, automation };
  localStorage.setItem("expenseTrackerData", JSON.stringify(data));
}

// Load from localStorage
function loadData() {
  const saved = localStorage.getItem("expenseTrackerData");
  if (saved) {
    const data = JSON.parse(saved);
    startingBalance = data.startingBalance || 0;
    transactions = data.transactions || [];
    automation = data.automation || { amount: 0, day: null };
    balance = startingBalance + transactions.reduce((a,b)=>a+b.amount,0);
    document.getElementById("balance").innerText = balance.toFixed(2);
    document.getElementById("startBalance").value = startingBalance;
    document.getElementById("autoAmount").value = automation.amount;
    document.getElementById("autoDay").value = automation.day;
    updateNetChange();
    renderTransactions();
    updateCharts();
  }
}

// Simulate monthly automation (every 10s demo)
setInterval(() => {
  const day = new Date().getDate();
  if (automation.day === day && automation.amount > 0) {
    transactions.push({ desc: "Automated Income", amount: automation.amount, type: "in", date: new Date().toLocaleString() });
    balance += automation.amount;
    document.getElementById("balance").innerText = balance.toFixed(2);
    updateNetChange();
    renderTransactions();
    updateCharts();
    saveData();
  }
}, 10000);

// Tax calculator
function calcTax() {
  const salary = parseFloat(document.getElementById("salary").value);
  if (isNaN(salary)) {
    alert("Enter salary.");
    return;
  }
  let tax = 0;
  if (salary > 12570) {
    tax += Math.min(salary - 12570, 37570) * 0.2;
    if (salary > 50270) {
      tax += Math.min(salary - 50270, 99999) * 0.4;
    }
  }
  document.getElementById("taxResult").innerText = `Estimated Tax: £${tax.toFixed(2)}`;
}

// Init
setupCharts();
loadData();
showPage("tracker");
