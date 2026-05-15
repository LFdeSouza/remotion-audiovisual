import { PlayerRef } from "@remotion/player";
import Ruler from "./Ruler";
import { useCurrentPlayerFrame } from "~/hooks/useCurrentPlayerFrame";
import React, { RefObject, useRef, MouseEvent, useCallback } from "react";
import { COMPOSITION_FPS } from "~/remotion/constants.mjs";
import { VideoSegment } from "~/remotion/schemata";
import RangeTrack from "./RangeTrack";

const TIMELINE_OFFSET = 16; //pl-4

type Props = {
  player: RefObject<PlayerRef | null>;
  timelineInfo: {
    durationInFrames: number;
    videoSegments: VideoSegment[];
    resizingVideo: null | VideoSegment;
  };
  rulerLength: number;
  trackLeftPositionInPx: number;
  conversionFactor: number;
  selectedSegment: number;
  hasCover: boolean;
  consolidateSegmentResize: (idx: number, start: number, end: number) => void;
  activateResizeView: (src: string) => void;
  handleSelectSegment: (idx: number) => void;
};

export default function Timeline({
  player,
  timelineInfo,
  rulerLength,
  trackLeftPositionInPx,
  conversionFactor,
  hasCover,
  selectedSegment,
  handleSelectSegment,
  consolidateSegmentResize,
  activateResizeView,
}: Props) {
  const isSeeking = useRef<boolean>(false);
  const freezePlayerHeadPositionAt = useRef<number | null>(null);

  const currentFrame = useCurrentPlayerFrame(player);

  // Calculate playhead position based on current frame
  const getPlayheadPosition = (): number => {
    if (freezePlayerHeadPositionAt.current !== null) {
      return freezePlayerHeadPositionAt.current;
    }
    const currentTimeInSeconds = currentFrame / COMPOSITION_FPS;
    return currentTimeInSeconds * conversionFactor + TIMELINE_OFFSET; //+16 to account for padding in div "pl-4"
  };

  const controlPlayerHeadPositionStatus = (status: "freeze" | "free") => {
    if (status === "freeze") {
      freezePlayerHeadPositionAt.current = getPlayheadPosition();
    } else {
      freezePlayerHeadPositionAt.current = null;
    }
  };

  // Handle hover to show time preview
  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      const clickX = e.clientX - trackLeftPositionInPx;
      const timeInSeconds = clickX / conversionFactor;

      if (player.current && isSeeking.current) {
        player.current.pause();
        const seekFrame = Math.floor(timeInSeconds * COMPOSITION_FPS);
        const validSeekFrame = Math.min(
          Math.max(seekFrame, 0),
          timelineInfo.durationInFrames - 1,
        );
        player.current.seekTo(validSeekFrame);
      }
    },
    [conversionFactor, timelineInfo, trackLeftPositionInPx, player],
  );

  const handleMouseLeave = useCallback(() => {
    isSeeking.current = false;
  }, []);

  // Handle click to seek
  const handleTimelineClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!player.current) {
        return;
      }
      const clickX = e.clientX - trackLeftPositionInPx;
      const timeInSeconds = clickX / conversionFactor;
      const seekFrame = Math.floor(timeInSeconds * COMPOSITION_FPS);

      // Validate seek position respects video duration
      const validSeekFrame = Math.min(
        Math.max(seekFrame, 0),
        timelineInfo.durationInFrames - 1,
      );

      player.current.seekTo(validSeekFrame);
    },
    [trackLeftPositionInPx, conversionFactor, timelineInfo, player],
  );
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isSeeking.current = true;
  }, []);

  const playheadPosition = getPlayheadPosition();

  return (
    <div
      draggable={false}
      className="relative h-52 overflow-x-auto pl-4"
      onClick={handleTimelineClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Ruler length={rulerLength} conversionFactor={conversionFactor} />

      {/* Pointer head*/}
      <div
        className="absolute top-0 z-50 h-full w-0.5 cursor-move bg-white"
        onMouseDown={handleMouseDown}
        onMouseUp={() => (isSeeking.current = false)}
        style={{ left: playheadPosition }}
      >
        <div className="h-6 w-4 -translate-x-1/2 rounded-b-md bg-white opacity-70" />
      </div>

      <RangeTrack
        player={player}
        videoSegments={timelineInfo.videoSegments}
        conversionFactor={conversionFactor}
        hasCover={hasCover}
        selectedSegment={selectedSegment}
        controlPlayerHeadPositionStatus={controlPlayerHeadPositionStatus}
        consolidateSegmentResize={consolidateSegmentResize}
        activateResizeView={activateResizeView}
        handleSelectSegment={handleSelectSegment}
      />
    </div>
  );
}
