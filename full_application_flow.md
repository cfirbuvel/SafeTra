# Secure Second‑Hand Car Transaction Platform

## Full End‑to‑End Application Flow

---

## 1. Core Principle

The system is built around a single core entity: **Deal**.

A Deal is the **source of truth**.  
Every action in the system is represented as a **deal status transition**, not as a UI step.

---

## 2. User Types

### 2.1 User

A unified entity that can act as:

- Seller
- Buyer
- Or both

### 2.2 Lawyer (Admin Role)

- Currently a **single fixed lawyer**
- Full visibility into all deals
- Infrastructure allows adding more admins in the future

---

## 3. Authentication & User Creation Flow

### 3.1 Supported Authentication Methods

- OTP via SMS
- OTP via Email
- Google Sign‑In
- Apple Sign‑In

**No passwords are used.**

### 3.2 User Creation Scenarios

A User can be created:

- By direct login
- Via invitation to a deal (Pending User)
- Through Google or Apple authentication

### 3.3 User Statuses

- `PENDING` – Created but not fully verified
- `ACTIVE` – Verified and allowed to act in the system

> Phone number is mandatory for every user.

---

## 4. Deal Creation – Seller Flow

### 4.1 Creating a Deal

After authentication, the seller accesses the Dashboard and creates a new deal.

### 4.2 Seller Information Collection

The seller provides:

- National ID
- First name
- Last name
- Email
- Phone number
- Vehicle type
- Agreed price
- Vehicle registration document

### 4.3 Selfie Video (Optional but Recommended)

The seller records a selfie video stating:
> “I confirm that I am the owner of the vehicle and agree to sell it for the stated price.”

---

## 5. AI‑Based Identity & Document Verification

### 5.1 Automated Analysis

The system performs:

- OCR on vehicle registration
- Cross‑matching seller identity and vehicle data
- Video analysis:
  - Liveness detection
  - Face matching
  - Anomaly and manipulation detection

### 5.2 Risk Evaluation

The AI produces a **Risk Score**:

- Low
- Medium
- High

> AI **does not make final decisions**.

For Medium or High risk:

- Human‑in‑the‑loop review by the lawyer or admin

---

## 6. Data Privacy Model

### 6.1 Buyer Visibility

The buyer can see:

- Full last name
- Contract‑relevant information only

### 6.2 Restricted Data

Only the lawyer can access:

- Full national ID
- Original documents
- AI verification results

---

## 7. Buyer Invitation Flow

### 7.1 Pending Buyer Creation

The seller provides the buyer’s phone number.

The system:

- Creates a **Pending User**
- Associates the user with the deal

### 7.2 Invitation Delivery

An invitation is sent via:

- WhatsApp (primary)
- SMS (fallback)

The message includes:

- A unique deal link
- A requirement to authenticate

### 7.3 Buyer Authentication

The buyer must:

- Log in or sign up
- After verification, the account is linked to the existing deal

---

## 8. Buyer Information Flow

The buyer provides:

- Personal details
- National ID
- Optional selfie video

AI verification is performed similarly to the seller flow, producing a stored Risk Score.

---

## 9. Lawyer Entry Point

### 9.1 Timing

The lawyer reviews the deal **before contract signing**.

### 9.2 Lawyer Responsibilities

- Full review of deal data
- Review AI risk indicators
- Approve or halt the process

Only after lawyer approval can signing proceed.

---

## 10. Digital Contract Signing

- The contract is sent to both buyer and seller
- Secure digital signatures are collected
- Signed contract is automatically forwarded to the lawyer
- The document is stored as part of the deal record

---

## 11. Escrow & Payment Instructions (ZAHAV Transfers)

### 11.1 Payment Instructions

After signing:

- Both parties receive a secure link
- Includes:
  - Transfer amount
  - Bank details
  - Lawyer approval confirmation

### 11.2 Funds Transfer

- Transfers are done exclusively via **ZAHAV (RTGS)**
- The platform **never holds funds**

### 11.3 Confirmation

The lawyer manually marks:
> “Funds received”

---

## 12. Deal Management & Timeouts

### 12.1 Automatic Timeouts

- Each deal stage has a defined timeout
- Inactivity triggers automatic status changes

### 12.2 Deal Cancellation

- Before payment: policy‑based
- After payment: **only the lawyer can cancel**

---

## 13. Dashboards

### 13.1 User Dashboard

Users can view:

- Active deals
- Past deals
- Clear deal status indicators

### 13.2 Lawyer Dashboard

The lawyer can:

- View all deals
- See pending approvals
- Confirm fund receipt
- Access full audit data

---

## 14. Security Principles

- Zero‑Trust architecture
- Least‑Privilege access
- Role‑Based Access Control (RBAC)
- Full audit logging
- Strict separation between:
  - Client
  - Server
  - AI services
  - Lawyer access

---

## Final Summary

This platform is not merely a vehicle ownership transfer tool.

It is a **Legal‑Tech transaction infrastructure** designed to eliminate trust gaps, reduce fraud risk, and ensure legally enforceable outcomes for high‑value peer‑to‑peer transactions.

---

## 15. Implementation Reality & Gaps (Gap Analysis)

> [!WARNING]
> **CRITICAL ARCHITECTURAL DISCONNECT DETECTED**
> The current implementation separates Authentication into two incompatible systems, breaking the core user flow.

### 15.1 Critical Auth Disconnect

| Feature | Documented Flow | Current Implementation | Impact |
| :--- | :--- | :--- | :--- |
| **Login** | Unified System | **Dual System**: <br>1. Native Supabase (Google/Apple) <br>2. Custom `otp_codes` table (Verify Page) | Users verifying via OTP are **not logged in** to the Deal system. They cannot create or view deals. |
| **Session** | Single User Session | **Split Sessions**: <br>`session_token` cookie (Custom) vs Supabase Session | Backend actions (`deals.ts`) reject OTP users because they check `supabase.auth.getUser()`. |

### 15.2 Missing Features

| Feature | Status | Details |
| :--- | :--- | :--- |
| **Buyer Invitation** | 🔴 Missing | No logic to generate unique deal links or send WhatsApp/SMS invites from the deal page. |
| **Contracts** | 🔴 Missing | No digital signature integration or contract generation. |
| **Payment** | 🔴 Missing | No generic payment instruction generation or ZAHAV confirmation logic. |
| **Lawyer Role** | 🟡 Partial | Status transitions exist (`UNDER_REVIEW`), but no dedicated Admin/Lawyer dashboard or permission checks. |

### 15.3 Next Steps for Remediation

1. **Refactor Auth**: Abandon custom `otp_codes` table. Implement `supabase.auth.signInWithOtp` to unify Identity.
2. **Implement Invites**: Add server action to generate invite links.
3. **Build Lawyer Dash**: Create a filtered view of all statuses for the admin user.
