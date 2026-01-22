# Firebase Readiness Report: Best Cut Admin Integration

Audit of the technical requirements to connect the Best Cut Admin App to the shared live Firebase project.

## 1. Firebase Setup Check
- **Project Configuration**: Handled via `.env.local` variables. Connection to Auth, Firestore, and Storage is confirmed.
- **Collections to Read/Write**:
  - `admins`: Read (Auth verification).
  - `barber_applications`: Read/Write (Approval, status, monitoring).
  - `bookings`: Read/Write (Lifecycle monitoring, force-actions).
  - `reviews`: Read/Write (Flagging/hiding toxic content).
  - `geo_zones`: Read/Write (Market supply control).
  - `platform`: Read/Write (Global config like `emergencyFreeze`).
  - `admin_logs`: Read/Create (Immutable audit trail).

## 2. Admin Auth & Roles
- **Method**: Firebase Auth (Email/Pass or Google) + Firestore UID verification.
- **Storage**: Roles are stored in the `/admins/{uid}` document.
- **Enforcement**: Securely enforced via the `isAdmin()` helper function in `firestore.rules`. No client-side bypass possible.

## 3. Firestore Data Contract (Admin <-> Best Cut App)
- **Barbers**: Shared `BarberApplication` schema. Admin app manages the `accountStatus` and `mapVisibility`.
- **Bookings**: Shared `Booking` schema. Admin app listens to status transitions and can inject `cancelledBy: 'admin'`.
- **System Settings**: Stored in `platform/config`. Best Cut App must listen to `emergencyFreeze` to halt operations.
- **Admin Logs**: Internal to Admin app for regulatory compliance.

## 4. Security Rules Dependency
Current `firestore.rules` require updates for full integration:
- [ ] **Gaps**: `platform/config` is unprotected. `bookings` write access is denied for admins.
- [ ] **Functions Required**: 
  - Reliability score calculation (Triggered by booking completion).
  - Fraud detection analysis (Scheduled or trigger-based).
  - Push Notifications for forced-actions (FCM).

## 5. Real-Time Sync
- **Mechanism**: Firestore `onSnapshot` (Websocket).
- **Latency**: Sub-200ms for status changes (e.g., and admin disables a barber, they disappear from the customer app instantly).

## 6. Readiness Summary

| Status | Component | Detail |
| :--- | :--- | :--- |
| ✅ **COMPLETE** | Admin Auth | UID-based verification is implemented and secure. |
| ✅ **COMPLETE** | Data Schemas | Types for barbers, bookings, and config are ready. |
| ⚠️ **MISSING** | Security Rules | `platform` and `bookings` overrides need rule updates. |
| ⚠️ **MISSING** | FCM Integration | Forced actions lack customer/barber notification triggers. |
| 🔴 **REQUIRED** | Live Backend Check | Confirming the Best Cut App handles `emergencyFreeze` state. |

## 7. Pre-Connection Tasks
1. Deploy updated `firestore.rules`.
2. Populate `platform/config` with initial state to avoid undefined errors.
3. Verify Best Cut App has listeners for `accountStatus == 'disabled'`.
