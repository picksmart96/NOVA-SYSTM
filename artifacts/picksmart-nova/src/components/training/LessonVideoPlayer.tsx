import { useState } from "react";
import { getLessonVideo, getYoutubeEmbedUrl, getYoutubeSearchUrl } from "@/data/lessonVideoMap";
import { PlayCircle, ExternalLink, Video } from "lucide-react";

interface LessonVideoPlayerProps {
  moduleId: string;
  title?: string;
  compact?: boolean;
}

export function LessonVideoPlayer({ moduleId, title, compact = false }: LessonVideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const video = getLessonVideo(moduleId);

  if (!video) return null;

  const hasVideo = !!video.youtubeId;
  const searchUrl = getYoutubeSearchUrl(video.searchQuery);

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
        {hasVideo ? "Watch Video" : "Find Video"}
        {!hasVideo && <ExternalLink className="h-3 w-3 ml-0.5 opacity-60" />}
      </button>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
      {/* Video title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
        <Video className="h-4 w-4 text-red-400 shrink-0" />
        <p className="text-sm font-semibold text-white truncate flex-1">
          {title ?? video.title}
        </p>
        {!hasVideo && (
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition shrink-0"
          >
            Search YouTube <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Video area */}
      {hasVideo && playing ? (
        <div className="aspect-video w-full">
          <iframe
            src={getYoutubeEmbedUrl(video.youtubeId)}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      ) : hasVideo ? (
        /* YouTube thumbnail + play overlay */
        <button
          onClick={() => setPlaying(true)}
          className="relative w-full aspect-video bg-slate-950 flex items-center justify-center group"
        >
          <img
            src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60 transition"
          />
          <div className="relative z-10 w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
            <PlayCircle className="h-9 w-9 text-white" />
          </div>
        </button>
      ) : (
        /* No video assigned — show placeholder */
        <div className="aspect-video w-full bg-slate-950 flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
            <Video className="h-8 w-8 text-slate-600" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-slate-400 font-semibold text-sm">No video assigned yet</p>
            <p className="text-slate-600 text-xs max-w-xs">
              Find a relevant YouTube video and paste its embed URL into{" "}
              <code className="text-slate-500">src/data/lessonVideoMap.ts</code>
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
    </div>
  );
}
