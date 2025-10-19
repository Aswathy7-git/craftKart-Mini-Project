# CraftKart - Professional E-Commerce Platform

CraftKart is a full-stack e-commerce web application built with the MERN stack (MongoDB, Express.js, React.js, Node.js), featuring a modern UI with Tailwind CSS. The platform connects sellers and buyers of handmade crafts, DIY items, and artisanal products.

## 🚀 Features

### Authentication & Authorization
- ✅ Separate login/registration for Users, Sellers, and Admins
- ✅ JWT-based authentication with secure password hashing
- ✅ Role-based access control (User, Seller, Admin)
- ✅ Password reset functionality
- ✅ Email verification support

### User Features
- ✅ Browse and search products with advanced filtering
- ✅ Product detail pages with reviews and ratings
- ✅ Shopping cart with quantity management
- ✅ Wishlist functionality
- ✅ Gift mode for sending presents
- ✅ Multi-step checkout process
- ✅ Order history and tracking
- ✅ User profile management
- ✅ Wallet system for payments
- ✅ Email/SMS notifications

### Seller Features
- ✅ Seller dashboard with analytics
- ✅ Product management (Add, Edit, Delete)
- ✅ Multiple image uploads
- ✅ Sustainability badges and storytelling
- ✅ Order management
- ✅ Sales tracking and analytics
- ✅ Seller approval system

### Admin Features
- ✅ Admin dashboard with comprehensive analytics
- ✅ User management (view, activate/deactivate)
- ✅ Seller approval system
- ✅ Product approval system
- ✅ Order monitoring
- ✅ System-wide analytics and reports

### Additional Features
- ✅ AI-powered product recommendations (infrastructure ready)
- ✅ Sustainability storytelling for eco-friendly products
- ✅ Payment integration support (Stripe, Razorpay, Wallet)
- ✅ Email notifications system
- ✅ Responsive design for all devices
- ✅ Modern and elegant UI with Tailwind CSS
- ✅ Real-time updates
- ✅ Product reviews and ratings
- ✅ Category-based product organization

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI library
- **Tailwind CSS** - Styling framework
- **React Router** - Navigation
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **React Hot Toast** - Notifications
- **Lucide React** - Icons
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Framer Motion** - Animations

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt.js** - Password hashing
- **Nodemailer** - Email service
- **Multer** - File uploads
- **Cloudinary** - Image storage
- **Stripe & Razorpay** - Payment processing
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **Compression** - Response compression

## 📁 Project Structure

```
craftkart2/
├── server/                    # Backend
│   ├── models/               # MongoDB models
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Review.js
│   │   └── Cart.js
│   ├── routes/               # API routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── reviews.js
│   │   ├── cart.js
│   │   ├── admin.js
│   │   ├── ai.js
│   │   └── payments.js
│   ├── middleware/           # Custom middleware
│   │   └── auth.js
│   ├── utils/               # Utility functions
│   │   ├── email.js
│   │   └── cloudinary.js
│   ├── index.js             # Entry point
│   └── package.json
│
├── client/                   # Frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.js
│   │   │   │   └── Footer.js
│   │   │   └── auth/
│   │   │       └── ProtectedRoute.js
│   │   ├── contexts/        # React contexts
│   │   │   ├── AuthContext.js
│   │   │   └── CartContext.js
│   │   ├── pages/           # Page components
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.js
│   │   │   │   ├── RegisterPage.js
│   │   │   │   └── AdminLoginPage.js
│   │   │   ├── seller/
│   │   │   │   ├── SellerDashboard.js
│   │   │   │   ├── AddProductPage.js
│   │   │   │   ├── EditProductPage.js
│   │   │   │   └── SellerOrdersPage.js
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.js
│   │   │   │   ├── AdminUsersPage.js
│   │   │   │   ├── AdminProductsPage.js
│   │   │   │   └── AdminOrdersPage.js
│   │   │   ├── HomePage.js
│   │   │   ├── ProductPage.js
│   │   │   ├── ProductDetailPage.js
│   │   │   ├── CartPage.js
│   │   │   ├── CheckoutPage.js
│   │   │   ├── OrderHistoryPage.js
│   │   │   └── ProfilePage.js
│   │   ├── services/        # API services
│   │   │   └── api.js
│   │   ├── App.js           # Main app component
│   │   ├── index.js         # Entry point
│   │   └── index.css        # Global styles
│   ├── public/
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── package.json             # Root package.json
└── README.md

