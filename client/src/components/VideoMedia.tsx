import { useMemo, useState } from "react";

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0] || "";
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v") || "";
        return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
      }

      const parts = parsed.pathname.split("/").filter(Boolean);
      const marker = parts[0];
      const id = parts[1] || "";
      if (["embed", "shorts", "live"].includes(marker)) {
        return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export default function VideoMedia({
  videoUrl,
  className,
}: {
  videoUrl?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const safeUrl = (videoUrl || "").trim();
  const youtubeId = useMemo(() => extractYouTubeId(safeUrl), [safeUrl]);

  if (!safeUrl || failed) return null;

  if (youtubeId) {
    return (
      <div className={className || "mb-3"}>
        <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingTop: "56.25%" }}>
          <iframe
            title="YouTube video"
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            onError={() => setFailed(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={className || "mb-3"}>
      <video
        src={safeUrl}
        controls
        playsInline
        className="w-full max-h-80 rounded-xl"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
