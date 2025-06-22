// Global variables
const userName = window.CONFIG ? window.CONFIG.DEFAULT_USER.name : "Aalok Nikam";

// Loading state management
function showLoader(message = 'Loading...') {
    // Remove existing loader if any
    hideLoader();
    
    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.className = 'loading-overlay';
    loader.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.remove();
    }
}

// Keyboard shortcuts for efficiency
document.addEventListener('keydown', function(e) {
    // Only trigger shortcuts if not typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
            case 'n': // Ctrl+N for new order/item
                e.preventDefault();
                const addButton = document.getElementById('addOrder') || document.getElementById('addItem');
                if (addButton) {
                    addButton.click();
                    showNotification('Keyboard shortcut: Ctrl+N', 'info');
                }
                break;
            case 'm': // Ctrl+M for menu
                e.preventDefault();
                if (!window.location.href.includes('menu.html')) {
                    window.location.href = 'menu.html';
                }
                break;
            case 'o': // Ctrl+O for orders
                e.preventDefault();
                if (!window.location.href.includes('orders.html')) {
                    window.location.href = 'orders.html';
                }
                break;
            case 'd': // Ctrl+D for dashboard
                e.preventDefault();
                if (!window.location.href.includes('dashboard.html')) {
                    window.location.href = 'dashboard.html';
                }
                break;
            case 'h': // Ctrl+H for history
                e.preventDefault();
                if (!window.location.href.includes('history.html')) {
                    window.location.href = 'history.html';
                }
                break;
            case 'f': // Ctrl+F for feedback
                e.preventDefault();
                if (!window.location.href.includes('feedback.html')) {
                    window.location.href = 'feedback.html';
                }
                break;
        }
    }
    
    // ESC key to close modals or clear searches
    if (e.key === 'Escape') {
        const searchInputs = document.querySelectorAll('input[type="search"], #menuSearch, #customerFilter');
        searchInputs.forEach(input => {
            if (input.value) {
                input.value = '';
                input.dispatchEvent(new Event('input'));
            }
        });
    }
});

// Show keyboard shortcuts help
function showKeyboardHelp() {
    const helpModal = document.createElement('div');
    helpModal.className = 'modal-overlay';
    helpModal.innerHTML = `
        <div class="modal-content">
            <h3>Keyboard Shortcuts</h3>
            <ul class="shortcuts-list">
                <li><kbd>Ctrl</kbd> + <kbd>N</kbd> - New Order/Item</li>
                <li><kbd>Ctrl</kbd> + <kbd>M</kbd> - Menu Page</li>
                <li><kbd>Ctrl</kbd> + <kbd>O</kbd> - Orders Page</li>
                <li><kbd>Ctrl</kbd> + <kbd>D</kbd> - Dashboard</li>
                <li><kbd>Ctrl</kbd> + <kbd>H</kbd> - History</li>
                <li><kbd>Ctrl</kbd> + <kbd>F</kbd> - Feedback</li>
                <li><kbd>Esc</kbd> - Clear Search</li>
            </ul>
            <button onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
    `;
    document.body.appendChild(helpModal);
}

// Add help button to pages
function addHelpButton() {
    const helpButton = document.createElement('button');
    helpButton.className = 'help-button';
    helpButton.innerHTML = '?';
    helpButton.title = 'Keyboard Shortcuts (Click for help)';
    helpButton.onclick = showKeyboardHelp;
    document.body.appendChild(helpButton);
}

// Sidebar Navigation
const navLinks = document.querySelectorAll(".sidebar .nav-item");
navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    navLinks.forEach((lnk) => lnk.classList.remove("active"));
    e.target.classList.add("active");
  });
});

// Load the sidebar dynamically (updated path)
function loadSidebar() {
    const sidebarContainer = document.getElementById('sidebar');
    if (sidebarContainer) {
        showLoader('Loading navigation...');
        fetch('../components/sidebar.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            sidebarContainer.innerHTML = data;
            // Re-attach navigation events after loading sidebar
            attachNavigationEvents();
            hideLoader();
        })
        .catch(error => {
            console.error('Error loading sidebar:', error);
            console.log('Sidebar loading failed - using inline sidebar instead');
            hideLoader();
            showNotification('Navigation loaded with fallback', 'warning');
        });
    }
}

// Attach navigation events
function attachNavigationEvents() {
    const navLinks = document.querySelectorAll(".sidebar .nav-item");
    navLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            navLinks.forEach((lnk) => lnk.classList.remove("active"));
            e.target.classList.add("active");
        });
    });
}

// Live Clock functionality
function updateClock() {
    const clockElement = document.getElementById("liveClock");
    if (clockElement) {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const amPm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const formattedTime = `${displayHours}:${minutes}:${seconds} ${amPm}`;
        clockElement.textContent = formattedTime;
    }
}

// Update the clock every second
setInterval(updateClock, 1000);
updateClock(); // Initialize immediately

// Dashboard Greetings
document.addEventListener("DOMContentLoaded", () => {
    const greeting = document.querySelector(".dashboard .greeting");
    if (greeting) {
        const currentHour = new Date().getHours();
        let message = "Good Evening";

        if (currentHour < 12) {
            message = "Good Morning";
        } else if (currentHour < 18) {
            message = "Good Afternoon";
        }

        greeting.innerText = `${message}, ${userName}!`;
    }
});

// Enhanced notification system
function showNotification(message, type = 'info', duration = 3000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} fade-in`;
    
    // Add icon based on type
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    notification.innerHTML = `
        <span class="notification-icon">${icons[type] || icons.info}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after specified duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, duration);
}

// Enhanced error handling
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    hideLoader(); // Hide any loading states
    showNotification('An unexpected error occurred. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    hideLoader(); // Hide any loading states
    showNotification('A network error occurred. Please check your connection.', 'error');
});

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('RECORDS Restaurant Management System - Frontend Loaded');
    console.log('API Base URL:', window.CONFIG ? window.CONFIG.API_BASE_URL : 'Not configured');
    
    // Load sidebar if container exists
    loadSidebar();
    
    // Initialize clock
    updateClock();
    
    // Add help button
    addHelpButton();
    
    // Show welcome message
    setTimeout(() => {
        showNotification(`Welcome to RECORDS! Press Ctrl+? for keyboard shortcuts.`, 'info', 5000);
    }, 1000);
});

// Menu Search functionality with debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

document.addEventListener('DOMContentLoaded', function() {
    const menuSearch = document.querySelector("#menuSearch");
    if (menuSearch) {
        const debouncedSearch = debounce((query) => {
            const items = document.querySelectorAll(".menu-card");
            let visibleCount = 0;

            items.forEach((item) => {
                const itemName = item.querySelector(".item-name");
                const itemId = item.querySelector(".item-id");
                const itemCategory = item.querySelector(".item-category");
                
                if (itemName && itemId) {
                    const nameText = itemName.innerText.toLowerCase();
                    const idText = itemId.innerText.toLowerCase();
                    const categoryText = itemCategory ? itemCategory.innerText.toLowerCase() : '';
                    
                    const isVisible = nameText.includes(query) || 
                                    idText.includes(query) || 
                                    categoryText.includes(query);
                    
                    if (isVisible) {
                        item.style.display = "block";
                        item.classList.add('fade-in');
                        visibleCount++;
                    } else {
                        item.style.display = "none";
                    }
                }
            });
            
            // Show search results count
            if (query) {
                showNotification(`Found ${visibleCount} items matching "${query}"`, 'info', 2000);
            }
        }, 300);
        
        menuSearch.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase();
            debouncedSearch(query);
        });
    }
});

// Feedback Page - Submit functionality
function submitFeedback() {
    const customerName = document.getElementById('customerName');
    const rating = document.getElementById('rating');
    const comment = document.getElementById('comment');
    
    if (customerName && rating && comment) {
        const feedbackData = {
            customerName: customerName.value,
            rating: parseInt(rating.value),
            comment: comment.value
        };
        
        if (window.api && window.api.submitFeedback) {
            showLoader('Submitting feedback...');
            window.api.submitFeedback(feedbackData)
                .then(result => {
                    hideLoader();
                    showNotification('Feedback submitted successfully!', 'success');
                    // Clear form
                    customerName.value = '';
                    rating.value = '';
                    comment.value = '';
                })
                .catch(error => {
                    hideLoader();
                    console.error('Error submitting feedback:', error);
                    showNotification('Failed to submit feedback. Please try again.', 'error');
                });
        } else {
            showNotification('Feedback system not available.', 'warning');
        }
    }
}
