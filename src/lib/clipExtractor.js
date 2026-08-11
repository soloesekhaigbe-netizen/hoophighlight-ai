// Browser-side real clip extraction. The Base44 backend cannot run FFmpeg, so we
// extract actual video segment files in the player's browser: load the uploaded
// source, seek to the segment, record the frames on a canvas stream with
// MediaRecorder, and produce a genuine WebM/MP4 file that is uploaded to Base44
// storage and stored as the clip's real clip_url. No fake URLs, no redirects.

function pickMime() {
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  if (typeof MediaRecorder === "undefined") return "video/webm";
  for (const m of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch (_e) {}
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
    v.onerror = () => reject(new Error("Could not load the source video for extraction."));
  });
}

function seekTo(v, t) {
  return new Promise((resolve) => {
    const done = () => { v.removeEventListener("seeked", done); resolve(); };
    v.addEventListener("seeked", done);
    try { v.currentTime = Math.max(0, t); } catch (_e) { resolve(); }
  });
}

// Grab a single frame as a canvas at the given timestamp (used for thumbnails and
// player-calibration candidate frames).
export async function grabFrame(sourceUrl, atSeconds) {
  const v = await makeVideo(sourceUrl);
  await seekTo(v, Math.max(0, atSeconds));
  const canvas = document.createElement("canvas");
  canvas.width = v.videoWidth || 640;
  canvas.height = v.videoHeight || 360;
  canvas.getContext("2d").drawImage(v, 0, 0, canvas.width, canvas.height);
  v.removeAttribute("src");
  return { canvas };
}

export function canvasToBlob(canvas, type = "image/jpeg", quality = 0.8) {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

// Extract a real video segment [start, end] from the source. Returns { blob,
// duration, type }. Calls onProgress(0..1) as it records in real time.
export async function extractClipFile({ sourceUrl, start, end, fps = 24, onProgress }) {
  const v = await makeVideo(sourceUrl);
  const dur = v.duration || 0;
  const lo = Math.max(0, Number(start) || 0);
  const hi = Math.min(dur && dur > lo ? dur : lo + 30, Number(end) || lo + 10);
  if (!Number.isFinite(hi) || hi <= lo) throw new Error("Clip end must be after start.");
  await seekTo(v, lo);

  const canvas = document.createElement("canvas");
  canvas.width = v.videoWidth || 640;
  canvas.height = v.videoHeight || 360;
  const ctx = canvas.getContext("2d");
  try { ctx.drawImage(v, 0, 0, canvas.width, canvas.height); }
  catch (_e) { throw new Error("The source video is not accessible for extraction (CORS-restricted). Upload the footage file directly."); }

  const stream = canvas.captureStream(fps);
  const mime = pickMime();
  let rec;
  try { rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 }); }
  catch (_e) { rec = new MediaRecorder(stream); }
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise((res) => { rec.onstop = res; });

  rec.start(100);
  await v.play();

  await new Promise((resolve) => {
    const tick = () => {
      if (v.currentTime >= hi || v.ended) { v.pause(); resolve(); return; }
      try { ctx.drawImage(v, 0, 0, canvas.width, canvas.height); }
      catch (_e) { v.pause(); resolve(); return; }
      if (onProgress) onProgress(Math.min(1, (v.currentTime - lo) / Math.max(0.001, hi - lo)));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  rec.stop();
  await stopped;
  v.removeAttribute("src");
  const type = (mime || "video/webm").split(";")[0];
  return { blob: new Blob(chunks, { type }), duration: hi - lo, type };
}