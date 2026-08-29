/**
 * ============================================================
 *  HUNAR'S KNOWLEDGE BASE — EDIT THIS FILE TO TRAIN THE BOT
 * ============================================================
 *  HOW IT WORKS:
 *  - Every chat request injects this entire file into Hunar's
 *    system prompt (see src/lib/ai.ts). Hunar answers from it
 *    and cites each fact's `source` URL.
 *  - To teach Hunar something new: add a fact object
 *    `{ text: "...", source: "https://..." }` inside a topic,
 *    or add a whole new topic.
 *  - Keep facts short and factual. Every fact MUST carry the
 *    URL it came from — Hunar cites it in its answers.
 *  - After editing, restart `next dev` (the prompt is built at
 *    server start) and run `npx vitest run src/data/skills-chatbot-knowledge.test.ts`.
 *  - DO NOT put secrets or personal data here — it is sent to
 *    the AI model with every chat message.
 * ============================================================
 */

export interface KnowledgeFact {
	text: string;
	source: string; // URL
}

export interface KnowledgeTopic {
	id: string;
	title: string;
	facts: KnowledgeFact[];
}

export const skillsChatbotKnowledge: {
	updatedAt: string;
	topics: KnowledgeTopic[];
} = {
	updatedAt: "2026-08-29",
	topics: [
		{
			id: "zero-to-start",
			title: "Where a Complete Beginner Starts",
			facts: [
				{
					text: "DigiSkills.pk is the Government of Pakistan's free training portal — it offers beginner courses in freelancing, graphic design, and e-commerce with certificates, and is one of the most practical first steps for a complete beginner in Pakistan.",
					source: "https://digiskills.pk/",
				},
				{
					text: "freeCodeCamp offers completely free, self-paced certifications in responsive web design and JavaScript that take a few months each; the curriculum is project-based, so the projects double as portfolio work.",
					source: "https://www.freecodecamp.org/",
				},
				{
					text: "Bano Qabil runs free IT training programs (including web development and freelancing tracks) for students in Karachi and other cities; seats are limited and enrollment opens in batches, so follow its announcements.",
					source: "https://banoqabil.pk/",
				},
				{
					text: "Exhaust the free tier before buying any paid course: DigiSkills, freeCodeCamp, and Google Career Certificates all offer free material, and a beginner can realistically reach a first paid gig without spending anything on training.",
					source: "https://grow.google/",
				},
			],
		},
		{
			id: "choosing-a-skill",
			title: "How to Pick a Marketable Skill",
			facts: [
				{
					text: "Pick a skill with visible demand: on Upwork and Fiverr, web development, graphic design, content writing, and video editing consistently generate the most jobs for Pakistani freelancers — scan live job posts before committing.",
					source: "https://www.upwork.com/resources/",
				},
				{
					text: "Match the skill to your constraints: writing needs strong English, design needs taste and speed, and development needs a longer learning curve — a student with two hours a day should pick a skill with a short learning-to-first-gig path.",
					source: "https://help.fiverr.com/hc/en-us",
				},
				{
					text: "Try-before-you-commit works: spend 2-3 weeks on a free course in each candidate skill (DigiSkills or freeCodeCamp), then pick the one where you make steady progress — motivation predicts completion better than initial excitement.",
					source: "https://digiskills.pk/",
				},
				{
					text: "Demand is concentrated in niches: e-commerce stores, SaaS startups, and YouTubers all need landing pages, logos, product copy, and thumbnails — niche skills like Shopify store setup often price higher than generic ones.",
					source: "https://www.upwork.com/resources/",
				},
			],
		},
		{
			id: "skill-roadmaps",
			title: "Learning Roadmaps: Frontend, Design, Data, Writing",
			facts: [
				{
					text: "Frontend roadmap: learn HTML and CSS first, then JavaScript, then a framework like React — roadmap.sh publishes a free, step-by-step frontend roadmap showing exactly what to learn and in what order.",
					source: "https://roadmap.sh/",
				},
				{
					text: "Design roadmap: master Figma for UI work and Canva for marketing graphics, study color, typography, and layout basics, then practice by redesigning real brand pages — Behance is the showcase where clients judge your taste.",
					source: "https://www.figma.com/",
				},
				{
					text: "Data roadmap: start with Excel and SQL (both free to learn), then move to Python and a dashboard tool like Power BI or Google Looker Studio — clients reward SQL fluency surprisingly fast in the Pakistani market.",
					source: "https://www.freecodecamp.org/",
				},
				{
					text: "Writing roadmap: study copywriting fundamentals (benefit-led headlines, clear calls to action), build a niche like website copy or email sequences, and read high-converting pages in your niche daily to internalize the patterns.",
					source: "https://www.coursera.org/",
				},
			],
		},
		{
			id: "building-a-portfolio",
			title: "What a Portfolio Needs",
			facts: [
				{
					text: "A client-ready portfolio needs 3-5 complete projects, not tutorials: real briefs, your own copy, and screenshots or live links — clients on Upwork and Fiverr mostly skim portfolios for evidence you can deliver.",
					source: "https://www.upwork.com/resources/",
				},
				{
					text: "Write a one-line context for every project: the client's problem, your role, and the result — a logo alone is weak, but 'logo plus brand kit delivered in 5 days to a wedding planner' sells the next job.",
					source: "https://help.fiverr.com/hc/en-us",
				},
				{
					text: "Show process, not just polish: include a before/after pair, a wireframe-to-final screenshot, or a short case-study paragraph — this signals you can take direction and iterate, which is what clients actually fear most.",
					source: "https://www.behance.net/",
				},
				{
					text: "Keep your portfolio skimmable in 30 seconds: a one-line intro, 3-5 project cards with titles and results, and a visible contact link — most clients decide within the first screen of a portfolio page.",
					source: "https://www.upwork.com/resources/",
				},
			],
		},
		{
			id: "portfolio-projects",
			title: "Starter Project Ideas (3-5 per Skill)",
			facts: [
				{
					text: "Frontend starters: a personal resume site, a landing page for a fictional local business (a Lahore restaurant or Karachi gym), a weather or notes app, and a mobile-first restaurant menu site.",
					source: "https://www.theodinproject.com/",
				},
				{
					text: "Design starters: redesign three real brand homepages in Figma, build a fictional coffee-shop brand kit (logo, colors, business card), and create five Instagram post templates for a niche brand like a bakery.",
					source: "https://www.figma.com/",
				},
				{
					text: "Writing starters: write website copy for a fictional SaaS, five product descriptions for real e-commerce products, and three email sequences (welcome, offer, follow-up) for a niche like fitness or skincare.",
					source: "https://www.coursera.org/",
				},
				{
					text: "Data starters: clean and visualize a public dataset from Kaggle, build a sales dashboard in Excel or Google Sheets, and write one SQL analysis that answers a real business question.",
					source: "https://www.kaggle.com/",
				},
				{
					text: "Video starters: edit three YouTube-ready shorts from free stock footage, create a 60-second brand ad, and one talking-head video with captions and b-roll — publish them publicly as proof of your skill.",
					source: "https://www.canva.com/",
				},
			],
		},
		{
			id: "portfolio-hosting",
			title: "Free Hosting for Your Portfolio",
			facts: [
				{
					text: "GitHub Pages hosts static sites for free at a yourname.github.io URL — ideal for a developer portfolio, and it doubles as proof you know Git; docs.github.com explains the setup step by step.",
					source: "https://docs.github.com/en/pages",
				},
				{
					text: "Netlify's free plan deploys static sites and frontend apps with drag-and-drop or Git-based deploys, includes a free subdomain with HTTPS, and is the most beginner-friendly way to get a live portfolio in minutes.",
					source: "https://www.netlify.com/",
				},
				{
					text: "Vercel's free plan is built for Next.js and React projects — it auto-deploys from GitHub on every push and gives you a free domain, making it the standard choice for frontend portfolios.",
					source: "https://vercel.com/docs",
				},
				{
					text: "You do not need a paid domain to win clients: a clean free subdomain (yourname.netlify.app or .vercel.app) with a professional portfolio beats an expensive domain attached to a broken page every time.",
					source: "https://www.upwork.com/resources/",
				},
			],
		},
		{
			id: "pricing-basics",
			title: "How to Price Your First Jobs",
			facts: [
				{
					text: "For your first 3-5 jobs, price to win the review rather than to profit: a fair low rate on a small project buys your first five-star reviews, which unlock the better-paying jobs on Upwork and Fiverr.",
					source: "https://www.upwork.com/resources/",
				},
				{
					text: "The universal beginner error is quoting per hour on fixed-scope work: for small jobs, quote a fixed project price and write exactly what is included in the offer before the client accepts it.",
					source: "https://help.fiverr.com/hc/en-us",
				},
				{
					text: "Research rates before quoting: search Upwork and Fiverr for your exact service, note what established sellers with similar portfolios charge, and price your first jobs slightly below the middle of that range.",
					source: "https://www.upwork.com/resources/",
				},
				{
					text: "Never price so low that you resent the work — a Rs 500 logo makes you cut quality and burn out; a modest price you are proud of produces the work that actually gets you rehired at better rates.",
					source: "https://digiskills.pk/",
				},
			],
		},
		{
			id: "pricing-rates-pakistan",
			title: "Typical Pakistan Rates in USD (with PKR Context)",
			facts: [
				{
					text: "Typical Pakistan market rates, hedged for 2026: logos roughly USD 50-150 (around Rs 14k-42k at 280-300 PKR/USD), simple websites USD 150-500, and 500-word articles USD 20-60 — global platforms set these bands.",
					source: "https://www.upwork.com/resources/",
				},
				{
					text: "At an exchange rate of roughly 280-300 PKR per USD, a USD 100 logo converts to about Rs 28,000-30,000 — before platform and withdrawal fees — so compute your PKR take-home before accepting any price.",
					source: "https://wise.com/help/",
				},
				{
					text: "Video editing for social media typically runs USD 30-150 per short video in the Pakistani market, and a five-minute YouTube edit roughly USD 50-200, depending on complexity and turnaround time.",
					source: "https://help.fiverr.com/hc/en-us",
				},
				{
					text: "Rates are a range, not a law: a brand-new seller with no reviews will realistically start at the bottom of these bands and climb within 6-12 months by stacking reviews and testimonials.",
					source: "https://www.upwork.com/resources/",
				},
			],
		},
		{
			id: "pricing-strategies",
			title: "Value-Based Pricing, Bundles & Retainers",
			facts: [
				{
					text: "Value-based pricing means pricing the outcome, not the hours: a landing page that a client expects to generate leads is worth more than the six hours it took you to build, and clients accept this framing when you speak business.",
					source: "https://www.upwork.com/resources/",
				},
				{
					text: "Bundles raise average order value: instead of a logo alone, offer 'logo + business card + social media kit' at a package price — clients feel they are getting more, and you earn more per project.",
					source: "https://help.fiverr.com/hc/en-us",
				},
				{
					text: "Retainers smooth your income: many Pakistani freelancers move established clients to a monthly retainer (for example, four social posts or two blog posts per month) — predictable hours, predictable payment, no renegotiation.",
					source: "https://digiskills.pk/",
				},
				{
					text: "Tier your offers: a basic, standard, and premium package on Fiverr lets price-sensitive clients self-select, and the middle tier is where most buyers land — this is standard marketplace practice, not manipulation.",
					source: "https://help.fiverr.com/hc/en-us",
				},
			],
		},
		{
			id: "getting-paid",
			title: "Getting Paid: Payoneer, Wise, Elevate & Banks",
			facts: [
				{
					text: "Payoneer is the most widely used withdrawal route for Pakistani freelancers — Upwork and Fiverr both pay out to it, and it converts USD to PKR at rates near the interbank rate on withdrawals to local bank accounts.",
					source: "https://www.payoneer.com/",
				},
				{
					text: "Wise (formerly TransferWise) lets you receive USD into a virtual US account and convert to PKR at the mid-market rate with transparent fees — popular with direct clients who can pay by bank transfer.",
					source: "https://wise.com/help/",
				},
				{
					text: "Elevate Pay is a Pakistan-focused fintech that provides USD receiving accounts for freelancers and remote workers and transfers funds to local bank accounts — check its current fees and supported corridors before relying on it.",
					source: "https://www.elevatepay.co/",
				},
				{
					text: "Upwork pays through its own escrow: funds land in your Upwork account after the client releases them, and you withdraw weekly to Payoneer, Wise, a local bank, or other methods — each has different fees and timing.",
					source: "https://support.upwork.com/hc/en-us",
				},
			],
		},
		{
			id: "payment-fees",
			title: "Withdrawal Fees & FX Margins",
			facts: [
				{
					text: "Platform fees are the first cut: Upwork typically charges freelancers a 10% flat service fee on earnings, and Fiverr charges a 20% commission per order — factor both into every quote you send.",
					source: "https://support.upwork.com/hc/en-us",
				},
				{
					text: "Payoneer typically charges a small percentage plus a fixed fee for withdrawals to bank accounts, and currency conversion carries an FX margin — exact figures change, so check Payoneer's current fee schedule before withdrawing.",
					source: "https://www.payoneer.com/",
				},
				{
					text: "Wise charges around 1% or less for USD-to-PKR conversion plus a small fixed fee, and it always converts at the mid-market rate — historically among the cheaper ways to move small freelancer payments into Pakistan.",
					source: "https://wise.com/help/",
				},
				{
					text: "The gap between the interbank rate and your provider's conversion rate is often the largest hidden cost — a 2-3% FX margin on a USD 500 payment is roughly USD 10-15, so compare providers before withdrawing.",
					source: "https://www.payoneer.com/",
				},
			],
		},
		{
			id: "fbr-taxes",
			title: "FBR & NTN Basics for Freelancers",
			facts: [
				{
					text: "Pakistani freelancers earning taxable income must register for an NTN (National Tax Number) through FBR's IRIS portal and file annual income tax returns — NTN registration itself is free of charge.",
					source: "https://iris.fbr.gov.pk/",
				},
				{
					text: "As of the tax year 2025-26 guidance, export income from freelancing and IT services is taxed at a low final rate — around 1% of gross earnings (and 0.25% for exporters registered with PSEB) — but the regime has shifted before, so verify current rules on fbr.gov.pk.",
					source: "https://fbr.gov.pk/",
				},
				{
					text: "FBR has issued clarifications on the tax treatment of exported IT services and freelancing income — treat any rate table shared on social media as a starting point and confirm the current position with FBR's official channels.",
					source: "https://www.fbr.gov.pk/fbr-issues-the-clarification-on-tax-exemption-from-income-of-exported-it-services/152894",
				},
				{
					text: "Registering as a filer has direct cash benefits: filers pay lower withholding rates on banking transactions and are treated as compliant by banks and payment providers, while non-filers face higher rates.",
					source: "https://fbr.gov.pk/",
				},
			],
		},
		{
			id: "client-acquisition",
			title: "Upwork/Fiverr Profiles & Proposals",
			facts: [
				{
					text: "Your Upwork and Fiverr profile is a landing page: a clear headline naming your service, a 2-3 line intro stating your outcome and experience, and 3-5 portfolio samples — clients spend seconds deciding whether to click.",
					source: "https://www.upwork.com/resources/",
				},
				{
					text: "Tailored proposals beat volume: on Upwork, a 3-4 sentence proposal that restates the client's problem and shows one relevant sample outperforms a generic 'I can do this' pitch — quality over quantity is the standard advice.",
					source: "https://support.upwork.com/hc/en-us",
				},
				{
					text: "Connects are finite: Upwork charges Connects per proposal, so spend them only on jobs you are genuinely a fit for, apply early (early applications get more views), and track which proposals convert to improve.",
					source: "https://support.upwork.com/hc/en-us",
				},
				{
					text: "New sellers should seed their profiles: complete Fiverr's seller profile, add gig images and FAQs, and deliver the first few orders fast and friendly — this builds the response-rate and delivery-time badges clients filter by.",
					source: "https://help.fiverr.com/hc/en-us",
				},
			],
		},
		{
			id: "client-communication",
			title: "Talking to Clients & Managing Scope",
			facts: [
				{
					text: "Before quoting, ask 3-5 questions: what is the goal, who is the audience, what does done look like, what is the deadline, and what is the budget — a client who answers clearly is a client you can deliver for.",
					source: "https://www.upwork.com/resources/",
				},
				{
					text: "Write the scope into the contract: number of revisions, file formats, word or page counts, and what is excluded — most freelancer-client disputes come from assumptions neither side wrote down.",
					source: "https://support.upwork.com/hc/en-us",
				},
				{
					text: "Reply fast and in plain English: responding within a few hours (even 'got it, will review tonight') builds trust, and confirming every instruction back in writing protects you if expectations drift later.",
					source: "https://help.fiverr.com/hc/en-us",
				},
				{
					text: "Agree on the timezone overlap from day one: Pakistani freelancers serving US clients often shift work into evening hours, so settle the communication window before the project starts, not after deadlines slip.",
					source: "https://digiskills.pk/",
				},
			],
		},
		{
			id: "contracts-and-payments",
			title: "Contracts, Deposits & Milestone Payments",
			facts: [
				{
					text: "Require a deposit before starting: 50% up front is the widely recommended practice for direct clients and covers your time if the client vanishes — even 30-50% filters out unserious buyers.",
					source: "https://www.upwork.com/resources/",
				},
				{
					text: "Use milestone payments on longer projects: split the work into 2-3 phases with a payment per milestone (for example, 30% to start, 40% at draft, 30% on delivery) — Upwork's escrow supports this structure.",
					source: "https://support.upwork.com/hc/en-us",
				},
				{
					text: "A simple one-page contract is enough for direct clients: parties, scope, price, payment schedule, revision count, and file ownership — a written agreement converts most 'I will pay later' risks into enforceable terms.",
					source: "https://www.upwork.com/legal",
				},
				{
					text: "Escrow protects both sides: on Upwork the client funds the milestone before you start, and funds release when you deliver — never do paid work outside the platform where there is no escrow protecting you.",
					source: "https://support.upwork.com/hc/en-us",
				},
			],
		},
		{
			id: "difficult-clients",
			title: "Late Payments, Scope Creep & Unreasonable Revisions",
			facts: [
				{
					text: "Manage scope creep with the revision clause: state 2-3 revision rounds in the contract, and treat anything beyond that as a new mini-project with a price — 'that is outside the original scope' is professional, not rude.",
					source: "https://help.fiverr.com/hc/en-us",
				},
				{
					text: "Treat late payment as a process, not a feeling: send a friendly reminder two days before the due date, a firmer one on the due date, then pause work — clients who pay everyone else usually pay you once you stop working free.",
					source: "https://www.upwork.com/resources/",
				},
				{
					text: "Unreasonable revision demands often mean unclear expectations: re-read the original brief with the client, screenshot it, and let the written brief decide — most disputes resolve in your favor when the brief exists.",
					source: "https://support.upwork.com/hc/en-us",
				},
				{
					text: "End difficult relationships with evidence and grace: deliver what was promised, archive the chat log, and leave a factual review — your future earnings and your Upwork Job Success Score both benefit from calm exits.",
					source: "https://www.upwork.com/resources/",
				},
			],
		},
		{
			id: "scams-to-avoid",
			title: "Scams to Avoid: Fake Clients & Upfront Fees",
			facts: [
				{
					text: "Never pay to start work: no legitimate client charges a 'registration fee', 'processing fee', or 'refundable security deposit' — any upfront payment a client asks YOU to make is a scam, full stop.",
					source: "https://support.upwork.com/hc/en-us",
				},
				{
					text: "Too-good offers are bait: a client offering USD 500 for a one-hour logo job, or a 'government contract' with no interview, is almost always fishing — legitimate clients ask questions and negotiate.",
					source: "https://www.upwork.com/resources/",
				},
				{
					text: "Real platforms never charge to unlock jobs: Upwork sells Connects (which you can also earn) and Fiverr takes a commission on completed orders — neither charges a fee to access a specific job offer.",
					source: "https://help.fiverr.com/hc/en-us",
				},
				{
					text: "Protect your accounts: enable two-factor authentication on Payoneer, Wise, and marketplace accounts, never share OTPs or passwords, and treat emails asking you to 'verify' payment details via a link as suspicious.",
					source: "https://www.payoneer.com/",
				},
				{
					text: "Verify payment before releasing work: wait until funds actually appear in your account or escrow is funded — clients who say 'the transfer is processing' while demanding delivery are running the classic no-payment scam.",
					source: "https://www.upwork.com/resources/",
				},
			],
		},
		{
			id: "time-management",
			title: "Working While Studying — Time & Deep Work",
			facts: [
				{
					text: "Protect two fixed hours a day: students who schedule freelance work at the same time each evening build a routine that survives exam weeks far better than 'whenever I get time' scheduling.",
					source: "https://digiskills.pk/",
				},
				{
					text: "Batch small client tasks: replies, revisions, and admin drain more energy than the work itself — answer messages twice a day, block 90-minute deep work sessions, and switch off notifications during them.",
					source: "https://www.coursera.org/",
				},
				{
					text: "Set exam-season ceilings: tell clients your availability in advance (for example, 'no new projects after 10 May until finals end'), deliver early rather than on the deadline, and take fewer, smaller orders during exams.",
					source: "https://www.upwork.com/resources/",
				},
				{
					text: "Energy beats hours: three focused hours beat eight exhausted ones — protect sleep, keep one to-do list, and finish projects one at a time, which also protects the on-time delivery rate clients reward.",
					source: "https://support.upwork.com/hc/en-us",
				},
			],
		},
	],
};
