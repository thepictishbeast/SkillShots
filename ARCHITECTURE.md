# Skill Shots — Architecture

## Concept

Mobile-first, video-based competition app where every challenge has
clear rules, a proof video, an entry fee, a cash pot, a deadline, and
a public voting period. Winners are decided strictly by community
vote during the voting window.

## App architecture

### Frontend

React Native / Expo. Handles:
- Video feed browsing
- Challenge creation (3-step flow)
- Video upload
- Challenge entry + payment
- Voting
- Profiles
- Wallet / earnings dashboard
- Leaderboards
- Comments / reactions / reporting

```
App
├── Auth
│   ├── Login
│   ├── Sign Up
│   ├── Age Verification
│   └── Identity / Payment Setup
├── Arena
│   ├── Challenge Feed
│   ├── Challenge Details
│   ├── Enter Challenge
│   └── Vote on Battles
├── Post Skill
│   ├── Challenge Info
│   ├── Rules + Category
│   ├── Upload Proof Video
│   ├── Set Pot + Entry Fee
│   └── Publish
├── My Wins
│   ├── Earnings
│   ├── Wins / Losses
│   ├── Active Challenges
│   ├── Battle History
│   └── Payout Status
├── Profile
│   ├── Public Stats
│   ├── Badges
│   ├── Recent Battles
│   └── Rankings
└── Social
    ├── Comments
    ├── Reactions
    ├── Sharing
    ├── Reports
    └── Notifications
```

### Backend

Node.js / NestJS (or Next.js API). Services:

```
Backend
├── Auth Service
├── User Service
├── Challenge Service
├── Entry Service
├── Voting Service           ← critical anti-fraud surface
├── Wallet / Payment Service ← Stripe Connect
├── Leaderboard Service
├── Notification Service
├── Moderation Service
├── Reporting / Dispute Service
└── Admin Service
```

## Core product flows

### A. Create a challenge

```
User opens Post Skill
    ↓
Adds title, category, rules, entry fee, pot amount, deadline
    ↓
Uploads proof video
    ↓
Payment hold is created for creator pot
    ↓
Challenge goes live in Arena
```

### B. Enter a challenge

```
User views challenge in Arena
    ↓
Reads rules + payout preview
    ↓
Pays entry fee
    ↓
Uploads attempt video
    ↓
Entry becomes visible in challenge
```

### C. Community voting

```
Challenge entry period ends
    ↓
Voting period opens
    ↓
Community votes on submitted videos
    ↓
Votes are checked for fraud / spam
    ↓
Highest valid vote count wins
    ↓
Platform fee is taken
    ↓
Winner payout is released
```

## Data models

### User

```
User {
  id: string
  username: string
  email: string
  avatarUrl: string
  bio: string
  verified: boolean
  totalWins: number
  totalEarnings: number
  totalChallengesCreated: number
  totalChallengesEntered: number
  winStreak: number
  createdAt: Date
}
```

### Challenge

```
Challenge {
  id: string
  creatorId: string
  title: string
  category: string
  rules: string
  proofVideoUrl: string
  entryFee: number
  creatorPotAmount: number
  totalPot: number
  platformFeePercent: number
  status: "draft" | "live" | "voting" | "completed" | "cancelled"
  entryDeadline: Date
  votingDeadline: Date
  winnerId?: string
  createdAt: Date
}
```

### Entry

```
Entry {
  id: string
  challengeId: string
  userId: string
  videoUrl: string
  caption?: string
  voteCount: number
  status: "submitted" | "flagged" | "approved" | "disqualified"
  createdAt: Date
}
```

### Vote

```
Vote {
  id: string
  challengeId: string
  entryId: string
  voterId: string
  createdAt: Date
}

Rules:
  - One user = one vote per challenge
  - Users cannot vote on their own entry
  - Votes only count during the voting window
```

### WalletTransaction

```
WalletTransaction {
  id: string
  userId: string
  challengeId?: string
  type: "deposit" | "entry_fee" | "payout" | "platform_fee" | "refund"
  amount: number
  status: "pending" | "completed" | "failed"
  stripePaymentId?: string
  createdAt: Date
}
```

### Report

```
Report {
  id: string
  reporterId: string
  targetType: "challenge" | "entry" | "comment" | "user"
  targetId: string
  reason: string
  status: "open" | "reviewing" | "resolved"
  createdAt: Date
}
```

## Challenge lifecycle

| Status      | Meaning                                            |
|-------------|----------------------------------------------------|
| `draft`     | User is creating challenge                         |
| `live`      | Open for entries                                   |
| `voting`    | Entry window closed; community voting open        |
| `completed` | Voting ended; winner selected; payout processed    |
| `cancelled` | Removed / refunded / failed moderation             |

## Voting + anti-fraud (critical)

### Voting rules

- One vote per user per challenge
- No voting for your own entry
- Votes only count during the voting window
- Suspicious voting patterns are flagged
- Bot / spam accounts filtered
- Flagged entries can be paused from payout
- Public vote totals can be hidden until voting ends to reduce
  pile-on behavior

### Anti-fraud signals

- New-account vote flooding
- Same-device voting
- Same-IP voting (within reason — share-your-phone-with-roommate
  edge cases)
- Vote rings (cluster of accounts that always co-vote)
- Repeated voting patterns
- Fake accounts (no profile depth, no prior activity)
- Sudden vote spikes
- Payment fraud (chargebacks, stolen cards)

This is **the** make-or-break surface. Build it first; bolt-on
later means dead-on-arrival.

## Payments

Use **Stripe Connect** because users are earning money.

### Flow

```
Creator funds pot
+
Challengers pay entry fees
    ↓
Money is held until challenge ends
    ↓
Platform takes 10–15%
    ↓
Winner receives payout
```

### Payment states

`pending` → `authorized` → `captured` → `paid_out` |
`refunded` | `failed` | `disputed`

## API routes (sketch)

```
Auth
  POST   /auth/signup
  POST   /auth/login
  POST   /auth/logout
  GET    /auth/me

Challenges
  GET    /challenges
  GET    /challenges/:id
  POST   /challenges
  PATCH  /challenges/:id
  DELETE /challenges/:id
  POST   /challenges/:id/publish

Entries
  POST   /challenges/:id/entries
  GET    /challenges/:id/entries
  GET    /entries/:id

Voting
  POST   /challenges/:id/vote
  GET    /challenges/:id/votes
  GET    /challenges/:id/results

Wallet
  GET    /wallet
  GET    /wallet/transactions
  POST   /wallet/deposit
  POST   /wallet/payout

Reports
  POST   /reports
  GET    /reports
  PATCH  /reports/:id

Leaderboards
  GET    /leaderboards/global
  GET    /leaderboards/category/:category
```

## Admin panel (day-one requirement)

- Review reported videos
- Remove challenges
- Disqualify entries
- Pause payouts
- Ban users
- Review suspicious voting
- View payment issues
- Resolve disputes

Moderation does not decide winners. It only protects the platform.

## Project structure (suggested)

### Mobile

```
skill-shots-mobile/
├── app/
│   ├── auth/
│   ├── arena/
│   ├── post-skill/
│   ├── my-wins/
│   ├── profile/
│   └── settings/
├── components/
│   ├── ChallengeCard.tsx
│   ├── VideoPlayer.tsx
│   ├── VoteButton.tsx
│   ├── PotPreview.tsx
│   ├── EntryCard.tsx
│   ├── UserBadge.tsx
│   └── LeaderboardCard.tsx
├── hooks/
├── services/
├── store/
├── types/
├── constants/
└── utils/
```

### Backend

```
skill-shots-api/
├── src/
│   ├── auth/
│   ├── users/
│   ├── challenges/
│   ├── entries/
│   ├── votes/             ← incl. vote-fraud.service.ts
│   ├── payments/          ← incl. stripe.service.ts, payout.service.ts
│   ├── wallet/
│   ├── moderation/        ← reports + admin-review
│   ├── leaderboard/
│   ├── notifications/
│   ├── common/            ← guards, decorators, filters, utils
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── test/
```

## Database tables

```
users
challenges
entries
votes
wallet_transactions
payments
payouts
comments
reactions
reports
badges
leaderboards
notifications
admin_actions
```

## Design direction

- Bold, modern, competitive
- Mobile-first, video-native
- High energy, clean UI
- Clear money flows ("$240 pot", "3h 22m left")
- Fast interactions
- Premium social-gaming feel

### Bottom nav

`Arena` | `Post` | `Vote` | `Wins` | `Profile`

### Challenge card

```
[Video Preview]

Title
Creator
Category

Entry Fee: $5
Current Pot: $240
Time Left: 3h 22m
Voting Type: Community Vote

[Enter Challenge]
```
