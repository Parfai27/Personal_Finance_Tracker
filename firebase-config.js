// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD8whTvpEjV-howtTzAQl3CVi6Eyly8gGY",
    authDomain: "personal-finance-tracker-9be56.firebaseapp.com",
    projectId: "personal-finance-tracker-9be56",
    storageBucket: "personal-finance-tracker-9be56.firebasestorage.appspot.com",
    messagingSenderId: "745831570434",
    appId: "1:745831570434:web:0127bf621a12bba6d31b1b",
    measurementId: "G-DVE85D7SKK"
};

// Initialize Firebase (using Compat SDK)
// Check if Firebase is already initialized to avoid errors
let firebaseApp;
if (!firebase.apps.length) {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
    console.log('📦 Project ID:', firebaseConfig.projectId);
} else {
    firebaseApp = firebase.app();
    console.log('✅ Firebase already initialized');
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage(); // Initialize Storage for receipt uploads

// Verify services are available
console.log('✅ Firebase Auth:', auth ? 'Ready' : 'Not available');
console.log('✅ Firestore:', db ? 'Ready' : 'Not available');
console.log('✅ Firebase Storage:', storage ? 'Ready' : 'Not available');

// Enable offline persistence for better user experience
db.enablePersistence()
    .then(() => {
        console.log('Firestore offline persistence enabled');
    })
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
            console.warn('The current browser does not support persistence.');
        } else {
            console.error('Error enabling persistence:', err);
        }
    });

// Set Firestore settings for better performance
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Export for use in other files (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { auth, db, storage };
}
