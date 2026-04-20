import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { LayoutHeader } from "@/components/layout/LayoutHeader";
import { DataCacheWrapper } from "@/lib/data-cache/DataCacheWrapper";
import { NavigationProvider } from "@/lib/navigation/context";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DataCacheWrapper>
    <NavigationProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        <LayoutHeader />
        <div className="relative flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex flex-col flex-1 overflow-y-auto min-w-0 pl-0 lg:pl-14">
            {children}
          </main>
        </div>
      </div>
    </NavigationProvider>
    </DataCacheWrapper>
  );
}
