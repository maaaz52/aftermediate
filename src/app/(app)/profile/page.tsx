"use client";

import Link from "next/link";
import * as React from "react";
import {
  GraduationCap,
  Wallet,
  Scale,
  CheckCircle2,
  Pencil,
  X,
  Plus,
  Trash2,
  Shuffle,
  Star,
  Heart,
  Briefcase,
  Save,
  BadgeCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudent, type EducationEntry } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { isQuizComplete } from "@/lib/quiz";
import { cn } from "@/lib/utils";
import { AVATAR_STYLES, type AvatarStyleId } from "@/lib/avatar";
import { Avatar } from "@/components/avatar";

const streamLabel: Record<string, string> = {
  "pre-medical": "FSc Pre-Medical",
  "pre-engineering": "FSc Pre-Engineering",
  ics: "ICS",
  icom: "I.Com",
  alevel: "A-Levels",
};

const entryTestLabel: Record<string, string> = {
  net: "NUST NET",
  mdcat: "MDCAT",
  ecat: "UET ECAT",
  none: "Not taken yet",
};

const parentsExpectLabel: Record<string, string> = {
  doctor: "Doctor",
  engineer: "Engineer",
  "civil-service": "CSS / civil service",
  business: "Business / family business",
  "my-choice": "Whatever I choose",
  unsure: "Not sure",
};

const decisionMakerLabel: Record<string, string> = {
  me: "Me",
  parents: "My parents",
  together: "We decide together",
};

const relocateLabel: Record<string, string> = {
  yes: "Yes, anywhere",
  "in-province": "Only within my province",
  no: "No, I need to stay home",
};

const scholarshipLabel: Record<string, string> = {
  must: "Yes — I can't go without one",
  helpful: "It would help a lot",
  no: "No",
};

const SKILL_CHOICES = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
  "Programming", "Web Development", "Mobile Apps", "Data Analysis", "AI & ML",
  "Graphic Design", "Video Editing", "Photography", "Public Speaking",
  "Creative Writing", "Essay Writing", "Debate", "Leadership", "Teamwork",
  "Project Management", "Entrepreneurship", "Marketing", "Accounting",
  "Financial Literacy", "Research", "Problem Solving", "Critical Thinking",
  "English Fluency", "Urdu Writing", "Presentation", "Typing / Fast Keyboard",
  "Excel / Sheets", "Canva", "Figma", "Git & GitHub", "Networking",
  "Robotics", "3D Modeling", "Calligraphy", "Quranic Studies",
];

const INTEREST_CHOICES = [
  "Medicine & Healthcare", "Technology & Coding", "Engineering & Machines",
  "Business & Finance", "Design & Creativity", "Data & Numbers",
  "Writing & Communication", "Teaching & Mentoring", "Research & Science",
  "Helping People", "Building Things", "Leadership",
];

export default function ProfilePage() {
  const { profile, update } = useStudent();
  const { user } = useAuth();
  const complete = isQuizComplete(profile);
  const q = profile.quiz;

  const [editing, setEditing] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Record<string, string>>({});
  const [avatarOpen, setAvatarOpen] = React.useState(false);
  const avatarRef = React.useRef<HTMLDivElement>(null);

  const [saveNotice, setSaveNotice] = React.useState<string | null>(null);
  const noticeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [skillQuery, setSkillQuery] = React.useState("");
  const [editingEdu, setEditingEdu] = React.useState<string | null>(null);
  const [eduDraft, setEduDraft] = React.useState<Partial<EducationEntry>>({});

  function flash(msg: string) {
    setSaveNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setSaveNotice(null), 2000);
  }

  React.useEffect(() => {
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  React.useEffect(() => {
    if (!avatarOpen) return;
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [avatarOpen]);

  const fscPct =
    profile.marks.fscTotal > 0
      ? Math.round((profile.marks.fscObtained / profile.marks.fscTotal) * 100)
      : 0;

  function beginEdit(section: string) {
    setEditing(section);
    setDraft({});
    setFormError(null);
  }

  function setField(key: string, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function patchQuiz(patches: Record<string, unknown>) {
    update({ quiz: { ...profile.quiz, ...patches } });
  }

  function patchMarks(patches: Record<string, unknown>) {
    update({ marks: { ...profile.marks, ...patches } });
  }

  function selectAvatarStyle(styleId: AvatarStyleId) {
    const seed = profile.avatarSeed || profile.name || user?.user_metadata?.full_name || "student";
    update({ avatarStyle: styleId, avatarSeed: seed });
    flash("Avatar updated");
  }

  function randomizeSeed() {
    const seed = Math.random().toString(36).slice(2, 10);
    update({ avatarSeed: seed });
    flash("Avatar updated");
  }

  function saveBasic() {
    update({
      name: draft.name ?? profile.name,
      bio: draft.bio ?? profile.bio,
    });
    setEditing(null);
    flash("Saved");
  }

  function saveAcademics() {
    if (draft.stream) update({ stream: draft.stream as never });
    if (draft.board) patchQuiz({ board: draft.board });
    if (draft.examYear) patchQuiz({ examYear: Number(draft.examYear) });
    if (draft.entryTest) patchQuiz({ entryTest: draft.entryTest as never });

    const matricO = draft.matricO != null && draft.matricO !== "" ? Number(draft.matricO) : profile.marks.matricObtained;
    const matricT = draft.matricT != null && draft.matricT !== "" ? Number(draft.matricT) : profile.marks.matricTotal;
    const fscO = draft.fscO != null && draft.fscO !== "" ? Number(draft.fscO) : profile.marks.fscObtained;
    const fscT = draft.fscT != null && draft.fscT !== "" ? Number(draft.fscT) : profile.marks.fscTotal;
    const entryScore = draft.entryScore != null && draft.entryScore !== "" ? Number(draft.entryScore) : null;

    const bad = (label: string, o: number, t: number) => {
      if (Number.isNaN(o) || Number.isNaN(t) || o < 0 || t <= 0 || o > t) {
        setFormError(`${label}: obtained must be between 0 and total.`);
        return true;
      }
      return false;
    };
    if (bad("Matric", matricO, matricT) || bad("FSc", fscO, fscT)) return;
    if (entryScore !== null && (Number.isNaN(entryScore) || entryScore < 0)) {
      setFormError("Entry test score must be 0 or more.");
      return;
    }

    patchMarks({
      matricObtained: matricO,
      matricTotal: matricT,
      fscObtained: fscO,
      fscTotal: fscT,
      ...(entryScore !== null ? { entryTestObtained: entryScore } : {}),
    });
    setFormError(null);
    setEditing(null);
    flash("Saved");
  }

  function saveMoney() {
    if (draft.city) patchQuiz({ city: draft.city });
    if (draft.province) patchQuiz({ province: draft.province });
    if (draft.budget != null && draft.budget !== "") patchQuiz({ budgetMonthly: Number(draft.budget) });
    if (draft.canRelocate) patchQuiz({ canRelocate: draft.canRelocate as never });
    if (draft.needsScholarship) patchQuiz({ needsScholarship: draft.needsScholarship as never });
    setEditing(null);
    flash("Saved");
  }

  function saveDecisions() {
    if (draft.dreamField) patchQuiz({ dreamField: draft.dreamField });
    if (draft.parentsExpect) patchQuiz({ parentsExpect: draft.parentsExpect as never });
    if (draft.decisionMaker) patchQuiz({ decisionMaker: draft.decisionMaker as never });
    if (draft.parentsFirmness != null && draft.parentsFirmness !== "")
      patchQuiz({ parentsFirmness: Number(draft.parentsFirmness) });
    setEditing(null);
    flash("Saved");
  }

  function toggleSkill(skill: string) {
    const has = profile.skills.includes(skill);
    update({ skills: has ? profile.skills.filter((s) => s !== skill) : [...profile.skills, skill] });
  }

  function toggleInterest(interest: string) {
    const has = profile.interests.includes(interest);
    update({ interests: has ? profile.interests.filter((i) => i !== interest) : [...profile.interests, interest] });
  }

  function addEducation() {
    const entry: EducationEntry = {
      id: `e${Date.now()}`,
      degree: "",
      institution: "",
      year: "",
      grade: "",
    };
    update({ education: [...profile.education, entry] });
    setEditingEdu(entry.id);
    setEduDraft(entry);
  }

  function beginEduEdit(id: string) {
    const entry = profile.education.find((e) => e.id === id);
    if (!entry) return;
    setEditingEdu(id);
    setEduDraft(entry);
  }

  function saveEdu(id: string) {
    update({
      education: profile.education.map((e) =>
        e.id === id ? { ...e, ...eduDraft, degree: eduDraft.degree?.trim() || e.degree, institution: eduDraft.institution?.trim() || e.institution } : e
      ),
    });
    setEditingEdu(null);
    setEduDraft({});
    flash("Saved");
  }

  function cancelEdu() {
    // Drop an entry that was added but never filled in.
    const target = profile.education.find((e) => e.id === editingEdu);
    if (target && !target.degree && !target.institution && !target.year && !target.grade) {
      removeEducation(editingEdu!);
    }
    setEditingEdu(null);
    setEduDraft({});
  }

  function patchEducation(id: string, patch: Partial<EducationEntry>) {
    setEduDraft((d) => ({ ...d, ...patch }));
  }

  function removeEducation(id: string) {
    update({ education: profile.education.filter((e) => e.id !== id) });
    if (editingEdu === id) {
      setEditingEdu(null);
      setEduDraft({});
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* ===== Hero ===== */}
      <div className="relative rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-saffron/10 blur-2xl" />
          <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-emerald/10 blur-2xl" />
        </div>

        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="group relative" ref={avatarRef}>
            <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-3xl border-2 border-ink bg-surface-2 shadow-[4px_4px_0_0_var(--color-ink)]">
              <Avatar
                styleId={profile.avatarStyle}
                seed={profile.avatarSeed || profile.name || user?.user_metadata?.full_name || "student"}
              />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAvatarOpen((o) => !o);
              }}
              className="absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-xl border-2 border-ink bg-saffron text-background shadow-[2px_2px_0_0_var(--color-ink)] transition-transform hover:scale-105"
              aria-label="Change avatar"
            >
              <Shuffle className="h-4 w-4" />
            </button>
            {avatarOpen && (
              <div className="absolute left-1/2 top-full z-20 mt-3 w-72 -translate-x-1/2 rounded-2xl border border-line bg-surface p-3 shadow-lg animate-rise" onClick={(e) => e.stopPropagation()}>
                <p className="mb-2 text-xs font-medium text-muted">Choose a style</p>
                <div className="grid grid-cols-5 gap-2">
                  {AVATAR_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => {
                        selectAvatarStyle(style.id);
                        setAvatarOpen(false);
                      }}
                      className={cn(
                        "grid h-10 w-10 place-items-center overflow-hidden rounded-lg border-2 transition-all hover:scale-105",
                        profile.avatarStyle === style.id
                          ? "border-saffron bg-saffron/10"
                          : "border-line bg-surface-2 hover:border-saffron/50"
                      )}
                      title={style.label}
                    >
                      <div className="flex h-full w-full items-center justify-center [&>svg]:h-full [&>svg]:w-full">
                        <Avatar styleId={style.id} seed={profile.avatarSeed || "preview"} />
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={randomizeSeed}
                  className="mt-2 w-full rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2"
                >
                  <Shuffle className="mr-1.5 inline h-3.5 w-3.5" /> Randomize
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {profile.stream && (
                <Badge variant="saffron">{streamLabel[profile.stream]}</Badge>
              )}
              {complete ? (
                <Badge variant="emerald" className="gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Quiz complete
                </Badge>
              ) : (
                <>
                  <Badge variant="danger">Quiz incomplete</Badge>
                  <Link
                    href="/onboard"
                    className="rounded-lg bg-violet px-3 py-1.5 text-xs font-extrabold text-white shadow-[0_3px_0_#5b3fb8] transition-colors hover:brightness-110"
                  >
                    Continue quiz →
                  </Link>
                </>
              )}
            </div>

            {editing === "basic" ? (
              <div className="mt-3 space-y-2">
                <Input value={draft.name ?? profile.name} onChange={(e) => setField("name", e.target.value)} placeholder="Your name" />
                <textarea
                  value={draft.bio ?? profile.bio}
                  onChange={(e) => setField("bio", e.target.value)}
                  placeholder="Short bio — e.g. 'Pre-med dreamer, Manga reader, loves chemistry'"
                  className="min-h-[80px] w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-saffron/50"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveBasic}>
                    <Save className="h-3.5 w-3.5" /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                  {profile.name || user?.user_metadata?.full_name || "Your profile"}
                  <span className="ml-2 inline-flex cursor-pointer align-middle text-muted transition-colors hover:text-saffron">
                    <button onClick={() => beginEdit("basic")} aria-label="Edit name and bio">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </span>
                </h1>
                {profile.bio ? (
                  <p className="mt-1 text-sm text-muted">{profile.bio}</p>
                ) : (
                  <button onClick={() => beginEdit("basic")} className="mt-1 text-sm text-faint italic hover:text-saffron">
                    + Add a short bio
                  </button>
                )}
              </>
            )}

            {user?.email && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-faint sm:justify-start">
                <BadgeCheck className="h-3.5 w-3.5" /> {user.email}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Link href="/onboard" className="text-sm text-saffron hover:underline">
                Edit quiz →
              </Link>
            </div>
          </div>

          {/* Stat chips */}
          <div className="flex shrink-0 gap-3">
            <div className="text-center">
              <p className="font-mono text-3xl font-bold text-saffron">{fscPct}%</p>
              <p className="text-[10px] uppercase tracking-widest text-faint">FSc</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-3xl font-bold text-emerald">{profile.skills.length}</p>
              <p className="text-[10px] uppercase tracking-widest text-faint">Skills</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-3xl font-bold text-violet">{profile.interests.length}</p>
              <p className="text-[10px] uppercase tracking-widest text-faint">Interests</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Academics ===== */}
      <SectionCard
        icon={<GraduationCap className="h-4 w-4 text-saffron" />}
        title="Academics"
        editing={editing === "academics"}
        onEdit={() => beginEdit("academics")}
        onCancel={() => setEditing(null)}
        onSave={saveAcademics}
      >
        {editing === "academics" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Picker
              label="Stream"
              options={streamLabel}
              value={draft.stream ?? profile.stream ?? ""}
              onChange={(v) => setField("stream", v)}
            />
            <Field label="Board" value={draft.board ?? q.board ?? ""} onChange={(v) => setField("board", v)} />
            <Field label="Exam year" value={draft.examYear ?? (q.examYear ? String(q.examYear) : "")} onChange={(v) => setField("examYear", v)} placeholder="2026" />
            <Picker
              label="Entry test"
              options={entryTestLabel}
              value={draft.entryTest ?? q.entryTest ?? ""}
              onChange={(v) => setField("entryTest", v)}
            />
            <Field label="Matric obtained" value={draft.matricO ?? (profile.marks.matricObtained ? String(profile.marks.matricObtained) : "")} onChange={(v) => setField("matricO", v)} />
            <Field label="Matric total" value={draft.matricT ?? (profile.marks.matricTotal ? String(profile.marks.matricTotal) : "")} onChange={(v) => setField("matricT", v)} />
            <Field label="FSc obtained" value={draft.fscO ?? (profile.marks.fscObtained ? String(profile.marks.fscObtained) : "")} onChange={(v) => setField("fscO", v)} />
            <Field label="FSc total" value={draft.fscT ?? (profile.marks.fscTotal ? String(profile.marks.fscTotal) : "")} onChange={(v) => setField("fscT", v)} />
            {q.entryTest && q.entryTest !== "none" && (
              <Field label="Entry test score" value={draft.entryScore ?? (profile.marks.entryTestObtained != null ? String(profile.marks.entryTestObtained) : "")} onChange={(v) => setField("entryScore", v)} />
            )}
            {formError && (
              <p className="col-span-full rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
                {formError}
              </p>
            )}
          </div>
        ) : (
          <RowGrid
            rows={[
              ["Stream", profile.stream ? streamLabel[profile.stream] : "—"],
              ["Board", q.board || "—"],
              ["Exam year", q.examYear ? String(q.examYear) : "—"],
              ["Matric", profile.marks.matricObtained ? `${profile.marks.matricObtained}/${profile.marks.matricTotal}` : "—"],
              ["FSc", profile.marks.fscObtained ? `${profile.marks.fscObtained}/${profile.marks.fscTotal}` : "—"],
              ["Entry test", q.entryTest ? entryTestLabel[q.entryTest] : "—"],
              ...(profile.marks.entryTestObtained != null
                ? ([["Test score", `${profile.marks.entryTestObtained}/${profile.marks.entryTestTotal ?? 200}`]] as [string, string][])
                : []),
            ]}
          />
        )}
      </SectionCard>

      {/* ===== Education ===== */}
      <SectionCard
        icon={<GraduationCap className="h-4 w-4 text-info" />}
        title="Education"
        action={
          <Button size="sm" variant="outline" onClick={addEducation}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        }
      >
        {profile.education.length === 0 ? (
          <p className="py-6 text-center text-sm text-faint italic">
            No education added yet — tap &quot;Add&quot; to log your school, college, or academy.
          </p>
        ) : (
          <div className="space-y-3">
            {profile.education.map((e) =>
              editingEdu === e.id ? (
                <div key={e.id} className="rounded-xl border border-line bg-surface-2/40 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Input value={eduDraft.degree ?? e.degree} onChange={(ev) => patchEducation(e.id, { degree: ev.target.value })} className="h-9 w-full text-sm sm:w-48" placeholder="Degree" />
                    <Input value={eduDraft.institution ?? e.institution} onChange={(ev) => patchEducation(e.id, { institution: ev.target.value })} className="h-9 w-full text-sm sm:w-48" placeholder="Institution" />
                    <Input value={eduDraft.year ?? e.year} onChange={(ev) => patchEducation(e.id, { year: ev.target.value })} className="h-9 w-full text-sm sm:w-24" placeholder="Year" />
                    <Input value={eduDraft.grade ?? e.grade} onChange={(ev) => patchEducation(e.id, { grade: ev.target.value })} className="h-9 w-full text-sm sm:w-24" placeholder="Grade" />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => saveEdu(e.id)}>
                      <Save className="h-3.5 w-3.5" /> Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdu}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div key={e.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/40 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {e.degree || "Untitled degree"}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {[e.institution, e.year, e.grade].filter(Boolean).join(" · ") || "No details yet"}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => beginEduEdit(e.id)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="h-9 w-9 shrink-0 p-0 text-danger" onClick={() => removeEducation(e.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            )}
          </div>
        )}
      </SectionCard>

      {/* ===== Skills ===== */}
      <SectionCard
        icon={<Briefcase className="h-4 w-4 text-emerald" />}
        title="Skills"
        subtitle="Pick everything you can do — or want to learn."
      >
        <Input
          value={skillQuery}
          onChange={(e) => setSkillQuery(e.target.value)}
          placeholder="Search skills…"
          className="mb-3 max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {SKILL_CHOICES.filter((s) =>
            s.toLowerCase().includes(skillQuery.trim().toLowerCase())
          ).map((s) => {
            const has = profile.skills.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleSkill(s)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                  has
                    ? "border-emerald/40 bg-emerald/10 text-emerald"
                    : "border-line bg-surface-2 text-muted hover:border-emerald/30 hover:text-ink"
                )}
              >
                {has && <CheckCircle2 className="h-3.5 w-3.5" />}
                {s}
              </button>
            );
          })}
        </div>
        {skillQuery.trim() &&
          SKILL_CHOICES.filter((s) =>
            s.toLowerCase().includes(skillQuery.trim().toLowerCase())
          ).length === 0 && (
            <p className="mt-3 text-sm text-faint">No skills match “{skillQuery}”.</p>
          )}
        {profile.skills.length > 0 && (
          <p className="mt-3 font-mono text-xs text-muted">
            {profile.skills.length} selected
          </p>
        )}
      </SectionCard>

      {/* ===== Interests ===== */}
      <SectionCard
        icon={<Heart className="h-4 w-4 text-danger" />}
        title="Interests"
        subtitle="What pulls you — used to recommend fields."
      >
        <div className="flex flex-wrap gap-2">
          {INTEREST_CHOICES.map((i) => {
            const has = profile.interests.includes(i);
            return (
              <button
                key={i}
                onClick={() => toggleInterest(i)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                  has
                    ? "border-violet/40 bg-violet/10 text-violet"
                    : "border-line bg-surface-2 text-muted hover:border-violet/30 hover:text-ink"
                )}
              >
                {has && <CheckCircle2 className="h-3.5 w-3.5" />}
                {i}
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* ===== Money & location ===== */}
      <SectionCard
        icon={<Wallet className="h-4 w-4 text-amber" />}
        title="Money & location"
        editing={editing === "money"}
        onEdit={() => beginEdit("money")}
        onCancel={() => setEditing(null)}
        onSave={saveMoney}
      >
        {editing === "money" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="City" value={draft.city ?? q.city ?? ""} onChange={(v) => setField("city", v)} />
            <Field label="Province" value={draft.province ?? q.province ?? ""} onChange={(v) => setField("province", v)} />
            <Field label="Monthly budget (PKR)" value={draft.budget ?? (q.budgetMonthly != null ? String(q.budgetMonthly) : "")} onChange={(v) => setField("budget", v)} />
            <Picker
              label="Can relocate"
              options={relocateLabel}
              value={draft.canRelocate ?? q.canRelocate ?? ""}
              onChange={(v) => setField("canRelocate", v)}
            />
            <Picker
              label="Need scholarship"
              options={scholarshipLabel}
              value={draft.needsScholarship ?? q.needsScholarship ?? ""}
              onChange={(v) => setField("needsScholarship", v)}
            />
          </div>
        ) : (
          <RowGrid
            rows={[
              ["City", q.city || "—"],
              ["Province", q.province || "—"],
              ["Monthly budget", q.budgetMonthly ? `PKR ${q.budgetMonthly.toLocaleString()}` : "—"],
              ["Can relocate", q.canRelocate ? relocateLabel[q.canRelocate] : "—"],
              ["Need scholarship", q.needsScholarship ? scholarshipLabel[q.needsScholarship] : "—"],
            ]}
          />
        )}
      </SectionCard>

      {/* ===== Decisions & pressure ===== */}
      <SectionCard
        icon={<Scale className="h-4 w-4 text-violet" />}
        title="Decisions & pressure"
        editing={editing === "decisions"}
        onEdit={() => beginEdit("decisions")}
        onCancel={() => setEditing(null)}
        onSave={saveDecisions}
      >
        {editing === "decisions" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Dream field" value={draft.dreamField ?? q.dreamField ?? ""} onChange={(v) => setField("dreamField", v)} />
            <Picker
              label="Parents expect"
              options={parentsExpectLabel}
              value={draft.parentsExpect ?? q.parentsExpect ?? ""}
              onChange={(v) => setField("parentsExpect", v)}
            />
            <Picker
              label="Who decides"
              options={decisionMakerLabel}
              value={draft.decisionMaker ?? q.decisionMaker ?? ""}
              onChange={(v) => setField("decisionMaker", v)}
            />
            <Field label="Parents firmness (1-5)" value={draft.parentsFirmness ?? (q.parentsFirmness ? String(q.parentsFirmness) : "")} onChange={(v) => setField("parentsFirmness", v)} />
          </div>
        ) : (
          <RowGrid
            rows={[
              ["Dream field", q.dreamField || "—"],
              ["Parents expect", q.parentsExpect ? parentsExpectLabel[q.parentsExpect] : "—"],
              ["Who decides", q.decisionMaker ? decisionMakerLabel[q.decisionMaker] : "—"],
              ["Parents firmness", q.parentsFirmness ? `${q.parentsFirmness}/5` : "—"],
            ]}
          />
        )}
      </SectionCard>

      {saveNotice && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-rise rounded-full bg-ink px-4 py-2 text-sm font-medium text-background shadow-lg">
          ✓ {saveNotice}
        </div>
      )}
    </div>
  );
}

/* ===== Reusable bits ===== */

function SectionCard({
  icon,
  title,
  subtitle,
  action,
  children,
  editing,
  onEdit,
  onSave,
  onCancel,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  editing?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}) {
  return (
    <Card className="mt-6 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2">
            {icon}
          </div>
          <div>
            <h2 className="font-bold text-ink">{title}</h2>
            {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {action}
          {editing ? (
            <>
              <Button size="sm" onClick={onSave}>
                <Save className="h-3.5 w-3.5" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancel}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            onEdit && (
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )
          )}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function RowGrid({ rows }: { rows: [string, string][] }) {
  return (
    <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 border-b border-line/60 pb-2 text-sm">
          <dt className="flex items-center gap-1.5 text-muted">
            <Star className="h-3 w-3 text-faint" />
            {label}
          </dt>
          <dd className="text-right font-medium text-ink">{value}</dd>
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function Picker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Record<string, string>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(options).map(([val, display]) => (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              value === val
                ? "border-saffron bg-saffron/10 text-saffron"
                : "border-line bg-surface-2 text-muted hover:border-saffron/30 hover:text-ink"
            )}
          >
            {display}
          </button>
        ))}
      </div>
    </div>
  );
}