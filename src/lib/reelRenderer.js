// Browser-side reel rendering: concatenates a reel's real clip files into one
// fast-paced, seamless video with an optional music track — entirely in the
// browser using MediaRecorder + canvas + Web Audio. No external service.

function pickMime() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  if (typeof MediaRecorder === "undefined") return "video/webm";
  for (const m of candidates) {
    try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (_e) {}
  }
  return "video/webm";
}

function makeVideo(src) {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.src = src;
    v.crossOrigin = "anonymous";
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.onloadedmetadata = () => resolve(v);
    v.onerror = () => reject(new Error("Could not load a clip for rendering."));
  });
}

// Render an ordered list of clips (must have clip_url) into one fast-paced,
// seamless video file with an optional music track mixed in.
//   clips      — ordered clip objects with clip_url
//   musicUrl   — optional audio file URL (object URL or remote) mixed into the video
//   musicVolume — 0..1 music gain (default 0.85)
//   maxClipSec  — cap each clip's on-screen time for a fast pace (default 3.5s; 0 = full)
//   zoom        — subtle Ken Burns zoom for energy (default true)
//   onProgress  — ({ clipIndex, clipTotal, clipProgress, overall })
// Returns { blob, duration, type }.
export async function renderReel({ clips, musicUrl, musicVolume = 0.85, maxClipSec = 3.5, zoom = true, fps = 30, onProgress }) {
  const usable = clips.filter((c) => !!c.clip_url);
  if (!usable.length)
    throw new Error("No downloadable clip files in this reel. Clips from links cannot be merged — extract real clip files first.");

  const first = await makeVideo(usable[0].clip_url);
  const W = first.videoWidth || 1280;
  const H = first.videoHeight || 720;
  first.removeAttribute("src");

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  const stream = canvas.captureStream(fps);

  // --- Music: route an audio track into the recorded stream via Web Audio ---
  let audioCtx, audioEl, gainNode, destNode;
  if (musicUrl) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") await audioCtx.resume();
      audioEl = new Audio(musicUrl);
      audioEl.crossOrigin = "anonymous";
      audioEl.loop = true;
      const srcNode = audioCtx.createMediaElementSource(audioEl);
      gainNode = audioCtx.createGain();
      gainNode.gain.value = musicVolume;
      destNode = audioCtx.createMediaStreamDestination();
      srcNode.connect(gainNode);
      gainNode.connect(destNode);
      gainNode.connect(audioCtx.destination); // audible while recording
      const audioTrack = destNode.stream.getAudioTracks()[0];
      if (audioTrack) stream.addTrack(audioTrack);
      await audioEl.play();
    } catch (_e) {
      // Music is optional — fall back to a silent (video-only) render.
      audioCtx = null; audioEl = null; gainNode = null; destNode = null;
    }
  }

  const mime = pickMime();
  let rec;
  try { rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 }); }
  catch (_e) { rec = new MediaRecorder(stream); }
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise((res) => { rec.onstop = res; });
  rec.start(100);

  let duration = 0;
  // Preload the first clip, then preload each next clip *while* the current one
  // plays — so the cut between clips is instant with no black gap.
  let current = await makeVideo(usable[0].clip_url);
  for (let i = 0; i < usable.length; i++) {
    const nextPromise = (i + 1 < usable.length) ? makeVideo(usable[i + 1].clip_url) : null;
    current.muted = true;
    const clipDur = current.duration || 0;
    const cap = maxClipSec && clipDur > maxClipSec ? maxClipSec : clipDur;
    duration += cap;
    await current.play();
    await new Promise((resolve) => {
      const draw = () => {
        const t = current.currentTime;
        if (t >= cap || current.ended) { resolve(); return; }
        const p = t / Math.max(0.1, cap);
        // Subtle Ken Burns zoom-in keeps the cut energetic.
        const s = zoom ? 1 + 0.10 * p : 1;
        const vw = current.videoWidth || W;
        const vh = current.videoHeight || H;
        const baseScale = Math.max(W / vw, H / vh);
        const scale = baseScale * s;
        const dw = vw * scale;
        const dh = vh * scale;
        try { ctx.drawImage(current, (W - dw) / 2, (H - dh) / 2, dw, dh); } catch (_e) {}
        if (onProgress) {
          onProgress({
            clipIndex: i,
            clipTotal: usable.length,
            clipProgress: p,
            overall: (i + p) / usable.length,
          });
        }
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    });
    try { current.pause(); } catch (_e) {}
    current.removeAttribute("src");
    current = nextPromise ? await nextPromise : null;
  }

  // Smooth music fade-out at the tail.
  if (gainNode && audioCtx) {
    try { gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime); gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5); } catch (_e) {}
  }
  if (audioEl) { setTimeout(() => { try { audioEl.pause(); } catch (_e) {} }, 600); }

  rec.stop();
  await stopped;
  if (audioCtx) { try { await audioCtx.close(); } catch (_e) {} }
  const type = (mime || "video/webm").split(";")[0];
  return { blob: new Blob(chunks, { type }), duration, type };
}