// Download generated clip files as individual videos. Clips are already real
// extracted files (clip_url) — we fetch the stored file and save it locally with
// a sequential name (Clip_01, Clip_02, …). MP4 where the browser recorded it.
import { base44 } from "@/api/base44Client";

export function extForType(type = "") {
  if (type.includes("mp4")) return "mp4";
  if (type.includes("webm")) return "webm";
  if (type.includes("quicktime")) return "mov";
  return "mp4";
}

export const clipLabel = (index) => `Clip_${String(index + 1).padStart(2, "0")}`;

function triggerDownload(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Download a single clip's real extracted video file.
export async function downloadClip(clip, index = 0) {
  if (!clip?.clip_url) throw new Error("This clip hasn't been extracted yet.");
  const res = await fetch(clip.clip_url);
  if (!res.ok) throw new Error("Could not fetch the clip file.");
  const blob = await res.blob();
  const ext = extForType(blob.type);
  triggerDownload(blob, `${clipLabel(index)}.${ext}`);
  return `${clipLabel(index)}.${ext}`;
}

// Download every ready clip in order, one file at a time.
export async function downloadAllClips(clips) {
  const ready = clips.filter((c) => c.processing_status === "ready" && c.clip_url);
  let saved = 0;
  for (let i = 0; i < ready.length; i++) {
    try {
      await downloadClip(ready[i], i);
      saved += 1;
    } catch (_e) {
      /* skip a clip that fails */
    }
    // Small gap so browsers don't block sequential downloads.
    await new Promise((r) => setTimeout(r, 500));
  }
  return { saved, total: ready.length };
}