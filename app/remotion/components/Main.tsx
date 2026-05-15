import {
  AbsoluteFill,
  OffthreadVideo,
  useCurrentFrame,
  Series,
} from "remotion";
import React from "react";
import { CompositionProps } from "../schemata";
import { COMPOSITION_FPS } from "../constants.mjs";
import { VideoSegment } from "./VideoSegment";
import { Cover, BackCover } from "./Cover";

const container: React.CSSProperties = {
  backgroundColor: "white",
};

export const Main = ({
  videoSegments,
  resizingVideo,
  hasCover,
  orderData,
}: CompositionProps) => {
  const frame = useCurrentFrame();
  if (!videoSegments.length) {
    return <AbsoluteFill style={container}></AbsoluteFill>;
  }

  const lastVideoFrame = Math.floor(
    videoSegments[videoSegments.length - 1].compositionEnd * COMPOSITION_FPS,
  );

  if (resizingVideo) {
    return (
      <AbsoluteFill>
        <OffthreadVideo src={resizingVideo.src} />
      </AbsoluteFill>
    );
  }

  return (
    <Series>
      {hasCover && (
        <Series.Sequence durationInFrames={11 * COMPOSITION_FPS}>
          <Cover frame={frame} orderData={orderData} />
        </Series.Sequence>
      )}

      {videoSegments.map((segment) => {
        const durationInFrames = Math.floor(
          (segment.end - segment.start) * COMPOSITION_FPS,
        );
        return (
          <Series.Sequence durationInFrames={durationInFrames}>
            <VideoSegment segment={segment} frame={frame} />
          </Series.Sequence>
        );
      })}

      {hasCover && (
        <Series.Sequence durationInFrames={10 * COMPOSITION_FPS + 30}>
          <BackCover frame={frame} initialFrame={lastVideoFrame} />
        </Series.Sequence>
      )}
    </Series>
  );
};
