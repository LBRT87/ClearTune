import { Sidebar } from "@/components/ui/Sidebar";
import { TopBar } from "@/components/ui/TopBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:flex md:min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar />
        {children}
      </div>
    </div>
  );
}
