# Budget Tracker

A modern, mobile-first Progressive Web App (PWA) for tracking travel expenses and budget management.

## Features

- 📱 **Mobile-First Design**: Optimized for mobile devices with touch-friendly interface
- 💰 **Expense Tracking**: Add, edit, and delete transactions with categories
- 📊 **Analytics Dashboard**: Visualize spending by category, daily, and weekly charts
- 🔄 **Offline Support**: Works offline with local storage fallback
- ☁️ **Firebase Integration**: Cloud sync with Firestore database
- 🏠 **PWA Ready**: Installable on iOS and Android devices
- 🎨 **Modern UI**: Material-UI components with beautiful design

## Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **UI Library**: Material-UI (MUI)
- **Database**: Firebase Firestore
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **PWA**: Next-PWA

## Getting Started

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure Firebase**:

   - The Firebase configuration is already set up in `lib/firebase.ts`
   - Make sure your Firebase project allows reads/writes from your domain

3. **Run the development server**:

   ```bash
   npm run dev
   ```

4. **Open your browser**:
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - For mobile testing, use your browser's device emulation or access from a mobile device

## Deployment

### For Production

1. **Build the application**:

   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

### PWA Installation

The app is configured as a PWA and can be installed on mobile devices:

- **iOS**: Open in Safari, tap the share button, then "Add to Home Screen"
- **Android**: Open in Chrome, tap the menu button, then "Add to Home Screen"

## Firebase Setup

The app uses Firebase Firestore for data storage. The configuration is already included, but you'll need to:

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Update the Firebase config in `lib/firebase.ts` if needed
4. Set up Firestore security rules to allow reads/writes

## Features Overview

### Main Dashboard

- View total spending with beautiful gradient card
- Quick access to recent transactions
- Floating action button for adding new expenses

### Transaction Management

- Add transactions with amount, description, category, and date
- Edit existing transactions
- Delete transactions with confirmation
- Automatic currency formatting

### Analytics

- Pie chart showing spending by category
- Bar chart for daily spending in current month
- Line chart for weekly spending overview

### Offline Support

- All data is stored locally when offline
- Automatic sync when connection is restored
- No data loss during connectivity issues

## Categories

Pre-defined categories for transactions:

- Food & Dining
- Transportation
- Accommodation
- Entertainment
- Shopping
- Health & Medical
- Travel
- Other

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
