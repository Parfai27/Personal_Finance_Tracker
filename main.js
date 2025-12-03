// DOM Elements
const tabSignin = document.getElementById('tab-signin');
const tabSignup = document.getElementById('tab-signup');
const formSignin = document.getElementById('form-signin');
const formSignup = document.getElementById('form-signup');

// Tab Switching Logic
function switchTab(tab) {
    if (tab === 'signin') {
        tabSignin.classList.add('active');
        tabSignup.classList.remove('active');
        formSignin.classList.remove('hidden');
        formSignup.classList.add('hidden');
    } else {
        tabSignup.classList.add('active');
        tabSignin.classList.remove('active');
        formSignup.classList.remove('hidden');
        formSignin.classList.add('hidden');
    }
}

// Auth Logic (Local Storage)
const USERS_KEY = 'pft_users';
const CURRENT_USER_KEY = 'pft_current_user';

function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

function saveUser(user) {
    const users = getUsers();
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function findUser(email) {
    const users = getUsers();
    return users.find(u => u.email === email);
}

// Registration
formSignup.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (findUser(email)) {
        alert('User already exists with this email.');
        return;
    }

    if (password.length < 8) {
        alert('Password must be at least 8 characters long.');
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password // In a real app, hash this!
    };

    saveUser(newUser);
    alert('Account created successfully! Please sign in.');
    switchTab('signin');
    formSignup.reset();
});

// Login
formSignin.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    const user = findUser(email);

    if (user && user.password === password) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        alert(`Welcome back, ${user.name}!`);
        // Redirect or update UI for logged in state
        // For now, just log to console
        console.log('Logged in user:', user);
    } else {
        alert('Invalid email or password.');
    }
});

// Initialize
// Check if we should show one tab or another based on URL hash or default
if (window.location.hash === '#signup') {
    switchTab('signup');
} else {
    switchTab('signin'); // Default to sign in as per Image 2, or Image 1 shows Create Account active.
    // Image 1 shows Create Account active. Image 2 shows Sign In active.
    // I'll default to Sign In, but the user can switch.
}
