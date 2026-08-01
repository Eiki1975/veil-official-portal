export type MusicRelease = {
  id: string;
  type: string;
  title: string;
  artist: string;
  duration: string;
  cover: string;
  audio: string;
};

export const borderlineRelease: MusicRelease = {
  id: "borderline",
  type: "DEBUT SINGLE",
  title: "Borderline",
  artist: "VEIL",
  duration: "03:58",
  cover: "/images/music/borderline-debut-single-cover-v1-20260801.png",
  audio: "/audio/borderline-debut-single-v1-20260801.mp3",
};
