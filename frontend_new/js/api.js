// API base URL - now uses CONFIG if available, fallback to localhost
const API_BASE_URL = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:3001/api';

// Menu API functions
async function getAllMenuItems() {
    try {
        const response = await fetch(`${API_BASE_URL}/menu`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        // Return just the data array, not the full response object
        return result.success ? result.data : [];
    } catch (error) {
        console.error('Error fetching menu items:', error);
        return [];
    }
}

async function addMenuItem(menuItem) {
    try {
        const response = await fetch(`${API_BASE_URL}/menu`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(menuItem)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error adding menu item:', error);
        throw error;
    }
}

async function updateMenuItem(itemId, menuItem) {
    try {
        const response = await fetch(`${API_BASE_URL}/menu/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(menuItem)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error updating menu item:', error);
        throw error;
    }
}

async function deleteMenuItem(itemId) {
    try {
        console.log('Deleting menu item with ID:', itemId);
        const response = await fetch(`${API_BASE_URL}/menu/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        console.log('Delete response status:', response.status);
        
        if (response.status === 404) {
            throw new Error('Menu item not found');
        }
        
        if (!response.ok) {
            let errorMessage = 'Failed to delete menu item';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // If response is not JSON, use default error message
            }
            throw new Error(errorMessage);
        }

        return true;
    } catch (error) {
        console.error('Error in deleteMenuItem:', error);
        throw error;
    }
}

// Order API functions
async function getAllOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/orders`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        // Return just the data array, not the full response object
        return result.success ? result.data : [];
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

async function createOrder(order) {
    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(order)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}

async function updateOrder(orderId, updates) {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error updating order:', error);
        throw error;
    }
}

// Feedback API functions
async function getAllFeedback() {
    try {
        const response = await fetch(`${API_BASE_URL}/feedback`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        // Return just the data array, not the full response object
        return result.success ? result.data : [];
    } catch (error) {
        console.error('Error fetching feedback:', error);
        return [];
    }
}

async function submitFeedback(feedback) {
    try {
        const response = await fetch(`${API_BASE_URL}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(feedback)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error submitting feedback:', error);
        throw error;
    }
}

// Export all functions
window.api = {
    getAllMenuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getAllOrders,
    createOrder,
    updateOrder,
    getAllFeedback,
    submitFeedback
}; 