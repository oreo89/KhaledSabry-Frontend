"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminSession } from "@/lib/storage";
import { DataLoader } from "./DataLoader";

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (getAdminSession()) {
      setAllowed(true);
      return;
    }

    const next = `${window.location.pathname}${window.location.search}`;
    router.replace(`/admin?next=${encodeURIComponent(next)}`);
  }, [router]);

  if (!allowed) {
    return (
      <main className="section-padding">
        <div className="container-xl">
          <DataLoader label="Checking sign in" />
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
