import { AbsoluteFill, OffthreadVideo, interpolate } from "remotion";
import { COMPOSITION_FPS, TRANSITION_DURATION_FRAMES } from "../constants.mjs";
import { VideoSegment as tVideoSegment } from "../schemata";

export const VideoSegment = ({
  frame,
  segment,
}: {
  segment: tVideoSegment;
  frame: number;
}) => {
  const segmentStart = Math.floor(segment.compositionStart * COMPOSITION_FPS);
  const segmentEnd = Math.floor(segment.compositionEnd * COMPOSITION_FPS);

  const opacity = interpolate(
    frame,
    [
      segmentStart,
      segmentStart + TRANSITION_DURATION_FRAMES,
      segmentEnd - TRANSITION_DURATION_FRAMES,
      segmentEnd,
    ],
    [0, 1, 1, 0],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    },
  );

  const volume = interpolate(
    frame,
    [
      segmentStart,
      segmentStart + TRANSITION_DURATION_FRAMES,
      segmentEnd - TRANSITION_DURATION_FRAMES,
      segmentEnd,
    ],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={segment.src}
        trimBefore={segment.start * COMPOSITION_FPS}
        trimAfter={segment.end * COMPOSITION_FPS}
        style={{ opacity, backgroundColor: "black" }}
        volume={volume}
      />
    </AbsoluteFill>
  );
};
