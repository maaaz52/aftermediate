import type { ResumeData } from "@/lib/resume-model";

export const mockResume: ResumeData = {
  identity: {
    name: "Hira Ahmed",
    email: "hira.ahmed@example.com",
    phone: "+92-300-1234567",
    location: "Lahore, Pakistan",
    github: "https://github.com/hira-ahmed",
    linkedin: "https://linkedin.com/in/hira-ahmed",
    targetRole: "Pre-Med Research Intern",
  },
  experience: {
    rawNotes:
      "organised school sports day for 200 students, edited 15 videos for my YouTube channel, got 88% in FSc Physics lab",
    bullets: [
      "Coordinated logistics for school sports day, managing 200+ participants.",
      "Produced and edited 15 videos for my YouTube channel.",
      "Achieved 88% in FSc Physics lab.",
    ],
    polished: true,
  },
  projects: {
    entries: [
      {
        title: "Science Exhibition Project",
        org: "Kinnaird College",
        year: "2025",
        description:
          "Investigated the effect of pH on seed germination for school science exhibition.",
      },
      {
        title: "YouTube Channel",
        org: "Self",
        year: "2024",
        description:
          "Created educational content about pre-med topics and study tips.",
      },
    ],
    academics: [
      {
        degree: "FSc Pre-Medical",
        institution: "Kinnaird College",
        score: "88%",
        years: "2024-2026",
      },
    ],
    certificates: [
      "Coursera Introduction to Biology",
      "Digital Skills: Video Editing",
    ],
    leadership: ["House Captain, Science Society"],
  },
  skills: {
    tech: ["Microsoft Office", "Canva", "Basic Video Editing"],
    soft: ["Communication", "Time Management"],
  },
};