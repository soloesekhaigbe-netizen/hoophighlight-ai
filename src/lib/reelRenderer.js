// Browser-side reel rendering: concatenates a reel's real clip files into one
// continuous video using the same MediaRecorder + canvas approach as clip
// extraction. Produces a single WebM that is uploaded and stored as the reel's
// video_url. No server rendering or API key required.

function pickMime() {
  const candidates = [
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

// Render an ordered list of clips (must have clip_url) into one video file.
// Calls onProgress({ clipIndex, clipTotal, clipProgress, overall }) in real
// time. Returns { blob, duration, type }.
export async function renderReel({ clips, fps = 24, onProgress }) {
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
  const mime = pickMime();
  let rec;
  try { rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5_000_000 }); }
  catch (_e) { rec = new MediaRecorder(stream); }
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise((res) => { rec.onstop = res; });
  rec.start(100);

  let duration = 0;
  for (let i = 0; i < usable.length; i++) {
    const v = await makeVideo(usable[i].clip_url);
    v.muted = true;
    duration += v.duration || 0;
    await v.play();
    await new Promise((resolve) => {
      const draw = () => {
        if (v.ended) { resolve(); return; }
        const vw = v.videoWidth || W;
        const vh = v.videoHeight || H;
        const scale = Math.max(W / vw, H / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        try { ctx.drawImage(v, (W - dw) / 2, (H - dh) / 2, dw, dh); } catch (_e) {}
        if (onProgress) {
          onProgress({
            clipIndex: i,
            clipTotal: usable.length,
            clipProgress: v.currentTime / Math.max(0.1, v.duration || 1),
            overall: (i + v.currentTime / Math.max(0.1, v.duration || 1)) / usable.length,
          });
        }
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    });
    v.removeAttribute("src");
  }

  rec.stop();
  await stopped;
  const type = (mime || "video/webm").split(";")[0];
  return { blob: new Blob(chunks, { type }), duration, type };
}