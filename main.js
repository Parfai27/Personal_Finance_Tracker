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

// Auth Logic
document.addEventListener('DOMContentLoaded', () => {

    // Check if user is already logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            window.location.href = 'app.html';
        }
    });

    // Sign Up Logic
    const signupForm = document.getElementById('form-signup');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            if (password.length < 8) {
                alert('Password must be at least 8 characters long');
                return;
            }

            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Signed in 
                    const user = userCredential.user;

                    // Update profile with name
                    return user.updateProfile({
                        displayName: name
                    }).then(() => {
                        // Create user document in Firestore
                        return db.collection('users').doc(user.uid).set({
                            name: name,
                            email: email,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            currency: 'USD', // Default currency
                            settings: {
                                notifications: true
                            }
                        });
                    });
                })
                .then(() => {
                    alert('Account created successfully!');
                    window.location.href = 'app.html';
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    alert(errorMessage);
                });
        });
    }

    // Sign In Logic
    const signinForm = document.getElementById('form-signin');
    if (signinForm) {
        signinForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('signin-email').value;
            const password = document.getElementById('signin-password').value;

            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Signed in
                    window.location.href = 'app.html';
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    alert(errorMessage);
                });
        });
    }

    // Google Auth
    const googleBtn = document.querySelector('.btn-google');
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider)
                .then((result) => {
                    window.location.href = 'app.html';
                }).catch((error) => {
                    console.error(error);
                    alert('Google Sign In failed: ' + error.message);
                });
        });
    }

    // Initialize Tab
    if (window.location.hash === '#signup') {
        switchTab('signup');
    } else {
        switchTab('signin');
    }
});
