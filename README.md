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
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
cd craftkart2
```

2. **Install root dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd server
npm install
```

4. **Install frontend dependencies**
```bash
cd ../client
npm install
```

5. **Configure environment variables**

Create a `server/.env` file (you can copy from `server/config.env`):

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/craftkart
CLIENT_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Payment Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# AI Configuration (optional)
OPENAI_API_KEY=your_openai_api_key
```

6. **Create a .env file for the client (optional)**

Create a `client/.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Running the Application

**Option 1: Run both frontend and backend simultaneously (from root directory)**
```bash
npm run dev
```

**Option 2: Run separately**

Backend:
```bash
cd server
npm run dev
```

Frontend (in a new terminal):
```bash
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📝 API Documentation

### Authentication Endpoints

#### Register User/Seller
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user", // or "seller"
  "businessInfo": {} // required for sellers
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Admin Login
```http
POST /api/auth/admin/login
Content-Type: application/json

{
  "email": "admin@craftkart.com",
  "password": "admin123"
}
```

### Products Endpoints

#### Get All Products
```http
GET /api/products?page=1&limit=12&category=jewelry&search=handmade
```

#### Get Single Product
```http
GET /api/products/:id
```

#### Create Product (Seller only)
```http
POST /api/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Handmade Necklace",
  "description": "Beautiful handcrafted necklace",
  "category": "jewelry",
  "price": 49.99,
  "stock": 10
}
```

### Orders Endpoints

#### Create Order
```http
POST /api/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [...],
  "shippingAddress": {...},
  "paymentMethod": {
    "type": "stripe"
  }
}
```

#### Get User Orders
```http
GET /api/orders/my-orders
Authorization: Bearer {token}
```

### Cart Endpoints

#### Get Cart
```http
GET /api/cart
Authorization: Bearer {token}
```

#### Add to Cart
```http
POST /api/cart/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "product_id",
  "quantity": 1
}
```

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional, and elegant interface
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Powered by Framer Motion
- **Loading States**: Shimmer effects and loading spinners
- **Toast Notifications**: Real-time feedback for user actions
- **Form Validation**: Client and server-side validation
- **Error Handling**: Graceful error messages and recovery
- **Accessibility**: WCAG compliant components

## 🔐 Security Features

- JWT authentication with HTTP-only cookies
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Helmet.js for security headers
- XSS protection
- CSRF protection

## 📦 Database Models

### User Model
- Basic information (name, email, password)
- Role-based access (user, seller, admin)
- Address and contact details
- Business information (for sellers)
- Wallet and loyalty points
- Preferences and notifications

### Product Model
- Product details and description
- Category and tags
- Pricing and stock
- Images
- Seller reference
- Status (pending, approved, rejected)
- Sustainability information
- Analytics (views, likes, sales)

### Order Model
- Order items and pricing
- Shipping and billing address
- Payment information
- Order status and timeline
- Tracking information
- Gift options

### Review Model
- Rating and comment
- User and product reference
- Helpful votes
- Seller responses

### Cart Model
- Cart items with quantity
- Wishlist items
- Gift items
- User reference

## 🚧 Future Enhancements

- [ ] Complete AI product recommendation system
- [ ] SMS notifications integration
- [ ] Advanced analytics dashboard
- [ ] Social media integration
- [ ] Multi-language support
- [ ] Advanced search with filters
- [ ] Product comparison feature
- [ ] Live chat support
- [ ] Affiliate program
- [ ] Mobile app (React Native)

## 👥 User Roles

### Customer (User)
- Browse and search products
- Add to cart and wishlist
- Place orders
- Track orders
- Write reviews
- Manage profile

### Seller
- Manage products
- View and fulfill orders
- Track sales analytics
- Update business info
- Respond to reviews

### Admin
- Manage users and sellers
- Approve products and sellers
- Monitor orders
- View analytics
- System-wide controls

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For any queries or support, please contact:
- Email: support@craftkart.com
- Website: https://craftkart.com

## 🙏 Acknowledgments

- Built with love for artisans and craft enthusiasts
- Inspired by platforms like Etsy and Amazon Handmade
- UI/UX design inspired by modern e-commerce best practices

---

**Made with ❤️ by the CraftKart Team**
