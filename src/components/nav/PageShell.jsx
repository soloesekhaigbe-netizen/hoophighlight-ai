import SiteNav from "@/components/nav/SiteNav";

// Shared page shell: renders the site nav and pads content so it clears the
// vertical rail (md+) and the mobile top bar (<md).
export default function PageShell({ items, brandTo = "/", footer, actions, children, className = "" }) {
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <SiteNav items={items} brandTo={brandTo} footer={footer} actions={actions} />
      <main className={`pt-16 md:pt-0 md:pl-[76px] ${className}`}>
        {children}
      </main>
    </div>
  );
}