import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageShell from "@/components/nav/PageShell";
import { LayoutDashboard, User, Film, BarChart3, CalendarDays, Inbox, Share2, LogOut, Activity } from "lucide-react";

export default function Layout() {
  const [items, setItems] = useState([
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]);
  const [actions, setActions] = useState([]);

  useEffect(() => {
    (async () => {
      let role = "user";
      try { role = (await base44.auth.me())?.role || "user"; } catch { /* public */ }
      let projectId = null;
      try {
        const projects = await base44.entities.Project.filter({}, "-created_date", 1);
        projectId = projects?.[0]?.id;
      } catch { /* ignore */ }

      const nav = [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        ...(projectId ? [
          { to: `/project/${projectId}?tab=overview`, label: "Profile", icon: User },
          { to: `/project/${projectId}?tab=clips`, label: "Highlights", icon: Film },
          { to: `/project/${projectId}?tab=games`, label: "Games", icon: CalendarDays },
          { to: `/project/${projectId}?tab=analytics`, label: "Statistics", icon: BarChart3 },
          { to: `/project/${projectId}?tab=portfolio`, label: "Portfolio", icon: Share2 },
          { to: `/project/${projectId}?tab=inquiries`, label: "Inquiries", icon: Inbox },
        ] : []),
        ...(role === "admin" ? [{ to: "/system-health", label: "System Health", icon: Activity }] : []),
      ];
      setItems(nav);
      setActions([{ label: "Sign out", icon: LogOut, onClick: () => base44.auth.logout() }]);
    })();
  }, []);

  return (
    <PageShell items={items} brandTo="/dashboard" footer="Be the next player." actions={actions}>
      <Outlet />
    </PageShell>
  );
}