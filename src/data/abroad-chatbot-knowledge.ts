/**
 * ============================================================
 *  SAFAR'S KNOWLEDGE BASE — EDIT THIS FILE TO TRAIN THE BOT
 * ============================================================
 *  HOW IT WORKS:
 *  - This file is a searchable corpus, not a prompt. On each
 *    chat request the facts are scored with BM25 and only the
 *    handful that match the question go into Safar's system
 *    prompt, each with its `source` URL to cite. See
 *    src/lib/knowledge.ts (retrieval) and src/lib/chat-prompt.ts
 *    (how the facts are rendered).
 *  - To teach Safar something new: add a fact object
 *    `{ text: "...", source: "https://..." }` inside a topic,
 *    or add a whole new topic. The index is built from this
 *    file on the first request and cached per process, so there
 *    is nothing to rebuild.
 *  - If Safar keeps missing a question you care about, do not
 *    reword the fact — add the student's vocabulary to ALIAS in
 *    src/lib/knowledge.ts under this topic's id. That is the
 *    second place you can train this bot.
 *  - Facts in a topic tend to be retrieved together, so group by
 *    what a student asks about, not by country.
 *  - Keep facts short and factual. Every fact MUST carry the
 *    URL it came from — Safar cites it in its answers.
 *  - Bump `updatedAt` when you review the facts: Safar's prompt
 *    prints it so he can date his own hedges, and a test fails
 *    once the date goes stale.
 *  - After editing, restart `next dev` and run
 *    `npx vitest run src/data/abroad-chatbot-knowledge.test.ts src/lib/knowledge.test.ts`.
 *  - DO NOT put secrets or personal data here — retrieved facts
 *    are sent to the AI model with every chat message.
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

export const abroadChatbotKnowledge: {
	updatedAt: string;
	topics: KnowledgeTopic[];
} = {
	updatedAt: "2026-08-27",
	topics: [
		{
			id: "visa-process",
			title: "Student Visa Process — Step by Step",
			facts: [
				{
					text: "Every destination requires a confirmed admission or acceptance letter before a student visa can be filed — for example, the UK issues a CAS (Confirmation of Acceptance for Studies) from the university and Germany requires the Zulassungsbescheid (admission letter).",
					source: "https://www.gov.uk/student-visa",
				},
				{
					text: "Germany's National D Student Visa typically takes 4-8 weeks to process: collect the admission letter, open the blocked account, arrange health insurance, and book the visa interview at the German Embassy Islamabad.",
					source: "https://pakistan.diplo.de",
				},
				{
					text: "The US F-1 route runs: accept the offer and receive Form I-20, pay the SEVIS I-901 fee of USD 350, complete the DS-160, then attend the visa interview at the US Embassy Islamabad with your I-20 and financial documents.",
					source: "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html",
				},
				{
					text: "For the UK, pay the visa application fee of GBP 558 (from April 2026) plus the Immigration Health Surcharge of GBP 776 per year online, then give biometrics at a visa application centre — standard decisions from outside the UK usually take about 3 weeks.",
					source: "https://www.gov.uk/student-visa",
				},
				{
					text: "Italy requires mandatory pre-enrollment on the Universitaly portal before the visa application, and after arrival you must apply for the residence permit (permesso di soggiorno) within 8 days.",
					source: "https://studyinitaly.esteri.it",
				},
				{
					text: "In China, convert the X1 visa into a residence permit within 30 days of arrival; Turkey and Indonesia similarly require a student residence or stay permit within 30 days, so book those appointments as soon as you land.",
					source: "https://www.campuschina.org",
				},
				{
					text: "The Netherlands works differently: your university files the combined MVV and residence permit (TEV) application with the IND on your behalf — you only pay the approx. EUR 254 fee and give biometrics at the embassy.",
					source: "https://ind.nl",
				},
			],
		},
		{
			id: "documents",
			title: "Core Document Checklist",
			facts: [
				{
					text: "Germany's checklist: valid passport, university admission letter, blocked account confirmation, academic transcripts and degrees, language certificate (IELTS/TOEFL or German), and health insurance proof.",
					source: "https://www.make-it-in-germany.com",
				},
				{
					text: "The UK file centres on the CAS statement, plus bank statements meeting the 28-day rule, a TB test certificate (required for Pakistani applicants), academic transcripts, and an English certificate (IELTS/PTE); some STEM and research courses also require an ATAS certificate.",
					source: "https://www.gov.uk/student-visa",
				},
				{
					text: "For the US interview, bring the signed Form I-20, the SEVIS I-901 fee receipt, the DS-160 confirmation page, financial documents (bank statements and sponsor letter), academic transcripts with test scores, and evidence of ties to Pakistan.",
					source: "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html",
				},
				{
					text: "The Netherlands adds a TB test certificate and a signed antecedents certificate for Pakistani applicants, alongside the admission letter, proof of funds, and English language certificate.",
					source: "https://ind.nl",
				},
				{
					text: "China requires the JW202 form (issued with the admission or CSC scholarship) and a physical examination report for stays over 6 months, in addition to the admission notice, transcripts, and a police character certificate where requested.",
					source: "https://www.campuschina.org",
				},
				{
					text: "Austria's residence permit file needs the admission letter, proof of financial means, accommodation confirmation, health insurance, and transcripts; applicants under 18 must also include a birth certificate.",
					source: "https://www.bmeia.gv.at/en/austrian-embassy-islamabad",
				},
				{
					text: "Ireland's D visa file includes the acceptance letter, proof of tuition payment (at least EUR 6,000 since June 2025), bank statements showing EUR 10,000, private health insurance, transcripts, and an English certificate (IELTS/PTE/Duolingo).",
					source: "https://www.irishimmigration.ie",
				},
			],
		},
		{
			id: "bank-statements",
			title: "Bank Statements & Proof of Funds",
			facts: [
				{
					text: "Germany requires a blocked account of approximately EUR 11,904 for one year of living costs (2025/26 level) — you deposit the full amount before applying and it is released in monthly instalments after arrival.",
					source: "https://www.make-it-in-germany.com",
				},
				{
					text: "For the UK, proof of funds is roughly GBP 1,150-1,500 per month depending on the city, and bank statements must satisfy the 28-day rule.",
					source: "https://www.gov.uk/student-visa",
				},
				{
					text: "Austria does not require a blocked account — regular proof of funds such as bank statements works, showing approximately EUR 722.58 per month if you are under 24.",
					source: "https://oead.at/en",
				},
				{
					text: "Ireland asks for proof of EUR 10,000 in accessible funds for the first year plus evidence of tuition payment, and since June 2025 at least EUR 6,000 of tuition must be paid in advance.",
					source: "https://www.irishimmigration.ie",
				},
				{
					text: "The Netherlands applies the IND norm of roughly EUR 1,200 per month as proof of funds; the university includes this in the residence permit application it files for you.",
					source: "https://ind.nl",
				},
				{
					text: "South Korea's D-2 visa asks for proof of funds of around USD 10,000-20,000 depending on the region — requirements run higher in Seoul than in regional cities.",
					source: "https://www.studyinkorea.go.kr",
				},
				{
					text: "Hungary asks for proof of funds of around EUR 500-600 per month, which bank statements satisfy; Turkey's requirement is similar at roughly USD 500-600 per month of stay.",
					source: "https://studyinhungary.hu",
				},
				{
					text: "Lithuania has one of Europe's lowest proof-of-funds bars — at least EUR 221 per month — submitted through the MIGRIS system with university mediation.",
					source: "https://studyin.lt",
				},
			],
		},
		{
			id: "money-questions",
			title: "Costs Overview — Tuition & Living (Hedged 2026 Figures)",
			facts: [
				{
					text: "Germany's public universities charge no tuition — only a small semester fee — though private universities charge around EUR 8,000-20,000 per year, making it one of the most affordable Western destinations.",
					source: "https://www.make-it-in-germany.com",
				},
				{
					text: "Italy's public universities charge income-based fees of roughly EUR 900-4,000 per year (private universities up to around EUR 15,000), and regional DSU scholarships can cover fees, meals, and housing for low-income students.",
					source: "https://studyinitaly.esteri.it",
				},
				{
					text: "Turkey is a popular budget option: public university tuition typically runs under USD 1,500 per year with affordable living costs, though high inflation makes local-currency budgeting volatile.",
					source: "https://www.studyinturkiye.gov.tr",
				},
				{
					text: "The US is the most expensive destination on this site — tuition typically USD 22,000-60,000 per year — but assistantships can waive tuition and pay a stipend, and Fulbright fully funds around 80-90 Pakistani students per year.",
					source: "https://educationusa.state.gov",
				},
				{
					text: "UK tuition for international students runs roughly GBP 14,000-38,000 per year plus the Immigration Health Surcharge, but one-year master's programs cut the total cost, and the 2-year Graduate Route lets most graduates work after study.",
					source: "https://www.ukcisa.org.uk",
				},
				{
					text: "Lithuania is among Europe's cheapest study destinations: tuition around EUR 2,000-8,000 per year with living costs among the lowest in the EU.",
					source: "https://studyin.lt",
				},
				{
					text: "Hungary's self-funded tuition runs roughly EUR 2,500-8,000 per year for bachelor's programs (up to about EUR 10,000 for master's), while medicine and dentistry cost considerably more at around EUR 15,000-22,000 per year.",
					source: "https://studyinhungary.hu",
				},
				{
					text: "In Germany, monthly living costs run around PKR 323,000 in big cities and PKR 236,000 in smaller ones (August 2026 rates), and students may work 140 full days or 280 half days per year to offset them.",
					source: "https://www.make-it-in-germany.com",
				},
				{
					text: "London is among the priciest student cities — around PKR 700,000 per month all-in (August 2026 rates) — while UK cities outside London average closer to PKR 435,000.",
					source: "https://www.ukcisa.org.uk",
				},
			],
		},
		{
			id: "tests",
			title: "Which Test for Which Country",
			facts: [
				{
					text: "IELTS Academic is the most widely accepted English test across all 13 destinations on this site; it costs around PKR 75,600 in Pakistan (2026), is valid for 2 years, and 7.0+ overall is competitive for top universities.",
					source: "https://www.britishcouncil.pk/exam/ielts",
				},
				{
					text: "English-taught programs in Germany accept IELTS/TOEFL, but German-taught degrees typically need TestDaF (TDN 4 in all four sections, around EUR 210) or a Goethe certificate at B2/C1 — the Goethe-Institut runs exams in Karachi, Lahore, and Islamabad for roughly PKR 15,000-40,000.",
					source: "https://www.goethe.de/ins/pk/en/index.html",
				},
				{
					text: "US undergraduate applicants commonly need the digital SAT — about USD 111 from Pakistan including the international fee — with 1450-1550+ out of 1600 competitive for top universities; the ACT is the alternative.",
					source: "https://satsuite.collegeboard.org/sat/whats-on-the-test",
				},
				{
					text: "US graduate programs may require the GRE General Test (USD 249 from August 2026; 320+ combined is competitive) or the GMAT for business schools (around USD 275-300; 655+ for top programs); both scores are valid for 5 years.",
					source: "https://www.ets.org/gre/test-takers/general-test/prepare.html",
				},
				{
					text: "South Korea usually requires TOPIK for Korean-taught programs — Level 3 is the common admission minimum and Level 4-6 is needed for top universities and scholarships; scores are valid for 2 years.",
					source: "https://www.topik.go.kr/",
				},
				{
					text: "Chinese-taught programs in China generally need HSK 4 for many degrees and HSK 5+ for competitive universities; Pakistani sittings are limited (typically via the Confucius Institute in Lahore), so register early on chinesetest.cn.",
					source: "https://www.chinesetest.cn/",
				},
				{
					text: "Italian-taught degrees typically require CILS B2 (CILS DUE) or CELI 3, but CILS runs only about three sessions a year — plan backwards from enrolment deadlines; English-taught programs accept IELTS.",
					source: "https://cils.unistrasi.it/",
				},
				{
					text: "Cheaper or faster English options exist where accepted: the Duolingo English Test costs USD 70 with results usually within 2 days (accepted for Ireland), and PTE Academic runs about USD 215-240 in Pakistan (accepted for the UK and Ireland).",
					source: "https://englishtest.duolingo.com",
				},
			],
		},
		{
			id: "scholarships",
			title: "Scholarships & How to Apply",
			facts: [
				{
					text: "Most Pakistani government-nominated scholarships flow through HEC's portal at scholarship.hec.gov.pk — Commonwealth Master's/PhD, Stipendium Hungaricum, the Chinese Government Scholarship (CGSP), and the US-Pakistan Knowledge Corridor — so register early and watch for each cycle's advertisement.",
					source: "https://www.hec.gov.pk/site/scholarships",
				},
				{
					text: "Stipendium Hungaricum fully funds tuition, housing, a monthly stipend, and insurance in Hungary; the 2026/27 round closed on 15 January 2026, so expect a similar mid-January deadline each year, with applications required on both the Hungarian and HEC portals.",
					source: "https://stipendiumhungaricum.hu/",
				},
				{
					text: "The Fulbright Degree Program (via USEFP) fully funds master's or PhD study in the US — tuition, airfare, monthly stipend, and health insurance — and typically closes around 1 April each year; GRE scores are required with a minimum of 145 per section.",
					source: "https://usefp.org/scholarships/fulbright-degree.cfm",
				},
				{
					text: "Türkiye Bursları fully funds degree study in Turkey (tuition, monthly stipend, accommodation, insurance, a Turkish language year, and airfare); applications typically open in January and close in February, with shortlisted candidates interviewed at the Turkish Embassy Islamabad.",
					source: "https://www.turkiyeburslari.gov.tr/",
				},
				{
					text: "The Chinese Government Scholarship (CSC) covers full tuition, accommodation, a monthly stipend of roughly RMB 2,500-3,500, and insurance; apply via HEC nomination (Type A) or directly to a university (Type B), with windows typically December to April for the September intake.",
					source: "https://www.campuschina.org",
				},
				{
					text: "Chevening fully funds a one-year UK master's (tuition, living allowance, flights) for applicants with at least two years of work experience — applications typically open in August and close in early November, and you need three UK course choices and references.",
					source: "https://www.chevening.org/scholarships/",
				},
				{
					text: "Erasmus Mundus Joint Masters fund a master's studied at universities in at least three countries — full tuition, travel, and a monthly allowance — applied for directly with each consortium, typically between December and February deadlines.",
					source: "https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters",
				},
				{
					text: "South Korea's Global Korea Scholarship (GKS) covers flights, tuition, a monthly allowance, settlement, Korean language training, and insurance; Pakistan's embassy-track quota is small (eight graduate seats in the 2026 cycle), so the university track is a strong alternative.",
					source: "https://www.studyinkorea.go.kr/",
				},
				{
					text: "Ireland offers the Government of Ireland International Education Scholarships — a EUR 10,000 stipend plus a full tuition waiver for one year for high-calibre non-EU students — alongside the postgraduate Research Ireland programme (stipend around EUR 22,000 per year).",
					source: "https://hea.ie/policy/internationalisation/goi-ies/",
				},
			],
		},
		{
			id: "interviews",
			title: "Visa & Scholarship Interviews",
			facts: [
				{
					text: "US F-1 visa interviews are held at the US Embassy Islamabad: bring your signed Form I-20, financial documents, and ties-to-home evidence, and be ready to explain your study plan, who is funding you, and your reasons to return to Pakistan.",
					source: "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html",
				},
				{
					text: "Germany's visa interview at the German Embassy Islamabad is a document review built around your admission letter (Zulassungsbescheid), blocked account confirmation, and health insurance — have originals and copies organized by the checklist.",
					source: "https://pakistan.diplo.de",
				},
				{
					text: "Türkiye Bursları shortlisted candidates face an interview at the Turkish Embassy in Islamabad as the final scholarship stage, after applying online with up to twelve programme preferences.",
					source: "https://www.turkiyeburslari.gov.tr/",
				},
				{
					text: "GKS embassy-track applicants submit their file to the Korean Embassy in Islamabad and compete for Pakistan's small quota (eight graduate seats in the 2026 cycle); the university track bypasses this bottleneck by applying directly to Korean universities.",
					source: "https://www.studyinkorea.go.kr/",
				},
				{
					text: "For South Korea's D-2 visa, the Certificate of Admission (CoA) from the university is mandatory — pay the tuition deposit on time so it arrives before your visa filing, since processing is a quick 2-4 weeks.",
					source: "https://www.studyinkorea.go.kr/",
				},
			],
		},
		{
			id: "country-notes",
			title: "Country Notes — Quick Facts (2026)",
			facts: [
				{
					text: "Germany: public universities are tuition-free (semester fee only), the language is German, the D visa takes around 4-8 weeks, students may work 140 full days per year, and graduates get an 18-month job-seeker residence permit.",
					source: "https://www.make-it-in-germany.com",
				},
				{
					text: "Austria: non-EU students pay about EUR 726.72 per semester at public universities, German is the main language, part-time work is allowed up to 20 hours per week, and graduates have a 12-month Red-White-Red Card job-seeker route.",
					source: "https://oead.at/en",
				},
				{
					text: "Italy: public fees are income-based (roughly EUR 900-4,000 per year), Italian is needed for most undergraduate courses, proof of funds is around EUR 7,000 per year, and visa processing can stretch to 90 days in peak season.",
					source: "https://studyinitaly.esteri.it",
				},
				{
					text: "South Korea: national universities cost roughly KRW 4-8 million per year, Korean (TOPIK) is required for most programs, the D-2 visa processes in 2-4 weeks, and a D-10 job-seeker visa runs 6 months after graduation (extendable).",
					source: "https://www.studyinkorea.go.kr",
				},
				{
					text: "Turkey: public university tuition is typically under USD 1,500 per year, Turkish is needed for many programs, a student residence permit is required within 30 days of arrival, and graduates may extend a residence permit up to 12 months to seek work.",
					source: "https://www.studyinturkiye.gov.tr",
				},
				{
					text: "China: hosts the largest Pakistani student community abroad (an estimated 30,000-40,000), the consular visa fee is waived for Pakistani citizens, tuition runs RMB 15,000-45,000 per year self-funded, and X1 students generally cannot take paid work.",
					source: "https://www.campuschina.org",
				},
				{
					text: "Indonesia: international programs at top public universities cost around USD 2,000-6,000 per year, the university sponsors your visa (processing 2-4 weeks), and post-study work options are weak — a sponsored work permit (KITAS) is required to stay.",
					source: "https://kemlu.go.id",
				},
				{
					text: "USA: around 5,000-10,000 Pakistani students study there, tuition runs USD 22,000-60,000 per year, the F-1 visa needs an interview in Islamabad, on-campus work is capped at 20 hours per week, and STEM graduates get up to 36 months of OPT.",
					source: "https://educationusa.state.gov",
				},
				{
					text: "UK: one of the top destinations with an estimated 15,000-20,000 Pakistani students, one-year master's programs are standard, the Graduate Route gives 2 years of post-study work (3 for PhDs), and a TB test is required for Pakistani applicants.",
					source: "https://www.gov.uk/student-visa",
				},
				{
					text: "Ireland: English-medium education and a major tech hub (European headquarters of Google, Meta, Apple, and Microsoft), bachelor's tuition around EUR 10,000-25,000 per year, and the Stamp 1G programme allows 24 months of post-study work.",
					source: "https://www.irishimmigration.ie",
				},
				{
					text: "Lithuania: tuition around EUR 2,000-8,000 per year with among the cheapest living costs in the EU, proof of funds of only EUR 221 per month, 20 hours per week of work rights, and a 12-month post-graduation job-search permit.",
					source: "https://studyin.lt",
				},
				{
					text: "Netherlands: the largest range of English-taught programs in continental Europe, non-EU tuition around EUR 8,000-20,000 per year for bachelor's, work up to 16 hours per week, and a 12-month orientation year after graduation to find work.",
					source: "https://www.studyinnl.org",
				},
				{
					text: "Hungary: self-funded tuition around EUR 2,500-8,000 per year for bachelor's, Stipendium Hungaricum fully funds many Pakistani students, work rights up to 30 hours per week, and a 9-month job-seeker permit after graduation.",
					source: "https://studyinhungary.hu",
				},
			],
		},
		{
			id: "scams-safety",
			title: "Scams & Safety — Agents, Offers, and Fees",
			facts: [
				{
					text: "The biggest fully funded programs for Pakistanis — Fulbright (usefp.org), Chevening (chevening.org), and Türkiye Bursları (turkiyeburslari.gov.tr) — take free applications directly on their official websites; no agent is needed to file, and nobody can sell you a guaranteed seat in them.",
					source: "https://usefp.org/scholarships/fulbright-degree.cfm",
				},
				{
					text: "HEC-nominated scholarships (Commonwealth, Stipendium Hungaricum, CSC, Knowledge Corridor) require your own application on HEC's portal (scholarship.hec.gov.pk) — for Stipendium Hungaricum you must submit on both the Hungarian and HEC portals by the deadline, so an agent's promise to handle the HEC side deserves scrutiny.",
					source: "https://www.hec.gov.pk/site/scholarships",
				},
				{
					text: "Legitimate applications run through public national systems — UCAS for UK undergraduates, Universitaly (mandatory) for Italy, Studielink for the Netherlands, and uni-assist for many German public universities — so an admission offer that exists only in an email should be verified directly with the university.",
					source: "https://studyinitaly.esteri.it",
				},
				{
					text: "Check guaranteed-scholarship claims against the university's own policy — for example, Harvard College states it has no merit scholarships and awards aid solely on financial need (need-blind even for internationals), so anyone selling a guaranteed Harvard merit award is not credible.",
					source: "https://college.harvard.edu/financial-aid/how-aid-works",
				},
				{
					text: "Know the real fee levels before paying anyone: as of 2026 the UK student visa costs GBP 558 plus GBP 776 per year in health surcharge, the US F-1 around USD 535 including SEVIS, and Germany's D visa around PKR 24,300 — embassies publish these, so treat large mark-ups on visa packages as a red flag.",
					source: "https://www.gov.uk/student-visa",
				},
				{
					text: "EducationUSA (educationusa.state.gov) is the US State Department's official advising network offering free guidance on accredited US universities — a safer reference point than paid agents for US applications.",
					source: "https://educationusa.state.gov",
				},
			],
		},
		{
			id: "ivy-league",
			title: "Ivy League Admissions",
			facts: [
				{
					text: "The Ivy League is made up of eight private US universities — Harvard, Yale, Princeton, Columbia, Penn, Brown, Dartmouth, and Cornell — and our Ivy League page at /abroad/ivy-league walks you through all eight profiles, testing policies, and aid details.",
					source: "https://college.harvard.edu/admissions",
				},
				{
					text: "Need-blind vs need-aware matters a lot for internationals: Harvard, Yale, Princeton, Brown, and Dartmouth are need-blind (requesting aid does not hurt admission), while Columbia, Penn, and Cornell are need-aware for international applicants.",
					source: "https://college.harvard.edu/financial-aid/how-aid-works",
				},
				{
					text: "The need-blind Ivies meet 100% of demonstrated need with grants, not loans — Harvard charges families earning under $200,000 no tuition, and Brown extended need-blind admission to internationals starting with the Class of 2029.",
					source: "https://president.brown.edu/president/need-blind-admission-international-undergraduates",
				},
				{
					text: "Testing policies are a patchwork this cycle: Harvard, Yale, Penn, Brown, Dartmouth, and Cornell require SAT or ACT, while Princeton is test-optional for Fall 2026 and 2027 entry and Columbia through the 2026-2027 cycle — both plan to require tests again after that.",
					source: "https://admission.princeton.edu/apply/standardized-testing",
				},
				{
					text: "FAFSA is for US citizens and eligible non-citizens only, so Pakistani applicants file the CSS Profile instead to apply for need-based aid at the Ivies.",
					source: "https://cssprofile.collegeboard.org/international-applicants",
				},
				{
					text: "Cornell's aid page spells it out: international applicants file the CSS Profile, admission is need-aware for internationals, and admitted internationals get offers that meet 100% of demonstrated need through grants, work-study, and some loans.",
					source: "https://finaid.cornell.edu/first-year-and-transfer-students-international",
				},
				{
					text: "Acceptance rates stay brutally low — Class of 2029 rates run roughly 4-8% across the eight (Brown's Class of 2030 rate was 5.6%) — so build a balanced list with safeties.",
					source: "https://college.harvard.edu/admissions/admissions-statistics",
				},
				{
					text: "Application fees run about USD 75-95 per school (Harvard charges USD 95, Princeton and Penn USD 75), and every school accepts fee-waiver requests through the Common App when the fee is a financial hardship.",
					source: "https://college.harvard.edu/admissions/apply",
				},
				{
					text: "English test minimums vary by school: Yale wants TOEFL 100 / IELTS 7 / Duolingo 120, Columbia TOEFL 100 / IELTS 7.5 / Duolingo 135, Cornell IELTS 7.5 / Duolingo 120 — and Harvard requires no English test at all.",
					source: "https://undergrad.admissions.columbia.edu/apply/international/english-proficiency",
				},
				{
					text: "If application costs are a burden, USEFP's EducationUSA Opportunity Funds cover up-front costs like test and application fees for high-achieving Pakistani students likely to receive full financial aid from US universities.",
					source: "https://www.educationusa.pk/",
				},
			],
		},
	],
};
