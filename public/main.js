// ==========================
// Cake Bakery Frontend Script
// ==========================
// This script handles all client-side interactions for the Cake Bakery website.
// Features include: user authentication, contact form, add to cart, add to wishlist, 
// updating UI elements, and navigation between pages.

// --------------------------
// Initialize AOS Animation
// --------------------------
AOS.init();

// --------------------------
// User Authentication
// --------------------------
// Handles login and signup form submissions, stores user info in localStorage, and manages UI updates.

// LOGIN FORM SUBMISSION
document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        localStorage.setItem('userId', data.user._id);
        localStorage.setItem('userName', data.user.name);
        updateUserAvatar(); // Update avatar after login
        alert('Login successful!');
        window.location.href = '/';
      } else {
        alert(data.message);
      }
    });
});

// SIGNUP FORM SUBMISSION
document.getElementById('signupForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;

  fetch('/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userId', data.user._id);
        updateUserAvatar(); // Update avatar after signup
        alert('Signup successful!');
        window.location.href = '/';
      } else {
        alert(data.message);
      }
    });
});

// --------------------------
// Set User Avatar Icon
// --------------------------
// Updates the user icon with the user's initials if logged in (works for both signup and login).
function updateUserAvatar() {
  const userImage = document.querySelector('.icons img[src="./image/user.png"]');
  const userName = localStorage.getItem('userName');
  if (userImage) {
    if (userName) {
      userImage.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=573818&color=fff`;
      userImage.alt = userName.charAt(0).toUpperCase();
    } else {
      userImage.src = './image/user.png';
      userImage.alt = 'User Icon';
    }
  }
}

// Call on DOMContentLoaded and after login/signup
document.addEventListener('DOMContentLoaded', updateUserAvatar);

// --------------------------
// Contact Form Submission
// --------------------------
// Sends contact form data to the backend.
document.getElementById('messagebtn').addEventListener('click', function () {
  const name = document.getElementById('usr').value;
  const email = document.getElementById('eml').value;
  const phone = document.getElementById('phn').value;
  const message = document.getElementById('comment').value;

  fetch('/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, phone, message }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) alert(data.message);
      else alert('Failed to send the message.');
    });
});

// --------------------------
// Add to Cart Functionality
// --------------------------
// Handles "Add to Cart" button clicks, sends order to backend.
document.querySelectorAll('button[title="Add to Cart"]').forEach((button) => {
  button.addEventListener('click', function () {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Please login to add items to the cart.');
      return;
    }

    // Try to find the cake name from the closest .card
    let itemName = '';
    const card = this.closest('.card');
    if (card) {
      const h3 = card.querySelector('.card-body h3');
      if (h3) itemName = h3.innerText;
    }
    if (!itemName) itemName = 'Unnamed Item';

    fetch('/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, items: [{ name: itemName }] }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert('Item added to cart!');
        } else {
          alert('Failed to add item to cart: ' + (data.message || 'Unknown error'));
        }
      })
      .catch((err) => console.error('Error adding to cart:', err));
  });
});

// --------------------------
// Redirect to Orders Page
// --------------------------
// Navigates to the user's orders page when the cart icon is clicked.
document.querySelector('.icons img[src="./image/add.png"]').addEventListener('click', function () {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    alert('Please login to view your orders.');
    return;
  }
  window.location.href = `/orders/${userId}`;
});

// --------------------------
// Add to Wishlist Functionality
// --------------------------
// Handles "Add to Wishlist" button clicks, sends item to backend and updates badge.
document.querySelectorAll('button[title="Add to Wishlist"]').forEach((button) => {
  button.addEventListener('click', function () {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Please login to add items to your wishlist.');
      return;
    }
    // FIX: Use .card instead of .card-body
    const itemName = this.closest('.card').querySelector('.card-body h3')?.innerText || 'Unnamed Item';
    fetch('/wishlist/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, item: { name: itemName } }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert('Item added to wishlist!');
          updateWishlistCount(data.wishlist.length);
        } else {
          alert('Failed to add item to wishlist: ' + (data.message || 'Unknown error'));
        }
      })
      .catch((err) => console.error('Error adding to wishlist:', err));
  });
});

// --------------------------
// Update Wishlist Count Badge
// --------------------------
// Updates the wishlist icon badge with the current count.
function updateWishlistCount(count) {
  const heartIcon = document.querySelector('.icons img[src="./image/heart.png"]');
  if (!heartIcon) return;

  let badge = heartIcon.nextElementSibling;
  if (!badge) {
    badge = document.createElement('span');
    badge.style.background = 'red';
    badge.style.color = 'white';
    badge.style.borderRadius = '50%';
    badge.style.padding = '5px';
    badge.style.fontSize = '12px';
    badge.style.position = 'absolute';
    badge.style.top = '-5px';
    badge.style.right = '-10px';
    heartIcon.parentElement.appendChild(badge);
  }
  badge.innerText = count;
}

// --------------------------
// Redirect to Wishlist Page
// --------------------------
// Navigates to the user's wishlist page when the wishlist icon is clicked.
document.querySelector('.icons img[src="./image/heart.png"]').addEventListener('click', function () {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    alert('Please login to view your wishlist.');
    return;
  }
  window.location.href = `/wishlist/${userId}`;
});

// --------------------------
// User Icon Dropdown & Logout
// --------------------------
// Handles user dropdown menu and logout functionality.
document.addEventListener('DOMContentLoaded', function () {
  const userIcon = document.querySelector('.icons img[src="./image/user.png"]');
  const authModal = document.getElementById('authModal');
  const userDropdownMenu = document.createElement('div');
  userDropdownMenu.className = 'dropdown-menu dropdown-menu-right';
  userDropdownMenu.style.display = 'none';

  function isLoggedIn() {
    return !!localStorage.getItem('userName');
  }

  function updateUI() {
    const userName = localStorage.getItem('userName');
    if (isLoggedIn()) {
      userIcon.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=573818&color=fff`;
      userIcon.alt = userName.charAt(0).toUpperCase();

      userDropdownMenu.innerHTML = `
        <a class="dropdown-item" href="/profile">My Account</a>
        <a class="dropdown-item" href="#" id="logout">Log Out</a>
      `;

      const logoutButton = userDropdownMenu.querySelector('#logout');
      logoutButton.addEventListener('click', function () {
        localStorage.clear();
        alert('Logged out successfully!');
        updateUI();
      });
    } else {
      userIcon.src = './image/user.png';
      userIcon.alt = 'User Icon';
      userDropdownMenu.innerHTML = '';
    }
  }

  userIcon.addEventListener('click', function () {
    if (isLoggedIn()) {
      userDropdownMenu.style.display =
        userDropdownMenu.style.display === 'block' ? 'none' : 'block';
    } else {
      $(authModal).modal('show');
    }
  });

  document.querySelector('.icons').appendChild(userDropdownMenu);
  updateUI();
});

// --------------------------
// Clear Local Storage on Load
// --------------------------
// Clears user data from localStorage when the page loads (for demo/testing).
// window.addEventListener('load', function () {
//   localStorage.clear();
//   console.log('LocalStorage cleared. No user is logged in.');
// });
