# Mentor Match — Peer Mentorship Directory

> **Status:** Design spec — approved
> **Date:** 2026-08-30

**Page:** A community-driven mentorship directory where students can discover and connect with peer mentors — current students and recent graduates — across fields including engineering, medical, tech, business, arts, and civil services.

## Page Naming

**Selected name:** Mentor Match
**Rationale:** Warm and personal — emphasizes the human connection. "Match" suggests personalized pairing rather than a cold directory. Fits within the project's naming style alongside tools like "Safar A.I" and "Ustaad A.I."

**Alternatives considered:** Expert Connect, Field Guide, The Pro File, Career Compass

## Route & Navigation

- **Route:** `/mentors` — short, memorable, follows the pattern of `/career`, `/trends`, `/money`
- **Sidebar placement:** New group "Community" or add to existing nav — up to implementation

## Architecture

Approach: **Featured + Directory Hybrid** (Approach 2, approved by user)

```
MentorMatchPage
├── HeroSection            — Headline, subtitle, CTA buttons, 3 featured mentor avatars
├── SearchBar              — Text search across name, institution, topics
├── CategoryFilter         — Pill buttons: All, Engineering, Medical, Tech, Business, Arts, Civil Services
├── MentorGrid
│   ├── MentorCard × N     — Grid of profile cards (2-col desktop, 1-col mobile)
│   └── EmptyState         — "No mentors match this filter"
├── MentorDetailModal      — Full profile on card click
└── BecomeMentorCTA        — "Want to be a mentor?" bottom section
```

### Component Roles

| Component | Responsibility |
|---|---|
| `MentorMatchPage` | Page wrapper — orchestrates data loading, filter state, search state |
| `HeroSection` | Intro block — static content, featured mentor avatars |
| `SearchBar` | Debounced text search |
| `CategoryFilter` | Pill-button filter by field category |
| `MentorGrid` | Receives filtered mentor array, renders grid or empty state |
| `MentorCard` | Individual profile card — avatar, name, institution, bio snippet, topic chips, social buttons |
| `MentorDetailModal` | Expanded profile on card click — full bio, achievements, all social links, subject chips |
| `BecomeMentorCTA` | Bottom CTA — placeholder link for future mentor signup |

## Data Model

### Mock Data

All profiles live in a single JSON file: `src/data/mentors.json`

### MentorProfile Type

```typescript
interface MentorProfile {
  id: string;
  name: string;
  avatar: string;           // gradient index or placeholder path
  institution: string;       // "LUMS", "NED", "AKU", etc.
  degree: string;            // "Economics", "MBBS (3rd year)", etc.
  field: MentorField;
  bio: string;               // 1-2 sentences, peer-to-peer tone (not corporate)
  topics: string[];          // e.g., ["ECAT prep", "Self-study tips", "CSS prep"]
  socials: SocialLink[];
  achievements: string[];    // max 3 — simple bullets like "Cleared ECAT on 2nd attempt"
  availability: "available" | "limited" | "booked";
}

interface SocialLink {
  platform: "instagram" | "discord" | "whatsapp";
  label: string;             // "Connect on Instagram", "Join Discord", "Reach out"
  url: string;
}

type MentorField = "engineering" | "medical" | "tech" | "business" | "arts" | "civil-services";
```

### Profile Coverage

Minimum 12 profiles across all fields (2 per field):

- **Engineering:** NED (Software), GIKI (Mechanical)
- **Medical:** AKU (MBBS), KEMU (MBBS)
- **Tech:** FAST (CS), LUMS (CS) 
- **Business:** LUMS (Economics), IBA (Business Admin)
- **Arts:** Beaconhouse (Design), NCA (Fine Arts)
- **Civil Services:** CSS aspirant (PMS qualifier), CSP officer (recently passed)

### Social Platform Colors

| Platform | Brand Color | Label |
|---|---|---|
| Instagram | `#e1306c` (pink) | "📸 Instagram" |
| Discord | `#5865f2` (blurple) | "💬 Discord" |
| WhatsApp | `#25d366` (green) | "📱 WhatsApp" |

## States & Edge Cases

| State | Behavior |
|---|---|
| **Loading** | Skeleton cards (3-4) with pulse animation matching card dimensions |
| **Populated** | Normal grid with category filter and search |
| **Empty — no results** | "No mentors in this category yet. Check back soon." + "Browse all" link |
| **Empty — no search matches** | "No mentors match your search. Try a different keyword." |
| **Card with 1 social** | Single button, full-width (no flex split) |
| **Card with 2+ socials** | Equal-width buttons in a row |
| **Detail modal open** | Scroll-locked body, click-outside-to-close, esc to close |
| **Mentor with "booked" availability** | Show "Fully booked — join waitlist" text on card |
| **Mentor with "limited" availability** | Show "1-2 slots open" on card |

## Design Tokens

Follow the project's existing design system:
- Card container: `card-glass rounded-2xl p-5`
- Names: `text-lg font-bold text-ink` (18px)
- Institution/degree: `text-sm font-semibold text-saffron`
- Bio: `text-sm text-muted`
- Topic chips: `rounded-full bg-surface-2 px-3 py-1 text-xs text-muted`
- Buttons: social brand colors, `rounded-xl px-4 py-2.5 text-xs font-semibold text-white`
- Grid: responsive `grid grid-cols-1 md:grid-cols-2 gap-5`
- Hero background: `bg-surface-2/50` or soft gradient

## Page Copy

### Hero
- Headline: **"Find your mentor"**
- Subtitle: "Real students. Honest advice. One conversation can change your direction."
- Primary CTA: "Browse mentors"
- Secondary CTA: "Become a mentor" (placeholder — no-op or `/mentors/become` stub)

### Footer
"Profiles are illustrative samples. Mentor availability and response times may vary."

### Empty State
"No mentors match this filter. Check back soon."

## Future Work (NOT in MVP)

- Mentor signup form (/mentors/become)
- Real-time availability calendar
- Mentor review / rating system
- In-app messaging instead of external social links
- Search by city, by exam, by study abroad target

## Mobile Responsiveness

- Hero: stacked layout (title → text → buttons → avatars)
- Category filter: horizontal scroll on mobile (`overflow-x-auto`)
- Grid: 1 column on mobile, 2 on `md:` and above
- Cards: full-width on mobile, full card content visible
- Detail modal: full-screen slide-up on mobile, centered dialog on desktop

## Test Strategy

- Render hero with expected copy
- Filter by category — only matching mentors shown
- Search by name / institution / topic — correct filtering
- Switch between categories resets search
- Empty state when no mentors match filter
- Card renders social buttons based on socials array length
- Detail modal opens on card click, shows full profile
- Modal closes on esc / click-outside / close button
- Availability badge shows correct dot color + text
- Mobile layout is 1 column, desktop is 2 columns