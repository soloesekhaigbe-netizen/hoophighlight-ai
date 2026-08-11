import SiteNav from "@/components/nav/SiteNav";
import AmbientBackground from "@/components/glass/AmbientBackground";

// Shared page shell: ambient glass background + floating nav + content padding
// that clears the floating dock (md+) and the mobile top bar (<md).
export default function PageShell({ items, brandTo = "/", footer, actions, children, className = "" }) {
  return (
    <div className="relative min-h-screen font-body text-foreground">
      <AmbientBackground />
      <SiteNav items={items} brandTo={brandTo} footer={footer} actions={actions} />
      <main className={`pt-20 pb-24 md:pb-6 md:pt-6 md:pl-[92px] ${className}`}>
        {children}
      </main>
    </div>
  );
}