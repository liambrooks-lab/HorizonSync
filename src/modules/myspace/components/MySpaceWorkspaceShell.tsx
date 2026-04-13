"use client";

import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import type { SerializedWorkspaceFolder } from "@/modules/myspace/lib/documents";
import { MySpaceSidebar } from "@/modules/myspace/components/MySpaceSidebar";
import { Drawer } from "@/shared/components/ui/drawer";
import { Button } from "@/shared/components/ui/button";

type MySpaceWorkspaceShellProps = {
  children: ReactNode;
  folders: SerializedWorkspaceFolder[];
};

export function MySpaceWorkspaceShell({
  children,
  folders,
}: MySpaceWorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="panel-surface min-h-full overflow-hidden rounded-[30px] border border-[rgb(var(--border))] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--border))] px-4 py-4 lg:hidden">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted-foreground))]">
            My Space
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[rgb(var(--foreground))]">
            Documents
          </h2>
        </div>

        <Button onClick={() => setIsSidebarOpen(true)} size="icon" variant="secondary">
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex min-h-[calc(100vh-12.5rem)]">
        <MySpaceSidebar className="hidden lg:flex" folders={folders} />
        <div className="min-w-0 flex-1 p-3 sm:p-4">{children}</div>
      </div>

      <Drawer
        description="Browse folders, create notes, and jump across documents."
        onClose={() => setIsSidebarOpen(false)}
        open={isSidebarOpen}
        title="My Space"
        widthClassName="w-[min(92vw,380px)]"
      >
        <MySpaceSidebar
          className="w-full border-r-0"
          folders={folders}
          onNavigate={() => setIsSidebarOpen(false)}
        />
      </Drawer>
    </div>
  );
}
