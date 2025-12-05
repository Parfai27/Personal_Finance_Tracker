/**
 * Seeder script to populate Firestore with sample transaction data
 */

async function seedTransactions(auto = false) {
    if (!currentUser) {
        if (!auto) alert("Please sign in first!");
        return;
    }

    if (!auto && !confirm("This will add sample transactions to your account. Continue?")) {
        return;
    }

    const categories = ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Salary', 'Freelance', 'Other'];
    const types = ['expense', 'income'];
    const descriptions = {
        'Food': ['Grocery Shopping', 'Lunch at Cafe', 'Dinner with Friends', 'Snacks', 'Coffee'],
        'Transportation': ['Uber Ride', 'Gas Station', 'Bus Ticket', 'Car Maintenance'],
        'Entertainment': ['Movie Night', 'Concert Tickets', 'Netflix Subscription', 'Video Game'],
        'Utilities': ['Electricity Bill', 'Water Bill', 'Internet Bill', 'Phone Bill'],
        'Salary': ['Monthly Salary', 'Bonus'],
        'Freelance': ['Web Design Project', 'Consulting Fee', 'Logo Design'],
        'Other': ['Gift', 'Charity', 'Miscellaneous']
    }

    const batch = db.batch();
    const userDocRef = db.collection('users').doc(currentUser.uid);
    const transactionsRef = userDocRef.collection('transactions');

    // Ensure user document exists (set with merge to avoid overwriting)
    batch.set(userDocRef, {
        email: currentUser.email,
        displayName: currentUser.displayName || 'User',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Generate 15 random transactions
    for (let i = 0; i < 15; i++) {
        const type = Math.random() > 0.3 ? 'expense' : 'income'; // 70% expenses
        let category;

        if (type === 'income') {
            category = Math.random() > 0.7 ? 'Salary' : 'Freelance';
        } else {
            const expenseCategories = categories.filter(c => c !== 'Salary' && c !== 'Freelance');
            category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
        }

        const possibleDescriptions = descriptions[category] || ['Transaction'];
        const description = possibleDescriptions[Math.floor(Math.random() * possibleDescriptions.length)];

        // Random amount between 10 and 500 (higher for income)
        let amount;
        if (type === 'income') {
            amount = Math.floor(Math.random() * 2000) + 1000;
        } else {
            amount = Math.floor(Math.random() * 150) + 10;
        }

        // Random date within last 30 days
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));

        const docRef = transactionsRef.doc();
        batch.set(docRef, {
            type,
            amount,
            category,
            description,
            date: firebase.firestore.Timestamp.fromDate(date),
            dateString: date.toISOString().split('T')[0],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    try {
        await batch.commit();
        if (!auto) alert("Successfully added sample transactions!");
        // Reload to show new data
        location.reload();
    } catch (error) {
        console.error("Error seeding data:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        if (!auto) alert("Error seeding data: " + error.message);
    }
}
