// Initialize IndexedDB
const dbName = 'financeTrackerDB';
const dbVersion = 1;
let db;

const request = indexedDB.open(dbName, dbVersion);

request.onerror = (event) => {
    console.error('Database error:', event.target.error);
};

request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains('transactions')) {
        const store = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('date', 'date', { unique: false });
    }
};

request.onsuccess = (event) => {
    db = event.target.result;
    loadTransactions();
    updateDashboard();
};

// Chart initialization
let expensesChart;

function initChart() {
    const ctx = document.getElementById('expensesChart').getContext('2d');
    expensesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#ef4444',
                    '#f97316',
                    '#eab308',
                    '#22c55e',
                    '#3b82f6',
                    '#8b5cf6',
                    '#ec4899'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Transaction handling
function addTransaction(transaction) {
    const transactionStore = db.transaction(['transactions'], 'readwrite').objectStore('transactions');
    transaction.date = new Date();
    transactionStore.add(transaction).onsuccess = () => {
        loadTransactions();
        updateDashboard();
    };
}

function loadTransactions() {
    const transactionStore = db.transaction(['transactions'], 'readonly').objectStore('transactions');
    const request = transactionStore.getAll();
    
    request.onsuccess = () => {
        const transactions = request.result;
        displayTransactions(transactions);
        updateChart(transactions);
    };
}

function displayTransactions(transactions) {
    const transactionsList = document.getElementById('transactionsList');
    transactionsList.innerHTML = '';
    
    transactions.sort((a, b) => b.date - a.date).forEach(transaction => {
        const transactionElement = document.createElement('div');
        transactionElement.className = `transaction-item ${transaction.type}`;
        
        const date = new Date(transaction.date).toLocaleDateString();
        const amount = formatCurrency(transaction.amount);
        
        transactionElement.innerHTML = `
            <div>
                <strong>${transaction.description}</strong>
                <div>${transaction.category} • ${date}</div>
            </div>
            <div class="${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                ${transaction.type === 'income' ? '+' : '-'}${amount}
            </div>
        `;
        
        transactionsList.appendChild(transactionElement);
    });
}

function updateChart(transactions) {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals = {};
    
    expenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    expensesChart.data.labels = Object.keys(categoryTotals);
    expensesChart.data.datasets[0].data = Object.values(categoryTotals);
    expensesChart.update();
}

function updateDashboard() {
    const transactionStore = db.transaction(['transactions'], 'readonly').objectStore('transactions');
    const request = transactionStore.getAll();
    
    request.onsuccess = () => {
        const transactions = request.result;
        const totals = calculateTotals(transactions);
        
        document.getElementById('currentBalance').textContent = formatCurrency(totals.balance);
        document.getElementById('totalIncome').textContent = formatCurrency(totals.income);
        document.getElementById('totalExpenses').textContent = formatCurrency(totals.expenses);
    };
}

function calculateTotals(transactions) {
    return transactions.reduce((acc, transaction) => {
        if (transaction.type === 'income') {
            acc.income += transaction.amount;
        } else {
            acc.expenses += transaction.amount;
        }
        acc.balance = acc.income - acc.expenses;
        return acc;
    }, { income: 0, expenses: 0, balance: 0 });
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function exportToCSV() {
    const transactionStore = db.transaction(['transactions'], 'readonly').objectStore('transactions');
    const request = transactionStore.getAll();
    
    request.onsuccess = () => {
        const transactions = request.result;
        const csv = transactions.map(t => {
            const date = new Date(t.date).toLocaleDateString();
            return `${date},${t.description},${t.type},${t.category},${t.amount}`;
        }).join('\n');
        
        const blob = new Blob([`Date,Description,Type,Category,Amount\n${csv}`], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transactions.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };
}

function exportToJSON() {
    const transactionStore = db.transaction(['transactions'], 'readonly').objectStore('transactions');
    const request = transactionStore.getAll();
    
    request.onsuccess = () => {
        const transactions = request.result;
        const json = JSON.stringify(transactions, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transactions.json';
        a.click();
        window.URL.revokeObjectURL(url);
    };
}

// Event listeners
document.getElementById('transactionForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const transaction = {
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
        type: document.getElementById('type').value,
        category: document.getElementById('category').value
    };
    
    addTransaction(transaction);
    e.target.reset();
});

// Initialize chart when the page loads
document.addEventListener('DOMContentLoaded', initChart); 