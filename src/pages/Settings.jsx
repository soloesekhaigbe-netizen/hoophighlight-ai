import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogOut, Mail, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    base44.auth.me()
      .then((me) => { setUser(me); setName(me?.full_name || ""); })
      .catch(() => {});
  }, []);

  const saveName = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ full_name: name });
      toast({ title: "Name updated" });
    } catch (e) {
      toast({ title: "Could not update", description: e?.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const signOut = async () => {
    setBusy(true);
    await base44.auth.logout();
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <p className="label-xs text-sun">Account</p>
      <h1 className="mt-2 font-display text-4xl uppercase leading-[0.9] sm:text-6xl">Settings.</h1>

      <div className="mt-8 space-y-6">
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
          <p className="label-xs text-paper/50">PROFILE</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <User className="h-5 w-5 text-paper/60" />
            </div>
            <div>
              <p className="text-sm font-medium">{user?.full_name || "—"}</p>
              <p className="text-xs text-paper/50">{user?.email || "—"}</p>
            </div>
          </div>
          <div className="mt-5">
            <Label className="text-xs text-paper/50">Display name</Label>
            <div className="mt-1 flex gap-2">
              <Input className="border-white/10 bg-white/5" value={name} onChange={(e) => setName(e.target.value)} />
              <Button onClick={saveName} disabled={saving} className="bg-orange-500 text-slate-950 hover:bg-orange-400">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
          <p className="label-xs text-paper/50">EMAIL</p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-paper/40" />
            <span className="text-paper/70">{user?.email || "—"}</span>
          </div>
          <p className="mt-3 text-xs text-paper/40">Email is part of your login and managed by the authentication system. Contact support to change it.</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
          <p className="label-xs text-paper/50">SESSION</p>
          <Button onClick={signOut} disabled={busy} variant="outline" className="mt-4 border-white/15 bg-transparent hover:bg-white/10">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}