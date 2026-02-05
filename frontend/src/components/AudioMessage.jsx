import { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";

const AudioMessage = ({ src, isMe }) => {
  const audioRef = useRef(new Audio(src));
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;

    const updateProgress = () => setProgress((audio.currentTime / audio.duration) * 100 || 0);
    const setAudioDuration = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", setAudioDuration);
    audio.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", setAudioDuration);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="flex items-center gap-3 w-[200px]">
      <button onClick={togglePlay} className={`p-2 rounded-full ${isMe ? "bg-white/20" : "bg-gray-200"}`}>
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>

      <div className="flex-1">
        <div className={`h-1 rounded-full ${isMe ? "bg-white/40" : "bg-gray-300"}`}>
          <div
            className={`${isMe ? "bg-white" : "bg-violet-500"} h-full rounded-full`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className={`text-xs mt-1 block ${isMe ? "text-violet-100" : "text-gray-500"}`}>
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

export default AudioMessage;
