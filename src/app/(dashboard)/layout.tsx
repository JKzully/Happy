import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="pl-[220px]">
        <div className="px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
