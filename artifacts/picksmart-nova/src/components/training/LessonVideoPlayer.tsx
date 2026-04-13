import { useState } from "react";
import { getLessonVideo, getYoutubeEmbedUrl, getYoutubeSearchUrl } from "@/data/lessonVideoMap";
import { useLessonVideoStore } from "@/lib/lessonVideoStore";
import { PlayCircle, ExternalLink, Video, Youtube, Download } from "lucide-react";

interface LessonVideoPlayerProps {
  moduleId: string;
  title?: string;
  compact?: boolean;
}

export function LessonVideoPlayer({ moduleId, title, compact = false }: LessonVideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const override = useLessonVideoStore((s) => s.overrides[moduleId]);
  const base = getLessonVideo(moduleId);

  if (!base && !override) return null;

  const youtubeId = override?.youtubeId || base?.youtubeId || "";
  const videoTitle = title ?? override?.customTitle ?? base?.title ?? "Lesson Demo Video";
  const searchQuery = base?.searchQuery ?? "";
  const hasVideo = !!youtubeId;
  const searchUrl = getYoutubeSearchUrl(searchQuery);
  const watchUrl = hasVideo ? `https://www.youtube.com/watch?v=${youtubeId}` : searchUrl;

  if (compact) {
    return (
      <button
        onClick={() => {
          if (hasVideo) setPlaying(true);
          else window.open(searchUrl, "_blank", "noopener,noreferrer");
        }}
        className="flex items-center gap-2 rounded-lg bg-red-600/15 border border-red-500/20 px-3 py-2 text-red-300 hover:bg-red-600/25 transition text-xs font-semibold"
      >
        <PlayCircle className="h-3.5 w-3.5 shrink-0" />
        {hasVideo ? "Watch Demo Video" : "Find Demo Video"}
        {!hasVideo && <ExternalLink className="h-3 w-3 ml-0.5 opacity-60" />}
      </button>
    );
  }

  return (
    <div className="w-full rounded-3xl overflow-hidden border border-slate-800 bg-slate-900">
      {/* Title bar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-red-600/20 flex items-center justify-center shrink-0">
          <Youtube className="h-4 w-4 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-0.5">Demo Video</p>
          <p className="text-sm font-semibold text-white truncate">{videoTitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasVideo && (
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Watch on YouTube"
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:border-red-500/50 hover:text-red-300 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Watch on YouTube
            </a>
          )}
          {!hasVideo && (
            <a
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition"
            >
              Search YouTube <ExternalLink className="h-3 w-3 ml-0.5" />
            </a>
          )}
        </div>
      </div>

      {/* Video area */}
      {hasVideo && playing ? (
        <div className="aspect-video w-full">
          <iframe
            src={getYoutubeEmbedUrl(youtubeId)}
            title={videoTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      ) : hasVideo ? (
        <button
          onClick={() => setPlaying(true)}
          className="relative w-full aspect-video bg-slate-950 flex items-center justify-center group"
        >
          <img
            src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
            alt={videoTitle}
            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60 transition"
          />
          <div className="relative z-10 w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
            <PlayCircle className="h-9 w-9 text-white" />
          </div>
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="rounded-xl bg-black/70 backdrop-blur px-4 py-2 flex items-center gap-2">
              <Youtube className="h-4 w-4 text-red-400 shrink-0" />
              <span className="text-white text-sm font-semibold truncate">{videoTitle}</span>
            </div>
          </div>
        </button>
      ) : (
        <div className="aspect-video w-full bg-slate-950 flex flex-col items-center justify-center gap-4 p-8">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
            <Video className="h-8 w-8 text-slate-600" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-slate-400 font-semibold text-sm">No video assigned yet</p>
            <p className="text-slate-600 text-xs max-w-xs">
              The owner can add a YouTube video for this lesson from the Owner panel under Lesson Videos.
            </p>
          </div>
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 transition px-5 py-2.5 text-white font-bold text-sm"
          >
            <PlayCircle className="h-4 w-4" />
            Search YouTube for this lesson
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
        </div>
      )}

      {/* Footer note */}
      {hasVideo && (
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Download className="h-3.5 w-3.5" />
            To save this video, open it on YouTube and use the download option there.
          </div>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-red-400 hover:text-red-300 transition font-semibold shrink-0 flex items-center gap-1"
          >
            Open on YouTube <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
