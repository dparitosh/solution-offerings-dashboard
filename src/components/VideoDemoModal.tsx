import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Maximize2,
  Layers,
  MapPin,
  TrendingUp,
  Target,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Film,
  Compass
} from 'lucide-react';

interface VideoDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateLayer?: (layer: number) => void;
}

interface Chapter {
  time: number;
  label: string;
  layer: number;
  icon: React.ReactNode;
  summary: string;
}

export const VideoDemoModal: React.FC<VideoDemoModalProps> = ({
  isOpen,
  onClose,
  onNavigateLayer
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pendingChapter = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(130.88);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);

  const chapters: Chapter[] = [
    {
      time: 0,
      label: '1. Overview & 4-Layer System',
      layer: 1,
      icon: <Sparkles className="w-3.5 h-3.5 text-blue-500" />,
      summary: 'Platform introduction & quarterly governance telemetry architecture.'
    },
    {
      time: 16,
      label: '2. Executive Dashboard (Layer 1)',
      layer: 1,
      icon: <Layers className="w-3.5 h-3.5 text-sky-500" />,
      summary: 'Aggregated financial targets, actuals, offering drilldowns & win rates.'
    },
    {
      time: 42,
      label: '3. Geography View (Layer 2)',
      layer: 2,
      icon: <MapPin className="w-3.5 h-3.5 text-purple-500" />,
      summary: 'Regional performance across North America, EMEA, APAC, and LATAM.'
    },
    {
      time: 68,
      label: '4. Pipeline Gaps (Layer 3)',
      layer: 3,
      icon: <TrendingUp className="w-3.5 h-3.5 text-amber-500" />,
      summary: 'Pipeline coverage ratio benchmarks, deficit sizing & remedial logging.'
    },
    {
      time: 96,
      label: '5. TCV Gaps & Owners (Layer 4)',
      layer: 4,
      icon: <Target className="w-3.5 h-3.5 text-emerald-500" />,
      summary: 'Solution offerings TCV charts, owner selection & bulleted action plans.'
    },
    {
      time: 122,
      label: '6. Summary & Export',
      layer: 1,
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />,
      summary: 'Key takeaways and audit-ready Excel export.'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      pendingChapter.current = null;
      setActiveChapterIndex(0);
      setCurrentTime(0);
      setIsPlaying(true);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {
          // Autoplay policy fallback
          setIsPlaying(false);
        });
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [isOpen]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      if (pendingChapter.current !== null) {
        if (Math.abs(cur - chapters[pendingChapter.current].time) > 1) return;
        pendingChapter.current = null;
      }
      setCurrentTime(cur);

      // Find current chapter
      for (let i = chapters.length - 1; i >= 0; i--) {
        if (cur >= chapters[i].time - 0.5) {
          setActiveChapterIndex(i);
          break;
        }
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const jumpToChapter = (time: number) => {
    const index = chapters.findIndex(chapter => chapter.time === time);
    pendingChapter.current = index >= 0 ? index : null;
    setActiveChapterIndex(index >= 0 ? index : 0);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">

        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Executive Walkthrough Demo (2:10 MP4 with Audio)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                  1080p HD
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Tour of all 4 operational layers: Dashboard, Geography, Pipeline Gaps, and TCV Practice Owners
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/executive_dashboard_demo.mp4"
              download="executive_dashboard_demo.mp4"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 transition"
              title="Download MP4 Video File"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Download MP4 (3.6 MB)</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player & Main Stage */}
        <div className="relative bg-black flex-1 flex items-center justify-center aspect-video max-h-[60vh] overflow-hidden group">
          <video
            ref={videoRef}
            src="/executive_dashboard_demo.mp4"
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 130.88)}
            onEnded={() => setIsPlaying(false)}
            playsInline
          />

          {/* Floating Big Play Button if Paused */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-16 h-16 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-105"
            >
              <Play className="w-7 h-7 ml-1" />
            </button>
          )}

          {/* Player Controls Bar */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex flex-col gap-2 transition opacity-95">
            {/* Scrubber */}
            <div className="relative flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 130.88}
                value={currentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCurrentTime(val);
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="hover:text-white transition">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button onClick={() => jumpToChapter(0)} className="hover:text-white transition" title="Restart">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button onClick={toggleMute} className="hover:text-white transition">
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <span className="text-[11px] font-mono text-slate-400">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">
                  Current: <strong className="text-indigo-400">{chapters[activeChapterIndex]?.label}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Selection Matrix & Live Sync */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Jump to Section / View</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Click any section below to jump the video to that layer
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {chapters.map((ch, idx) => {
              const isActive = activeChapterIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => jumpToChapter(ch.time)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between text-xs ${
                    isActive
                      ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-[11px] line-clamp-1">{ch.label}</span>
                    {ch.icon}
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {formatTime(ch.time)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-[11px]">{chapters[activeChapterIndex]?.summary}</span>
            </div>

            {onNavigateLayer && (
              <button
                onClick={() => {
                  onNavigateLayer(chapters[activeChapterIndex]?.layer || 1);
                  onClose();
                }}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
              >
                <span>Switch App to this Layer</span>
                <span>&rarr;</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
