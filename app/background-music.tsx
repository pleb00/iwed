"use client";

import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import { Pause, Play } from "lucide-react";

export type BackgroundMusicHandle = { play: () => void };

type BackgroundMusicProps = {
  ref: Ref<BackgroundMusicHandle>;
  src: string;
  volume: number;
  startAt: number;
  visible: boolean;
};

export default function BackgroundMusic({
  ref,
  src,
  volume,
  startAt,
  visible,
}: BackgroundMusicProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const cueApplied = useRef(false);
  const feedbackId = useId();
  const [playing, setPlaying] = useState(false);
  const [feedback, setFeedback] = useState("");
  const source = src.trim();
  const audioSrc =
    source.startsWith("/") && !source.startsWith("//")
      ? `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${source}`
      : source;

  const applyStartingPoint = (audio: HTMLAudioElement) => {
    const seconds = Number.isFinite(startAt) ? Math.max(0, startAt) : 0;
    // If the cue is outside the song, play from the beginning instead.
    audio.currentTime =
      Number.isFinite(audio.duration) && seconds >= audio.duration ? 0 : seconds;
    cueApplied.current = true;
  };

  const play = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    setFeedback("");
    try {
      audio.volume = Math.min(1, Math.max(0, volume));
      if (audio.error) {
        cueApplied.current = false;
        audio.load();
      }
      if (!cueApplied.current && audio.readyState >= 1) applyStartingPoint(audio);
      // Called directly from the opening/play button to preserve the user gesture.
      await audio.play();
    } catch (error) {
      // Pausing while the song is loading intentionally cancels play().
      if (error instanceof DOMException && error.name === "AbortError") return;
      setPlaying(false);
      setFeedback(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Ketuk tombol musik untuk memutar lagu."
          : "Musik belum dapat diputar. Ketuk untuk mencoba lagi.",
      );
    }
  };

  useImperativeHandle(ref, () => ({ play }));

  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

  if (!source) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="none"
        onLoadedMetadata={(event) => {
          // Seeking after metadata arrives also works when play() starts a fresh download.
          if (!cueApplied.current) applyStartingPoint(event.currentTarget);
        }}
        onPlay={() => setPlaying(true)}
        onPlaying={() => setFeedback("")}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          cueApplied.current = false;
          void play();
        }}
        onError={() => {
          setPlaying(false);
          setFeedback("Musik belum dapat diputar. Ketuk untuk mencoba lagi.");
        }}
      />
      <div className="music-player" hidden={!visible}>
        <p id={feedbackId} className="music-feedback" role="status">
          {feedback}
        </p>
        <button
          type="button"
          className="music-toggle"
          aria-label={playing ? "Jeda musik latar" : "Putar musik latar"}
          aria-describedby={feedback ? feedbackId : undefined}
          title={playing ? "Jeda musik" : "Putar musik"}
          onClick={() => {
            const audio = audioRef.current;
            if (audio && !audio.paused) audio.pause();
            else void play();
          }}
        >
          {playing ? (
            <Pause size={18} aria-hidden="true" />
          ) : (
            <Play size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    </>
  );
}
