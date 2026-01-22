## Best Cut Admin Web

Admin dashboard for reviewing and managing barber applications. Built with Next.js 14 (App Router), Firebase (Auth, Firestore, Storage), Tailwind CSS, and react-hot-toast.

### 🎯 Current Status: Phase A Complete ✅

**Completed:**
- ✅ All dependencies installed
- ✅ TypeScript errors fixed
- ✅ Build process stable
- ✅ Firebase configuration with validation
- ✅ Environment variable graceful error handling

**Next Step:** Configure Firebase credentials (see below)

---

## 📋 Requirements
- Node.js 18+
- Firebase project with `admins` and `barber_applications` collections
- Firebase Authentication enabled (Email/Password)

---

## 🚀 Quick Start

### 1) Install Dependencies
Already done! Dependencies are installed.

### 2) Configure Firebase ⚠️ **ACTION REQUIRED**
1. Open `.env.local` in the project root
2. Replace placeholders with your actual Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**Where to find these values:**
- Firebase Console → Project Settings → Your apps → Web app
- See `firebase_setup_guide.md` for detailed instructions

### 3) Set Up Admin Access
Create an admin user in Firestore:
```
Collection: admins
Document ID: {your-firebase-auth-uid}
Fields:
  - email: "your-admin-email@example.com"
  - role: "admin"
  - createdAt: [timestamp]
```

### 4) Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📚 Documentation

- **Firebase Setup Guide:** `firebase_setup_guide.md` - Complete configuration walkthrough
- **Implementation Plan:** `implementation_plan.md` - All phases A-F detailed
- **Task Checklist:** `task.md` - Track progress across all phases

---

## 🏗️ Project Phases

### ✅ Phase A: Fix & Stabilize (COMPLETE)
- Dependencies installed and verified
- TypeScript errors resolved
- Firebase configuration ready
- Environment validation implemented

### 🔄 Phase B: Admin Auth & Security (NEXT)
- Admin access control verification
- Firestore security rules
- Action logging system

### ⏳ Phase C: Barber Management
- Service-specific approvals (shop/doorstep)
- Document review system
- Approval action logging

### ⏳ Phase D: Trust System
- Ratings & reviews oversight
- Flag suspicious activity
- Moderation tools

### ⏳ Phase E: Map & Service Control
- Service location mapping
- Pricing visibility
- Service type management

### ⏳ Phase F: Platform Health
- System monitoring dashboard
- Real-time statistics
- Issue tracking

---

## 🔥 Firebase Structure

### Collections:
- `admins/{uid}` - Admin user records
- `barber_applications/{uid}` - Barber application data
- `admin_logs` - Audit trail of admin actions
- `reviews` - Barber/customer reviews (Phase D)
- `bookings` - Platform bookings (read-only for admin)

---

## 🛠️ Available Scripts

- `npm run dev` – Start local dev server (http://localhost:3000)
- `npm run build` – Production build
- `npm start` – Run production build locally
- `npm run lint` – Lint codebase

---

## 🔐 Security Features

- ✅ Environment variable validation
- ✅ Firebase credentials NOT hardcoded
- ✅ Admin-only access enforcement
- ✅ Graceful error handling
- 🔄 Firestore security rules (Phase B)
- 🔄 Admin action audit logging (Phase B)
- 🔄 Wallet & booking protection (Phase B)

---

## ⚠️ Important Notes

1. **Never commit `.env.local`** - Already gitignored
2. **Admin access required** - Users must be in `admins` collection
3. **Firebase rules needed** - See implementation plan for security rules
4. **Separate approvals** - Shop and doorstep services approved independently (Phase C)
5. **Read-only restrictions** - Admins cannot modify wallets or fake bookings

---

## 🚨 Troubleshooting

### Build fails with "Missing required Firebase environment variables"
**Solution:** Configure `.env.local` with actual Firebase credentials

### "Your account is not authorized for admin access"
**Solution:** Add your UID to Firestore `admins/{uid}` collection

### TypeScript errors during build
**Solution:** Already fixed! Run `npm install` if you encounter issues

### Firebase connection errors
**Solution:** Verify credentials in Firebase Console match `.env.local`

See `firebase_setup_guide.md` for complete troubleshooting guide.

---

## 📞 Next Steps

1. ✅ Configure Firebase credentials in `.env.local`
2. ✅ Create admin user in Firebase Auth
3. ✅ Add your UID to `admins` collection in Firestore
4. ✅ Run `npm run dev` and test login
5. → Proceed to Phase B: Admin Auth & Security
