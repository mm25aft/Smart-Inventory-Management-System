import { ChatDrawer } from "@/components/layout/chat-drawer";
import { Sidebar } from "@/components/layout/sidebar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-base text-primary">
      <Sidebar />
      <main className="min-h-screen flex-1 px-4 pb-24 md:px-6 lg:px-8">{children}</main>
      <ChatDrawer />
    </div>
  );
}
