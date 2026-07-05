"use client";

import { createContext, useCallback, useContext, useState } from "react";

export type PlayerTrack = {
  id: string;
  name: string;
  artists: string[];
};

type PlayContext = {
  curatorName: string;
  coverUrl: string | null;
  queue: PlayerTrack[];
};

type PlayerState = {
  track: PlayerTrack | null;
  curatorName: string | null;
  coverUrl: string | null;
  queue: PlayerTrack[];
  isPlaying: boolean;
  isExpanded: boolean;
};

type PlayerValue = PlayerState & {
  play: (track: PlayerTrack, ctx: PlayContext) => void;
  togglePlay: () => void;
  expand: () => void;
  minimize: () => void;
  skip: (direction: 1 | -1) => void;
};

const initialState: PlayerState = {
  track: null,
  curatorName: null,
  coverUrl: null,
  queue: [],
  isPlaying: false,
  isExpanded: false,
};

const PlayerContext = createContext<PlayerValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlayerState>(initialState);

  const play = useCallback((track: PlayerTrack, ctx: PlayContext) => {
    setState({
      track,
      curatorName: ctx.curatorName,
      coverUrl: ctx.coverUrl,
      queue: ctx.queue,
      isPlaying: true,
      isExpanded: true,
    });
  }, []);

  const togglePlay = useCallback(() => {
    setState((s) => ({ ...s, isPlaying: !s.isPlaying }));
  }, []);

  const expand = useCallback(() => setState((s) => ({ ...s, isExpanded: true })), []);
  const minimize = useCallback(() => setState((s) => ({ ...s, isExpanded: false })), []);

  const skip = useCallback((direction: 1 | -1) => {
    setState((s) => {
      if (!s.track || s.queue.length === 0) return s;
      const idx = s.queue.findIndex((t) => t.id === s.track!.id);
      const nextIdx = (idx + direction + s.queue.length) % s.queue.length;
      return { ...s, track: s.queue[nextIdx], isPlaying: true };
    });
  }, []);

  return (
    <PlayerContext.Provider value={{ ...state, play, togglePlay, expand, minimize, skip }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
