<div align="center">

# ◈ SolFocus

### Stake your attention. Earn it back.

**The first productivity app where distraction costs you — built on Solana, native to Seeker.**

[![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF?style=flat-square&logo=solana)](https://solana.com)
[![Expo](https://img.shields.io/badge/Expo-SDK%2050-000020?style=flat-square&logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.73-61DAFB?style=flat-square&logo=react)](https://reactnative.dev)
[![Anchor](https://img.shields.io/badge/Anchor-Framework-FF6B35?style=flat-square)](https://anchor-lang.com)
[![License](https://img.shields.io/badge/License-MIT-4dd9ac?style=flat-square)](LICENSE)

</div>

---

## What is SolFocus?

SolFocus is a mobile productivity app that uses **financial commitment** to enforce focus. Before starting a session, you stake SOL into a smart contract on Solana. Complete your session and your full stake returns. Abandon early and you forfeit 20% — which goes into a shared penalty pool distributed to people who finish.

No willpower required. Just skin in the game.

```
Complete session  →  100% stake returned + share of penalty pool
Abandon early     →  80% returned · 20% forfeited to pool
```

---

## Features

- **⏱ Pomodoro-style timer** — 1, 5, 15, 30, 60, or 90 minute sessions
- **🔒 On-chain staking** — SOL locked in a trustless Anchor smart contract
- **🏊 Penalty pool** — abandoners fund completers' bonuses
- **🎵 Binaural beats** — 19 focus tracks (Beta, Alpha, Gamma, Theta, Delta)
- **🔥 Streak tracking** — daily streak with shield protection every 7 days
- **🌗 Light/dark theme** — Aurora animated background in dark mode
- **📱 Seeker-native** — built for the Solana Mobile dApp Store
- **📱 SKR token support** — coming soon (UI ready, contract in development)

---

## Screenshots

| Home Screen | Active Session | Session Complete |
|-------------|----------------|------------------|
| *(wallet connect, session config, SOL stake)* | *(ring timer, binaural beats, task note)* | *(refund confirmed, pool bonus)* |

---

## Architecture

### Layer Stack

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                     │
│  HomeScreen · ActiveScreen · HistoryScreen · Settings    │
│  BottomNav · AuroraBackground · OnboardingFlow           │
├─────────────────────────────────────────────────────────┤
│                   STATE / CONTEXT LAYER                  │
│  WalletContext · MusicContext · ThemeContext              │
│  ConnectionProvider · AsyncStorage                       │
├─────────────────────────────────────────────────────────┤
│                     SERVICES LAYER                       │
│  StreakService · DailyChallengeService                   │
│  NotificationService · useBinauralBeats                  │
│  mobileVaultClient                                       │
├─────────────────────────────────────────────────────────┤
│                   BLOCKCHAIN LAYER — Solana              │
│  Anchor Program · Vault PDA · Penalty Pool               │
│  @solana/web3.js · Phantom Wallet · SPL Token (SKR)      │
├─────────────────────────────────────────────────────────┤
│                   PERSISTENCE LAYER                      │
│  AsyncStorage: focus_history · streak_data               │
│  onboarding_seen · Expo Notifications                    │
└─────────────────────────────────────────────────────────┘
```

---

### Session State Machine

```
[Home Screen]
     │
     │  tap "Start SolFocus"
     ▼
[Session Sheet]  ──────────────────────────────┐
     │  configure duration + stake              │
     │                                          │  no wallet
     ▼                                          ▼
[initializeVault]                    [Inline Wallet Connect]
     │  on-chain · one-time                     │
     ▼                                          │
[startSession]  ◄─────────────────────────────┘
     │  SOL locked in vault PDA
     ▼
[Active Session]  ──── timer counts down ────►
     │
     ├──── timer hits 00:00 ────────────────────►  [completeSession]
     │                                                   │
     │                                                   │  full stake returned
     │                                                   │  + penalty pool share
     │                                                   ▼
     │                                            [Complete Screen]
     │
     └──── user taps Abandon ──────────────────►  [abandonSession]
                                                        │
                                                        │  80% returned
                                                        │  20% → penalty pool
                                                        ▼
                                                 [Home Screen]
```

---

### Smart Contract — Anchor Program

**Program ID:** `2bsjJXARsoLH49Svs1pRw98rr1dctYHJHov43dLvqUjg`

#### Instructions

| Instruction | Description |
|-------------|-------------|
| `initialize_vault` | Creates a Vault PDA for the user. One-time setup per wallet. |
| `start_session` | Transfers SOL to vault. Sets duration, timestamp, marks session active. |
| `complete_session` | Validates timer expired. Returns full stake + penalty pool share. |
| `abandon_session` | Returns 80% of stake. Keeps 20% in pool for completers. |

#### Vault State Account (PDA)

```rust
pub struct VaultState {
    pub owner:                  Pubkey,   // user's wallet address
    pub session_active:         bool,     // prevents double-start
    pub session_end_time:       i64,      // unix timestamp
    pub stake_amount:           u64,      // lamports locked
    pub total_earned_from_pool: u64,      // cumulative pool bonuses
    pub total_balance:          u64,      // global penalty pool balance
}
```

---

### Data Flow

```
[React Native Client]                    [Solana Blockchain]
        │                                        │
        │  ── sign + broadcast tx ─────────────► │
        │                                        │  Vault PDA
        │  ◄─ fetch vault state ─────────────── │  Penalty Pool
        │                                        │  Session State
        │  ── pool balance RPC ────────────────► │
        │                                        │
        ▼
[AsyncStorage]
  focus_history[]
  streak_data
  onboarding_seen
  user_preferences
```

---

### React Context Provider Tree

```
ConnectionProvider        (Solana RPC endpoint)
  └─ WalletProvider       (Phantom adapter)
       └─ WalletModalProvider
            └─ ThemeProvider     (light/dark, color tokens)
                 └─ MusicProvider    (trackIndex, play/pause, prev/next)
                      └─ <App />
```

---

### Token Architecture

| | SOL | SKR |
|---|---|---|
| **Status** | ✅ Production | 🔜 In Development |
| **Transfer type** | Native lamport | SPL token |
| **Stakes** | 0.01 – 0.5 SOL | 10 – 500 SKR |
| **Contract change** | None needed | `spl_token::transfer` + ATA creation |
| **Mint** | — | `SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3` |

---

## Project Structure

```
focus-mobile/
├── App.tsx                          # Root — screen routing + state
├── app.json                         # Expo config (name, slug, android package)
├── eas.json                         # EAS Build config
│
├── components/
│   ├── HomeScreen.tsx               # Main screen — session config + wallet
│   ├── ActiveScreen.tsx             # Live session — timer ring + music
│   ├── HistoryScreen.tsx            # Past sessions list
│   ├── SettingsScreen.tsx           # Theme, preferences, reset
│   ├── BottomNav.tsx                # Tab navigation
│   ├── AuroraBackground.tsx         # Animated dark-mode background
│   ├── FirstSessionHint.tsx         # Guided prompt for first-time users
│   └── OnboardingFlow.tsx           # 5-slide onboarding
│
├── contexts/
│   ├── WalletContext.tsx            # Wallet address, balance, connect
│   ├── MusicContext.tsx             # Binaural beat player state
│   └── ThemeContext.tsx             # Light/dark theme + color tokens
│
├── services/
│   ├── StreakService.ts             # Daily streak logic + shield
│   ├── DailyChallengeService.ts     # Challenge completion tracking
│   └── NotificationService.ts      # Push notifications
│
├── hooks/
│   └── useBinauralBeats.ts         # Audio playback hook
│
└── mobileVaultClient.ts            # Solana program interface
```

---



---

## Environment

The app connects to Solana mainnet by default via the RPC endpoint configured in `ConnectionProvider`. To switch to devnet for testing, update the endpoint in your provider config.

---

## How the Penalty Pool Works

1. User A stakes 0.5 SOL and completes their session → gets 0.5 SOL back
2. User B stakes 0.5 SOL and abandons → gets 0.4 SOL back, 0.1 SOL goes to pool
3. User C completes their session → gets their stake back **plus a proportional share of the 0.1 SOL pool**

The pool is on-chain, trustless, and auditable. No one controls it — the smart contract distributes it automatically.

---

## Roadmap

- [x] SOL staking — production
- [x] Binaural beats player (19 tracks)
- [x] Streak tracking + shield
- [x] Light/dark theme
- [x] Onboarding flow
- [x] SKR toggle UI
- [ ] SKR staking — smart contract (in development)
- [ ] Seeker dApp Store submission
- [ ] Leaderboard
- [ ] Social sharing of completed sessions
- [ ] Apple App Store (iOS)

---

## Built With

- [Expo](https://expo.dev) — React Native framework
- [Anchor](https://anchor-lang.com) — Solana smart contract framework
- [Phantom](https://phantom.app) — Wallet adapter
- [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/) — Solana client library
- [React Native SVG](https://github.com/software-mansion/react-native-svg) — Progress ring
- [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/) — Audio playback
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) — Local persistence

---

## License

MIT © SolFocus

---

<div align="center">
  <strong>Complete → full refund &nbsp;·&nbsp; Abandon → lose 20%</strong><br/>
  <sub>Built on Solana ◎ · Available on Seeker 📱</sub>
</div>
