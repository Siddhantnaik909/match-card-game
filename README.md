# Match & Collect — Real-Time Multiplayer Office Game

A production-grade, real-time multiplayer office card game and social deduction platform built with React, TypeScript, Express, and WebSockets.

---

## Game Modes

1. **Match & Collect**:
   - **4–30 Players**: Real connected players only (zero bots, zero simulated players).
   - **4 Cards Per Player**: Players deal cards, select exactly 1 card to pass, receive 1 card each cycle.
   - **Real-Time Passing**: Simultaneous server-authoritative card passing (clockwise, counter-clockwise, or random cycle).
   - **4-of-a-Kind Victory**: The first player to match four identical cards immediately wins the round!

2. **Chor-Chitthi**:
   - **Hidden Role Social Deduction**: Secretly deals roles (Raja, Rani, Police, Chor, Praja).
   - **Secret Chit Unfold**: Players uncover their private assignment while keeping poker faces.
   - **Police Investigation**: The Police investigates all suspects to catch the Chor!

---

## Architecture & Security Highlights

* **Server-Authoritative Game Engine**: Game state, card distribution, passing validation, winner verification, and timers are calculated strictly on the backend. Clients are views and cannot falsify cards or trigger illegitimate wins.
* **Defensive JSON Ingestion & Null-Safe Handling**: All backend routes mount body parsing middleware upstream and sanitize incoming payloads before destructuring.
* **Zero-Crash Payload Hygiene**: Database payloads are sanitized to strip any `undefined` values before persistence.
* **Name Safety & Profanity Shield**: Multi-stage detection covering case variations, repeated characters, spacing evasion, leetspeak substitution, and reserved names (Admin, Moderator, Host, Bot).
* **Automatic Session Reconnection**: Preserves player state, hand of cards, and room context across network drops with a 60-second grace window.

---

## Threat Summary & Mitigations (OWASP & Threat Modeling)

| Threat Zone | Threat Scenario | Countermeasure Implemented |
|---|---|---|
| **Input Surfaces** | Malicious / offensive display names or SQL/NoSQL injection payloads | Multi-layer normalization (leetspeak, repeated chars, spacing), strict length (2-20), regex character restrictions, and sanitized storage. |
| **Planning & Reasoning** | Client attempts to claim a win with fewer than 4 matching cards | Server executes hands check directly on internal card arrays. Client win triggers are completely ignored. |
| **Tool Execution** | Arbitrary room code traversal or command injection | Crypto-generated alphanumeric room codes (`MATCH-XXXX`) validated via strict regex maps; zero shell execs. |
| **Memory & State** | Opponent attempts to snoop other players' hands via WebSocket sniff | Private hands are filtered out of public room broadcasts (`PublicPlayer` only exposes card count & pass state; actual cards only sent via private socket). |
| **Inter-System Communication** | Session hijacking or impersonation upon disconnect | Cryptographic `sessionId` token mapped to player identity and validated during reconnection handshake. |

---

## Local Development

### Prerequisites
* Node.js v20+
* npm v10+

### Setup & Startup
```bash
# 1. Install dependencies
npm install

# 2. Start the unified full-stack server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## Google Cloud Run Deployment & Configuration

### 1. Enable Required Cloud APIs
```bash
gcloud services enable run.googleapis.com secretmanager.googleapis.com
```

### 2. Secret Management Setup
```bash
# Create and populate secrets in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant Cloud Run service account access to read secrets
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Database Security Configuration (Firestore Security Rules)
Deploy the owner-bound security rules to isolate user data and game records:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Build & Deploy to Google Cloud Run
```bash
# Build the production bundle
npm run build

# Deploy container to Cloud Run
gcloud run deploy match-and-collect \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars NODE_ENV=production
```

### 5. Challenge Verification Binding
Apply the mandatory resource label to register the service for automated challenge verification:
```bash
gcloud run services update match-and-collect \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-southeast1
```

---

## Render Deployment

This project includes a `render.yaml` configuration file for easy deployment via Render's Blueprint functionality.

### 1. Blueprint Deployment (Recommended)
1. Go to your Render Dashboard and click **New** -> **Blueprint**.
2. Connect your GitHub repository.
3. Render will automatically detect the `render.yaml` file and configure your Web Service.
4. Click **Apply** to deploy the game.

### 2. Manual Render Web Service Deployment
If you prefer not to use the Blueprint:
1. Go to your Render Dashboard and click **New** -> **Web Service**.
2. Connect this repository.
3. Use the following configuration:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Click **Create Web Service**. Render will automatically provision an SSL-secured endpoint and build the application.

---

## Functional Walkthrough Test Cases

1. **Room Creation & Safety Validation**:
   - Navigate to Landing Page, click **Play Now**.
   - Attempt entering "Admin" or "f*ck" -> Verified error: *"Name Not Allowed. Please choose another name."*
   - Enter "Alex" and select **Match & Collect** -> Successfully creates room `MATCH-XXXX` and renders Lobby.
2. **Multiplayer Joining**:
   - Open 3 additional private browser tabs.
   - Enter room code and valid names ("Maya", "Jordan", "Sam").
   - Lobby updates connected count dynamically to `4 / 30`.
3. **Card Deal & Pass Mechanic**:
   - Host clicks **Start Game**.
   - 5-second countdown initiates with sound effect.
   - Room locks (`isLocked: true`).
   - Each player receives exactly 4 illustrated office cards.
   - Each player selects 1 card and clicks **PASS CARD**.
   - Server simultaneously rotates cards in configured direction (e.g. Clockwise).
   - Each player receives 1 card, maintaining exactly 4 cards.
4. **Win Condition & Celebration**:
   - Continue passing until a player collects 4 identical cards (e.g. 4 Laptops).
   - Server halts game immediately, triggers confetti burst, and announces *"MATCH COMPLETE! Siddhant collected 4 Laptop cards!"*.
   - Result is permanently saved to persistent storage.
5. **Chor-Chitthi Mode**:
   - Host starts a Chor-Chitthi lobby.
   - Players click their secret chit to unfold role.
   - Police is announced publicly; Police suspects other players and submits an accusation.
   - Scoring points awarded immediately.
