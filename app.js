// App Logic
let currentUser = null;
let transactions = [];

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// Check Authentication
function checkAuth() {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            // User is signed in.
            initApp();
        } else {
            // No user is signed in. Redirect to login.
            window.location.href = 'index.html';
        }
    });
}

// Initialize Application Data
function initApp() {
    // Set User Name in Welcome Message
    const welcomeMsg = document.getElementById('welcome-msg');
    if (welcomeMsg && currentUser.displayName) {
        welcomeMsg.textContent = `Welcome back, ${currentUser.displayName}!`;
    }

    // Update Header User Info
    const userNameEl = document.getElementById('header-user-name');
    if (userNameEl) userNameEl.textContent = currentUser.displayName || 'User';

    const userEmailEl = document.getElementById('header-user-email');
    if (userEmailEl) userEmailEl.textContent = currentUser.email || '';

    loadDashboard();
    setupNavigation();
    setupModalLogic();
    loadSettings();
    setupFilters();
    setupSignOut();
    setupExportCSV();
}

// Navigation Logic
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active class from all
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));

            // Add active class to clicked
            item.classList.add('active');

            // Show target section
            const targetId = item.getAttribute('href').substring(1); // remove #
            const targetSection = document.getElementById(`view-${targetId}`);
            if (targetSection) {
                targetSection.classList.add('active');
            }

            // Refresh data if needed
            if (targetId === 'transactions') {
                renderTransactions(transactions, 'full-transactions-list');
            }
        });
    });
}

// Load Dashboard Data
function loadDashboard() {
    // Real-time listener for transactions
    // Note: If you get a "The query requires an index" error, create a composite index in Firebase Console
    // Collection: users/{userId}/transactions, Fields: date (Descending)
    const transactionsRef = db.collection('users').doc(currentUser.uid).collection('transactions');

    transactionsRef
        .orderBy('date', 'desc')
        .onSnapshot((snapshot) => {
            transactions = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                transactions.push({
                    id: doc.id,
                    ...data
                });
            });

            updateDashboardUI();

            // Auto-seed if empty
            if (transactions.length === 0) {
                console.log("No transactions found. Attempting to seed data...");
                if (window.seedTransactions) {
                    // Small delay to ensure auth is ready
                    setTimeout(() => window.seedTransactions(true), 1000);
                }
            }
        }, (error) => {
            console.error("Error getting transactions: ", error);
            // If index error, try without orderBy as fallback
            if (error.code === 'failed-precondition') {
                console.warn('Firestore index required. Loading without orderBy...');
                transactionsRef
                    .onSnapshot((snapshot) => {
                        transactions = [];
                        snapshot.forEach((doc) => {
                            const data = doc.data();
                            transactions.push({
                                id: doc.id,
                                ...data
                            });
                        });
                        // Sort manually by date
                        transactions.sort((a, b) => {
                            const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.dateString || a.date);
                            const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.dateString || b.date);
                            return dateB - dateA;
                        });
                        updateDashboardUI();
                    }, (fallbackError) => {
                        console.error("Error loading transactions (fallback): ", fallbackError);
                        alert('Error loading transactions. Please refresh the page.');
                    });
            } else {
                alert('Error loading transactions: ' + error.message);
            }
        });
}

function updateDashboardUI() {
    // Calculate Totals
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const balance = income - expense;

    // Update DOM
    const totalBalanceEl = document.getElementById('total-balance');
    if (totalBalanceEl) totalBalanceEl.textContent = formatCurrency(balance);

    const monthIncomeEl = document.getElementById('month-income');
    if (monthIncomeEl) monthIncomeEl.textContent = formatCurrency(income);

    const monthExpenseEl = document.getElementById('month-expense');
    if (monthExpenseEl) monthExpenseEl.textContent = formatCurrency(expense);

    // Update Transactions Page Summary Cards
    updateTransactionsSummary(transactions);

    // Render Recent Transactions (Limit 5)
    renderTransactions(transactions.slice(0, 5), 'recent-transactions');

    // Render Full Transactions List (if on that view)
    renderTransactions(transactions, 'full-transactions-list');

    // Update Analytics
    updateAnalytics(transactions);

    // Render Charts (Mock for now, but using real data totals)
    renderCharts(income, expense);
}

function updateTransactionsSummary(transactions) {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const balance = income - expense;
    const incomeCount = transactions.filter(t => t.type === 'income').length;
    const expenseCount = transactions.filter(t => t.type === 'expense').length;

    const totalIncomeEl = document.getElementById('transactions-total-income');
    if (totalIncomeEl) totalIncomeEl.textContent = formatCurrency(income);

    const totalExpenseEl = document.getElementById('transactions-total-expense');
    if (totalExpenseEl) totalExpenseEl.textContent = formatCurrency(expense);

    const netBalanceEl = document.getElementById('transactions-net-balance');
    if (netBalanceEl) netBalanceEl.textContent = formatCurrency(balance);

    const incomeCountEl = document.getElementById('transactions-income-count');
    if (incomeCountEl) incomeCountEl.textContent = `+${incomeCount}`;

    const expenseCountEl = document.getElementById('transactions-expense-count');
    if (expenseCountEl) expenseCountEl.textContent = expenseCount.toString();

    const totalCountEl = document.getElementById('transactions-total-count');
    if (totalCountEl) totalCountEl.textContent = `${transactions.length} total`;
}

function updateAnalytics(transactions) {
    // Calculate YTD totals
    const currentYear = new Date().getFullYear();
    const ytdTransactions = transactions.filter(t => {
        const date = t.date && typeof t.date.toDate === 'function' ? t.date.toDate() : new Date(t.date);
        return date.getFullYear() === currentYear;
    });

    const ytdIncome = ytdTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const ytdExpense = ytdTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Update YTD cards - find by parent stat-card
    const analyticsCards = document.querySelectorAll('#view-analytics .stat-card');
    analyticsCards.forEach(card => {
        const header = card.querySelector('.stat-header span');
        const valueEl = card.querySelector('.stat-value');
        if (header && valueEl) {
            if (header.textContent.includes('Total Income (YTD)')) {
                valueEl.textContent = formatCurrency(ytdIncome);
            } else if (header.textContent.includes('Total Expense (YTD)')) {
                valueEl.textContent = formatCurrency(ytdExpense);
            } else if (header.textContent.includes('Top Category')) {
                // Find Top Category
                const categoryTotals = {};
                transactions
                    .filter(t => t.type === 'expense')
                    .forEach(t => {
                        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount);
                    });

                const topCategory = Object.keys(categoryTotals).length > 0
                    ? Object.keys(categoryTotals).reduce((a, b) =>
                        categoryTotals[a] > categoryTotals[b] ? a : b)
                    : null;

                valueEl.textContent = topCategory ? formatCurrency(categoryTotals[topCategory]) : '-';
            }
        }
    });

    // Calculate Summary Metrics
    const monthlyData = {};
    transactions.forEach(t => {
        const date = t.date && typeof t.date.toDate === 'function' ? t.date.toDate() : new Date(t.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            monthlyData[monthKey].income += parseFloat(t.amount);
        } else {
            monthlyData[monthKey].expense += parseFloat(t.amount);
        }
    });

    const months = Object.keys(monthlyData);
    const avgMonthlyIncome = months.length > 0
        ? Object.values(monthlyData).reduce((sum, m) => sum + m.income, 0) / months.length
        : 0;
    const avgMonthlyExpense = months.length > 0
        ? Object.values(monthlyData).reduce((sum, m) => sum + m.expense, 0) / months.length
        : 0;

    const savingsRate = avgMonthlyIncome > 0
        ? Math.round(((avgMonthlyIncome - avgMonthlyExpense) / avgMonthlyIncome) * 100)
        : 0;

    const savingsRateEl = document.getElementById('savings-rate');
    if (savingsRateEl) savingsRateEl.textContent = `${savingsRate}%`;

    const avgExpenseEl = document.getElementById('avg-monthly-expense');
    if (avgExpenseEl) avgExpenseEl.textContent = formatCurrency(avgMonthlyExpense);

    const avgIncomeEl = document.getElementById('avg-monthly-income');
    if (avgIncomeEl) avgIncomeEl.textContent = formatCurrency(avgMonthlyIncome);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function renderTransactions(list, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = '<p class="text-center" style="padding: 1rem; color: var(--text-light);">No transactions found.</p>';
        return;
    }

    list.forEach(t => {
        const isIncome = t.type === 'income';
        const amountClass = isIncome ? 'positive' : 'negative';
        const amountPrefix = isIncome ? '+' : '-';
        const icon = getCategoryIcon(t.category);

        const itemHtml = `
            <div class="transaction-item">
                <div class="t-info">
                    <div class="t-icon" style="background-color: ${isIncome ? '#ECFDF5' : '#FEF2F2'}; color: ${isIncome ? '#10B981' : '#EF4444'}">
                        ${icon}
                    </div>
                    <div class="t-details">
                        <h4>${t.description}</h4>
                        <div class="t-meta">
                            <span class="t-category-tag">${t.category}</span>
                            <span class="t-date">${formatDate(t.date)}</span>
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="t-right">
                        <span class="t-amount ${amountClass}">${amountPrefix}${formatCurrency(t.amount)}</span>
                        <span class="t-type-tag">${t.type}</span>
                    </div>
                    ${containerId === 'full-transactions-list' ? `
                    <div class="t-actions">
                        <button class="t-action-btn" onclick="editTransaction('${t.id}')" title="Edit">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="t-action-btn" onclick="deleteTransaction('${t.id}')" title="Delete">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        container.innerHTML += itemHtml;
    });
}

function getCategoryIcon(category) {
    // Simple icon mapping
    const icons = {
        'Food': '🍔',
        'Transportation': '🚗',
        'Entertainment': '🎬',
        'Utilities': '💡',
        'Salary': '💰',
        'Freelance': '💻',
        'Other': '📦'
    };
    return icons[category] || '📦';
}

function formatDate(dateString) {
    // Handle both Firestore Timestamp and string dates
    let date;
    if (dateString && typeof dateString.toDate === 'function') {
        date = dateString.toDate();
    } else {
        date = new Date(dateString);
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
    }).format(date);
}

// Modal Logic
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex'; // Ensure flex display
        setTimeout(() => modal.style.opacity = '1', 10);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }, 200);
    }
}

// Expose to window for HTML attributes
window.openModal = openModal;
window.closeModal = closeModal;

function setupModalLogic() {
    // Sign Out Modal
    window.confirmSignOut = () => {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error('Sign Out Error', error);
        });
    };

    // Add Transaction Modal
    const addTransactionForm = document.getElementById('form-add-transaction');
    if (addTransactionForm) {
        addTransactionForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const type = document.querySelector('input[name="type"]:checked').value;
            const amount = parseFloat(document.getElementById('t-amount').value);
            const category = document.getElementById('t-category').value;
            const date = document.getElementById('t-date').value;
            const description = document.getElementById('t-description').value;
            const receiptFile = document.getElementById('t-receipt').files[0];

            // Prepare transaction data
            // Convert date string to Firestore Timestamp for better querying
            const dateObj = new Date(date);
            const transactionData = {
                type,
                amount,
                category,
                date: firebase.firestore.Timestamp.fromDate(dateObj), // Store as Firestore Timestamp
                dateString: date, // Also keep string version for easy display
                description,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // If receipt is uploaded, upload it to Firebase Storage first
            if (receiptFile) {
                const receiptRef = storage.ref(`receipts/${currentUser.uid}/${Date.now()}_${receiptFile.name}`);
                receiptRef.put(receiptFile)
                    .then((snapshot) => {
                        return snapshot.ref.getDownloadURL();
                    })
                    .then((downloadURL) => {
                        transactionData.receiptUrl = downloadURL;
                        // Add transaction to Firestore with receipt URL
                        return db.collection('users').doc(currentUser.uid).collection('transactions').add(transactionData);
                    })
                    .then(() => {
                        closeModal('modal-add-transaction');
                        addTransactionForm.reset();
                        // Reset date to today
                        document.getElementById('t-date').valueAsDate = new Date();
                    })
                    .catch((error) => {
                        console.error("Error adding transaction with receipt: ", error);
                        alert("Failed to add transaction. Please try again.");
                    });
            } else {
                // Add transaction to Firestore without receipt
                db.collection('users').doc(currentUser.uid).collection('transactions').add(transactionData)
                    .then(() => {
                        closeModal('modal-add-transaction');
                        addTransactionForm.reset();
                        // Reset date to today
                        document.getElementById('t-date').valueAsDate = new Date();
                    })
                    .catch((error) => {
                        console.error("Error adding transaction: ", error);
                        alert("Failed to add transaction.");
                    });
            }
        });

        // Set default date to today
        const dateInput = document.getElementById('t-date');
        if (dateInput) dateInput.valueAsDate = new Date();
    }
}

// Settings Logic
function loadSettings() {
    if (currentUser) {
        const nameInput = document.getElementById('settings-name');
        if (nameInput) nameInput.value = currentUser.displayName || '';

        const emailInput = document.getElementById('settings-email');
        if (emailInput) emailInput.value = currentUser.email || '';
    }
}

// Chart Rendering (Simplified)
function renderCharts(income, expense) {
    // This would ideally use a library like Chart.js
    // For now, we'll just log or do a simple visual update if we had SVG bars
    // console.log(`Rendering Charts: Income ${income}, Expense ${expense}`);
}

// Filter Logic
function setupFilters() {
    const searchInput = document.getElementById('filter-search');
    const typeSelect = document.getElementById('filter-type');
    const categorySelect = document.getElementById('filter-category');
    const clearBtn = document.getElementById('btn-clear-filters');

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (typeSelect) typeSelect.value = 'all';
            if (categorySelect) categorySelect.value = 'all';
            applyFilters();
        });
    }

    [searchInput, typeSelect, categorySelect].forEach(el => {
        if (el) {
            el.addEventListener('change', applyFilters);
            el.addEventListener('input', applyFilters);
        }
    });
}

function applyFilters() {
    const searchTerm = document.getElementById('filter-search')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('filter-type')?.value || 'all';
    const categoryFilter = document.getElementById('filter-category')?.value || 'all';

    const filtered = transactions.filter(t => {
        const matchesSearch = !searchTerm ||
            t.description.toLowerCase().includes(searchTerm) ||
            t.category.toLowerCase().includes(searchTerm);
        const matchesType = typeFilter === 'all' || t.type === typeFilter;
        const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
        return matchesSearch && matchesType && matchesCategory;
    });

    renderTransactions(filtered, 'full-transactions-list');
    updateTransactionsSummary(filtered);
}

// Transaction Actions
window.editTransaction = function (id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    // Populate form with transaction data
    document.getElementById('t-amount').value = transaction.amount;
    document.getElementById('t-category').value = transaction.category;
    document.getElementById('t-description').value = transaction.description;

    // Format date for input
    let dateValue = transaction.date;
    if (dateValue && typeof dateValue.toDate === 'function') {
        dateValue = dateValue.toDate();
    }
    if (dateValue instanceof Date) {
        document.getElementById('t-date').valueAsDate = dateValue;
    } else if (typeof dateValue === 'string') {
        document.getElementById('t-date').value = dateValue;
    }

    // Set type
    if (transaction.type === 'income') {
        document.getElementById('type-income').checked = true;
    } else {
        document.getElementById('type-expense').checked = true;
    }

    // Open modal
    openModal('modal-add-transaction');

    // Update form submit to edit instead of add
    const form = document.getElementById('form-add-transaction');
    const originalHandler = form.onsubmit;

    // Remove existing submit listener temporarily
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    const updatedForm = document.getElementById('form-add-transaction');

    updatedForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const dateValue = document.getElementById('t-date').value;
        const dateObj = new Date(dateValue);

        const updateData = {
            type: document.querySelector('input[name="type"]:checked').value,
            amount: parseFloat(document.getElementById('t-amount').value),
            category: document.getElementById('t-category').value,
            date: firebase.firestore.Timestamp.fromDate(dateObj), // Store as Firestore Timestamp
            dateString: dateValue, // Also keep string version
            description: document.getElementById('t-description').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const receiptFile = document.getElementById('t-receipt').files[0];

        // If new receipt is uploaded, upload it first
        if (receiptFile) {
            const receiptRef = storage.ref(`receipts/${currentUser.uid}/${Date.now()}_${receiptFile.name}`);
            receiptRef.put(receiptFile)
                .then((snapshot) => {
                    return snapshot.ref.getDownloadURL();
                })
                .then((downloadURL) => {
                    updateData.receiptUrl = downloadURL;
                    // Update transaction in Firestore with new receipt URL
                    return db.collection('users').doc(currentUser.uid).collection('transactions').doc(id).update(updateData);
                })
                .then(() => {
                    closeModal('modal-add-transaction');
                    updatedForm.reset();
                    document.getElementById('t-date').valueAsDate = new Date();
                    // Restore original form handler
                    location.reload(); // Simple way to reset form handlers
                })
                .catch(error => {
                    console.error('Error updating transaction:', error);
                    alert('Failed to update transaction.');
                });
        } else {
            // Update transaction in Firestore without new receipt
            db.collection('users').doc(currentUser.uid).collection('transactions').doc(id).update(updateData)
                .then(() => {
                    closeModal('modal-add-transaction');
                    updatedForm.reset();
                    document.getElementById('t-date').valueAsDate = new Date();
                    location.reload(); // Simple way to reset form handlers
                })
                .catch(error => {
                    console.error('Error updating transaction:', error);
                    alert('Failed to update transaction.');
                });
        }
    });
};

window.deleteTransaction = function (id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    db.collection('users').doc(currentUser.uid).collection('transactions').doc(id).delete()
        .then(() => {
            console.log('Transaction deleted');
        })
        .catch(error => {
            console.error('Error deleting transaction:', error);
            alert('Failed to delete transaction.');
        });
};

// Sign Out Button
function setupSignOut() {
    const signOutBtn = document.getElementById('btn-signout');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            openModal('modal-signout');
        });
    }
}

// Export CSV
function setupExportCSV() {
    const exportBtn = document.getElementById('btn-export-csv');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportToCSV();
        });
    }
}

function exportToCSV() {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const rows = transactions.map(t => {
        const date = t.date && typeof t.date.toDate === 'function'
            ? t.date.toDate().toLocaleDateString()
            : new Date(t.date).toLocaleDateString();
        return [
            date,
            t.type,
            t.category,
            t.description,
            t.amount
        ];
    });

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}
