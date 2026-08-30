# CV & Portfolio Builder — Design Spec

> **Status:** Approved design spec
> **Date:** 2026-08-30

**Page:** An interactive 3-column "AI Resume Command Center" where students (high school graduates, early-career) build a professional CV in real time. Inputs on the left, live preview canvas in the center, ATS recruiter simulator on the right. No traditional form-to-PDF static builder — everything updates live.

## Route & Navigation

- **Route:** `/builder`
- **Layout:** Inside the existing app shell — sidebar + topnav visible, page renders in the main content area (`(app)` route group)
- **Sidebar placement:** New link "CV Builder" (icon: `FileText` from lucide-react) in the **Skills & Side Hustles** group
- **Auth:** Protected by existing middleware like all app pages

## Architecture

### Component tree

```
src/app/(app)/builder/page.tsx            — "use client" page shell, renders Builder
src/components/builder/builder.tsx        — orchestrator: holds all resume state, template state, tab state
src/components/builder/builder-header.tsx — toolbar: template selector, Download PDF, Get Live Web Link
src/components/builder/input-panel.tsx    — left column: 4 tabs (Identity, Experience, Projects, Skills)
src/components/builder/identity-tab.tsx   — name, email, phone, socials, target role
src/components/builder/experience-tab.tsx — raw notes textarea + AI Polish button + polished bullets list
src/components/builder/projects-tab.tsx   — projects, academics, certificates, leadership entries
src/components/builder/skills-tab.tsx     — interactive pill selector, auto-suggest tags per target role
src/components/builder/resume-canvas.tsx  — center: live preview, template-aware rendering, hover-to-rewrite
src/components/builder/ats-panel.tsx      — right: mode switcher, impact gauge, breakdown, feedback feed
src/components/builder/share-modal.tsx    — "Get Live Web Link" modal + standalone print view
src/lib/resume-model.ts                   — pure functions: types, ATS scoring, STAR polish engine, feedback rules
src/data/resume-mock.ts                   — mock initial state (fully populated demo CV)
```

### Data model (single source of truth in `builder.tsx` state)

```ts
type TemplateId = "silicon" | "academic" | "glass";
type RecruiterMode = "startup" | "corporate" | "university";
type TabId = "identity" | "experience" | "projects" | "skills";

interface ResumeData {
  identity: {
    name: string; email: string; phone: string;
    location: string; github: string; linkedin: string;
    targetRole: string;
  };
  experience: {
    rawNotes: string;               // informal text area
    bullets: string[];              // AI-polished STAR bullets
    polished: boolean;              // whether AI polish has been applied
  };
  projects: {
    entries: { title: string; org: string; year: string; description: string }[];
    academics: { degree: string; institution: string; score: string; years: string }[];
    certificates: string[];
    leadership: string[];
  };
  skills: {
    tech: string[];                 // selected pills
    soft: string[];
  };
}
```

## Left Column — Input & Skill Transformer (30%)

4 tabs with smooth transitions (fade/slide on tab switch):

1. **Identity & Targets** — name, email, phone, location, GitHub, LinkedIn, target role (with placeholder examples: "Junior Web Developer", "Pre-Med Research Intern", "Freelance Graphic Designer"). Active inputs get electric blue focus rings.
2. **Experience Transformer** — textarea "What have you actually done?" for raw informal notes (placeholder example given). **"AI Polish" button** (⚡) transforms raw notes into 3 high-impact STAR bullet points with metrics. Rule-based engine: detects numbers/quantities, converts passive phrasing to action verbs, adds structure (Action → Task → Result). Shows a brief "polishing…" animation (600ms) before results appear.
3. **Projects & Academics** — fields for school projects, science exhibition entries, online certificates, extracurricular leadership. Each is a small form with add/remove.
4. **Tech & Soft Skills Matrix** — interactive pill selector. Typing in a field shows auto-suggested pills based on target role (e.g., target "Web Developer" suggests: HTML, CSS, JavaScript, Git, React). Click to toggle selected.

## Center Column — Live Preview Canvas (45%)

- **Sticky toolbar** at top: template selector (3 options with mini preview swatches), **"Download Clean PDF"** (primary, html2pdf.js), **"Get Live Web Link"** (secondary).
- **Resume canvas paper:** pixel-perfect A4-ratio render updating in real time. Template-aware:
  - **Academic Scholar** (default): white paper, serif (Georgia/serif stack), centered name header, formal section rules, ideal for university/med applications
  - **Silicon Valley Minimal**: dark slate paper (#0F172A), white text, Inter-style sans, compact single column, blue accent links
  - **Modern Glass Creative**: dark glassmorphism card, gradient avatar initial, rounded sections, sans-serif
- **Interactive hover states:** hovering any bullet reveals a floating pencil button → "Rewrite with AI" (regenerates that bullet) and "Make More Quantifiable" (adds metrics).
- Paper scales responsively (max-width ~640px in the column).

## Right Column — AI Recruiter & ATS Battle Simulator (25%)

- **Recruiter mode switcher:** "Startup Founder" | "Corporate HR" | "University Admissions Officer" — changes scoring weights + feedback personality.
- **Live ATS Score Gauge:** circular progress ring, overall "Impact Score" /100, color-coded (emerald ≥ 80, amber 50–79, red < 50). Real-time breakdown bars: Formatting Readability, Action Verb Strength, Keyword Density.
- **Recruiter Live Roast & Feedback:** dynamic feedback cards (⚠️ warnings, 💡 tips) computed by rule engine:
  - Cliché detection ("hardworking", "passionate", "team player" without evidence)
  - Action verb strength (starts with weak verbs: "was", "did", "helped")
  - Keyword match vs target role (e.g., CS target without git/skills listed)
  - Missing contact/socials, missing metrics in bullets
  - **1-Click "AI Auto-Fix"** under every card — repairs the issue on the preview instantly (e.g., replaces cliché, adds suggested keyword pill, adds placeholder metric)

### Scoring rules (in `resume-model.ts`, pure functions)

- **Action verb strength** (%): bullets starting with strong action verbs (led, built, designed, coordinated, grew, organized, launched, produced, managed, created) vs weak/stative
- **Keyword density** (%): target-role keyword dictionary intersection with skills + bullets
- **Formatting readability** (%): sections present, bullets length (10–30 words ideal), punctuation, consistent capitalization
- **Impact score** = weighted sum, weights depend on recruiter mode (startup favors action verbs + keywords, university favors academics + formatting, corporate balances all)

## PDF & Share

- **Download Clean PDF:** `html2pdf.js` (new dependency) — renders the resume canvas node to a clean PDF, `filename = "Name-Resume.pdf"`. All templates render to PDF with a **white background and dark text** (dark templates get inverted via html2pdf options so the printed document is ink-friendly and professional).
- **Get Live Web Link:** opens share modal — shows a generated mock link (`aftermediate.site/builder/view/{slug}`) + "Copy Link" (copies mock URL) + "Open Standalone Preview" button that opens a new window with a clean standalone render of the resume (via `window.open` + `document.write` of the canvas HTML, print-friendly).

## Design & Aesthetic

- **Page area:** dark matte `#09090B` with subtle grid lines (repeating-linear-gradient), panels `#111118` with `#222` borders
- **Preview paper:** white (academic) / slate `#0F172A` (silicon, glass)
- **Accents:** electric blue `#3B82F6` (active inputs, primary buttons), emerald `#10B981` (high ATS scores, positive feedback), amber `#d99a2b` (warnings), red `#d63d3d` (low scores)
- **Typography:** Plus Jakarta Sans (existing project font) for UI; template-specific (serif for academic, Inter-ish sans for silicon/glass) on the canvas
- **Responsive:** desktop-first 3-column (30/45/25); below `lg` the columns stack (input → preview → ATS)

## Mock Data (initial load)

Fully populated demo CV for "Hira Ahmed" — FSc Pre-Medical student at Kinnaird College, target role "Pre-Med Research Intern":
- Raw notes about organizing school sports day, YouTube video editing, FSc Physics lab work
- 3 pre-polished STAR bullets
- 2 projects, 1 academic entry, 2 certificates, 1 leadership
- Tech skills: Microsoft Office, Canva, Basic Video Editing; Soft: Communication, Time Management
- Initial ATS state computed from this data

## Testing

- `resume-model.test.ts` — pure function tests: STAR polish engine (numbers extracted, action verbs added, 3 bullets max), ATS scoring (verb strength, keyword density, formatting, mode weight differences), feedback rules (cliché detection, weak verb detection, missing keyword suggestion), auto-fix transformations
- `builder.test.tsx` — component tests: renders with mock data, tab switching, AI Polish button transforms notes into bullets, typing name updates canvas in real time, template switcher changes canvas classes, ATS gauge reflects bullet edits, auto-fix button updates preview, PDF button present, share modal opens

## Out of Scope (Future Work)

- Real LLM-backed polish (swap rule engine for `/api/chat` call)
- Real hosted share links (needs backend storage)
- Account-based CV saving (localStorage persistence could be added later)
- Multi-page resumes, cover letter generation
