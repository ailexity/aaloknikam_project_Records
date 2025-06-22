# RECORDS - Restaurant Management System

A full-stack web application for managing restaurant operations including menu management, order processing, and customer feedback.

## Project Structure

```
project_root/
├── frontend/
│   ├── public/
│   │   ├── assets/
│   │   │   └── profile.jpg
│   │   └── index.html
│   └── src/
│       ├── js/
│       │   └── scripts.js
│       ├── css/
│       │   └── styles.css
│       └── components/
│           ├── dashboard.html
│           ├── menu.html
│           ├── orders.html
│           ├── history.html
│           ├── feedback.html
│           └── sidebar.html
├── backend/
│   ├── src/
│   │   └── server.js
│   ├── config/
│   │   └── config.js
│   ├── routes/
│   │   └── api.js
│   └── models/
│       └── (database models)
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file in the backend directory with the following variables:
   ```
   PORT=3000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=records_db
   DB_USER=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your_secret_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. The frontend is currently static HTML/CSS/JS
2. You can serve it using any static file server
3. Make sure to update the API endpoints in the frontend JavaScript files to match your backend server address

## Features

- Dashboard with real-time statistics
- Menu management system
- Order processing
- Order history tracking
- Customer feedback system
- User authentication (coming soon)
- Real-time updates (coming soon)

## API Endpoints

### Menu
- GET /api/menu - Get all menu items
- POST /api/menu - Add new menu item

### Orders
- GET /api/orders - Get all orders
- POST /api/orders - Create new order

### Feedback
- GET /api/feedback - Get all feedback
- POST /api/feedback - Submit new feedback

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.



