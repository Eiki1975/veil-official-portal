import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Music2, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import type { MusicRelease } from "./data/music";

export type AudioPlayerHandle = { play: () => void };

type PersistentAudioPlayerProps = {
  release: MusicRelease;
  audioSrc: string;
  coverSrc: string;
  isOpen: boolean;
  hasBeenOpened: boolean;
  onOpen: () => void;
  onMinimize: () => void;
  onTrack: (event: string, detail?: string) => void;
};

const timeLabel = (value: number) => {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export const PersistentAudioPlayer = forwardRef<AudioPlayerHandle, PersistentAudioPlayerProps>(function PersistentAudioPlayer(
  { release, audioSrc, coverSrc, isOpen, hasBeenOpened, onOpen, onMinimize, onTrack },
  ref,
) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState("");

  const play = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setError("");
    void audio.play().then(() => onTrack("music_play", release.id)).catch(() => setError("再生を開始できませんでした。もう一度お試しください。"));
  };
  const pause = () => { audioRef.current?.pause(); onTrack("music_pause", release.id); };
  useImperativeHandle(ref, () => ({ play }), [release.id]);
  const togglePlay = () => audioRef.current?.paused ? play() : pause();
  const seek = (value: number) => { if (audioRef.current) { audioRef.current.currentTime = value; setCurrentTime(value); } };
  const toggleMute = () => { if (audioRef.current) { audioRef.current.muted = !audioRef.current.muted; setIsMuted(audioRef.current.muted); } };

  return <>
    <audio ref={audioRef} src={audioSrc} preload="metadata" onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => { setIsPlaying(false); setCurrentTime(0); onTrack("music_complete", release.id); }} onError={() => setError("音源を読み込めませんでした。")} />
    {isOpen ? <aside className="persistent-audio-player" aria-label={`${release.title} プレイヤー`}>
      <div className="persistent-audio-player__artwork" aria-hidden="true"><img src={coverSrc} alt="" /></div>
      <div className="persistent-audio-player__content"><p>{release.type}</p><strong>{release.title}</strong><span>{release.artist} · {release.duration}</span></div>
      <button className="persistent-audio-player__play" type="button" onClick={togglePlay} aria-label={isPlaying ? "一時停止" : "再生"}>{isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
      <div className="persistent-audio-player__timeline"><span>{timeLabel(currentTime)}</span><input type="range" min="0" max={duration || 1} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={(event) => seek(Number(event.target.value))} aria-label="再生位置" /><span>{duration ? timeLabel(duration) : release.duration}</span></div>
      <button className="persistent-audio-player__mute" type="button" onClick={toggleMute} aria-label={isMuted ? "ミュートを解除" : "ミュート"}>{isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}</button>
      <button className="persistent-audio-player__minimize" type="button" onClick={() => { onMinimize(); onTrack("music_player_minimize", release.id); }} aria-label="プレイヤーを小さくする"><X size={16} /></button>
      {error && <p className="persistent-audio-player__error" role="status">{error}</p>}
    </aside> : hasBeenOpened ? <button className={`persistent-audio-launcher ${isPlaying ? "is-playing" : ""}`} type="button" onClick={() => { onOpen(); onTrack("music_player_open", release.id); }} aria-label={`${release.title}のプレイヤーを開く`}><Music2 size={16} /> <span>MUSIC</span></button> : null}
  </>;
});
