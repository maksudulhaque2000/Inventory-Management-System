# Inventory Management System

A comprehensive inventory management system built with Next.js, TypeScript, MongoDB, and Tailwind CSS.

## Features

- 🔐 **Authentication**: Secure login and registration system
- 📦 **Product Management**: Add, edit, delete, and view products with quantity tracking
- 💰 **Sales Management**: Record sales, track payments, and generate invoices
- 👥 **Customer Management**: Manage customer database with search and filtering
- 📊 **Dashboard**: Real-time statistics and analytics
- 📈 **Sales Graphs**: Visual representation of daily, monthly, and yearly sales
- 🎨 **Dark Mode**: Toggle between light and dark themes
- 📱 **Responsive Design**: Works on all devices
- 🚀 **Vercel Ready**: Optimized for Vercel deployment

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Animations**: Framer Motion, Lottie React
- **Notifications**: React Hot Toast
- **Alerts**: SweetAlert2
- **PDF Generation**: jsPDF, html2canvas

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database (local or MongoDB Atlas)
- npm or yarn

### Installation

1. Clone the repository or navigate to the project directory

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment on Vercel

1. Push your code to GitHub

2. Import your repository on Vercel

3. Add environment variables in Vercel dashboard:
   - `MONGODB_URI`: Your MongoDB connection string
   - `NEXTAUTH_SECRET`: A random secret string
   - `NEXTAUTH_URL`: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
   - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID (optional)
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret (optional)
   - `FACEBOOK_CLIENT_ID`: Your Facebook App ID (optional)
   - `FACEBOOK_CLIENT_SECRET`: Your Facebook App Secret (optional)

4. Configure OAuth providers:
   - **Google OAuth**: Add redirect URIs in Google Cloud Console (see Google Cloud Console settings)
   - **Facebook OAuth**: Configure Facebook App settings (see [FACEBOOK_CONFIG.md](./FACEBOOK_CONFIG.md))

5. Deploy!

## Project Structure

```
/app
  /api              # API routes
  /dashboard        # Dashboard pages
  /login            # Login page
  /register         # Register page
/components        # Reusable components
/context           # React contexts (Auth)
/lib               # Utility functions
/models            # MongoDB models
```

## Key Features Explained

### Product Management
- Add products with image, name, quantity, purchase price, and selling price
- If a product with the same name exists, quantity is added to existing stock
- Edit and delete products
- View product details

### Sales Management
- Create sales records with customer and product selection
- Track cash received and remaining amount
- Update partial or full payments for credit sales
- Download invoices as PDF
- Pagination for sales list
- Visual graphs for sales analytics

### Customer Management
- Add customers with name, mobile, address, and image
- Search and filter customers
- View customer purchase statistics and outstanding credit
- Edit and delete customers

### Dashboard
- Total inventory value
- Today's purchases
- Today's sales
- Total outstanding credit

## Notes

- All prices are in BDT (Bangladeshi Taka) currency format
- Stock validation prevents selling more than available
- Product quantities are automatically updated when importing or selling
- Customer autocomplete filtering is available when creating sales

## License

This project is open source and available under the MIT License.
