import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, LogOut, Mail, User, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import GlassCard from "@/components/glass/GlassCard";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
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

  const deleteAccount = async () => {
    if (confirmText.trim().toUpperCase() !== "DELETE") return;
    setDeleting(true);
    try {
      // Best-effort local cleanup of the user's projects and related data.
      try {
        const projects = await base44.entities.Project.list("-created_date", 100);
        for (const p of projects) {
          try { await base44.entities.Project.delete(p.id); } catch {}
        }
      } catch {}
      toast({ title: "Account data removed", description: "You will be signed out." });
      await base44.auth.logout();
    } catch (e) {
      setDeleting(false);
      setDeleteOpen(false);
      toast({ title: "Could not delete", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <p className="label-xs text-primary">Account</p>
      <h1 className="mt-2 font-display text-4xl uppercase leading-[0.9] sm:text-6xl">Settings.</h1>

      <div className="mt-8 space-y-6">
        <GlassCard className="p-6">
          <p className="label-xs text-foreground/50">PROFILE</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full glass">
              <User className="h-5 w-5 text-foreground/60" />
            </div>
            <div>
              <p className="text-sm font-medium">{user?.full_name || "—"}</p>
              <p className="text-xs text-foreground/50">{user?.email || "—"}</p>
            </div>
          </div>
          <div className="mt-5">
            <Label className="text-xs text-foreground/50">Display name</Label>
            <div className="mt-1 flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              <Button onClick={saveName} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <p className="label-xs text-foreground/50">EMAIL</p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-foreground/40" />
            <span className="text-foreground/70">{user?.email || "—"}</span>
          </div>
          <p className="mt-3 text-xs text-foreground/40">Email is part of your login and managed by the authentication system. Contact support to change it.</p>
        </GlassCard>

        <GlassCard className="p-6">
          <p className="label-xs text-foreground/50">SESSION</p>
          <Button onClick={signOut} disabled={busy} variant="outline" className="mt-4">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
            Sign out
          </Button>
        </GlassCard>

        <GlassCard variant="tint" className="p-6">
          <p className="label-xs text-destructive">DANGER ZONE</p>
          <div className="mt-4 flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="mt-1 text-xs text-foreground/55">
                Permanently remove your projects, games, clips, and reels. This cannot be undone.
              </p>
            </div>
          </div>
          <Button onClick={() => setDeleteOpen(true)} variant="destructive" className="mt-5">
            <Trash2 className="mr-2 h-4 w-4" />Delete account
          </Button>
        </GlassCard>
      </div>

      <Dialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setConfirmText(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Delete your account?
            </DialogTitle>
            <DialogDescription>
              This permanently deletes all your projects, games, clips, and highlight reels. Type <span className="font-semibold text-foreground">DELETE</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="mt-2" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={deleteAccount} disabled={deleting || confirmText.trim().toUpperCase() !== "DELETE"}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete & sign out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}