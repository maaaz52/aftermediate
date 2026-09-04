"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PakistanSalaryPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/career");
  }, [router]);
  return null;
}
