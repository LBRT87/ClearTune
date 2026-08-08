import { Suspense } from "react";
import { Sidebar } from "@/components/ui/Sidebar";
import { TopBar } from "@/components/ui/TopBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:flex md:min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0">
        {/* TopBar reads useSearchParams (for /home's filter state) — Next.js
            requires a Suspense boundary around that, even in a fully client
            component, or `next build` errors. */}
        <Suspense fallback={<div className="hidden md:block h-[84px] border-b-[3px] border-ink" />}>
          <TopBar />
        </Suspense>
        {children}
      </div>
    </div>
  );
}
