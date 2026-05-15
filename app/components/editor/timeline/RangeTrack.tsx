import { VideoSegment } from "~/remotion/schemata";
import { MouseEvent, useCallback, useRef, RefObject } from "react";
import { PlayerRef } from "@remotion/player";
import { COMPOSITION_FPS } from "~/remotion/constants.mjs";
import { inVideoToCompositionTime } from "../utils";

type Props = {
  player: RefObject<PlayerRef | null>;
  videoSegments: VideoSegment[];
  conversionFactor: number;
  selectedSegment: number;
  hasCover: boolean;
  consolidateSegmentResize: (idx: number, start: number, end: number) => void;
  controlPlayerHeadPositionStatus: (status: "freeze" | "free") => void;
  activateResizeView: (src: string) => void;
  handleSelectSegment: (idx: number) => void;
};
export default function RangeTrack({
  player,
  videoSegments,
  conversionFactor,
  selectedSegment,
  hasCover,
  consolidateSegmentResize,
  controlPlayerHeadPositionStatus,
  activateResizeView,
  handleSelectSegment,
}: Props) {
  const rangeTrackRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<HTMLDivElement[]>([]);
  const resizingElement = useRef<{
    ref: HTMLDivElement;
    idx: number;
    position: string;
    segmentStart: number;
    segmentEnd: number;
    originalLeft: number;
    originalRight: number;
    newStart: number;
    newEnd: number;
    lowerLeft: number;
    upperRight: number;
  }>(null);

  const handleMouseMove = useCallback(
    (e: globalThis.MouseEvent) => {
      e.preventDefault();
      const rangeTrack = rangeTrackRef.current;
      if (!player.current || !rangeTrack || !resizingElement.current) {
        return;
      }

      const el = resizingElement.current;
      const xPosition = e.clientX;
      let newWidth = 0;
      let leftOffset = 0;
      let frameToSeek = 0;
      if (el.position === "start") {
        const diff = (xPosition - el.originalLeft) / conversionFactor;
        const currPositionInVideo = el.segmentStart + diff;
        if (
          currPositionInVideo < el.lowerLeft ||
          currPositionInVideo > el.upperRight - 5
        ) {
          return;
        }
        el.newStart = currPositionInVideo;
        newWidth = el.originalRight - xPosition;
        leftOffset = xPosition - el.originalLeft;
        frameToSeek = currPositionInVideo * COMPOSITION_FPS;
      } else {
        const diff = (xPosition - el.originalRight) / conversionFactor;
        const currPositionInVideo = el.segmentEnd + diff;
        if (
          currPositionInVideo > el.upperRight ||
          currPositionInVideo < el.segmentStart + 5
        ) {
          return;
        }
        el.newEnd = currPositionInVideo;
        newWidth = xPosition - el.originalLeft;
        frameToSeek = currPositionInVideo * COMPOSITION_FPS;
      }

      player.current?.seekTo(frameToSeek);
      el.ref.style.width = `${newWidth}px`;
      rangeTrack.style.paddingLeft = `${leftOffset}px`;
    },
    [player, conversionFactor],
  );

  const handleMouseUp = useCallback(() => {
    if (!resizingElement.current) {
      return;
    }

    const data = resizingElement.current;

    consolidateSegmentResize(data.idx, data.newStart, data.newEnd);
    resizingElement.current = null;
    rangeTrackRef.current!.style.paddingLeft = `0px`;
    controlPlayerHeadPositionStatus("free");
    const currentCompositionTime = inVideoToCompositionTime(
      data.position === "start" ? data.newStart : data.newEnd,
      videoSegments,
      true,
    );
    player.current?.seekTo(currentCompositionTime * COMPOSITION_FPS);

    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [
    handleMouseMove,
    controlPlayerHeadPositionStatus,
    consolidateSegmentResize,
    videoSegments,
    player,
  ]);

  const handleMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>, idx: number, position: "start" | "end") => {
      e.preventDefault();
      e.stopPropagation();

      const ref = segmentRefs.current[idx];
      const rect = ref.getBoundingClientRect();
      const segment = videoSegments[idx];

      activateResizeView(segment.src);
      controlPlayerHeadPositionStatus("freeze");

      // TODO: FIX THIS LOGIC:
      // In some situations, it does not start at the right position
      player.current?.pause();
      if (position === "start") {
        player.current?.seekTo(Math.floor(segment.start * COMPOSITION_FPS));
      } else {
        player.current?.seekTo(segment.end * COMPOSITION_FPS);
      }

      // In case there are multiple srcs in the same composition, only consider the current one for boundaries calculation.
      const currentSrcSegments = videoSegments.filter(
        (i) => i.src === segment.src,
      );
      const idxInCurrentSrcSegments = currentSrcSegments.findIndex(
        (i) => i.start === segment.start && i.end === i.end,
      )!;

      resizingElement.current = {
        ref,
        idx,
        position: position,
        segmentStart: segment.start,
        segmentEnd: segment.end,
        originalLeft: rect.left,
        originalRight: rect.right,
        newStart: segment.start,
        newEnd: segment.end,
        lowerLeft: currentSrcSegments[idxInCurrentSrcSegments - 1]
          ? currentSrcSegments[idxInCurrentSrcSegments - 1].end
          : 0,
        upperRight: currentSrcSegments[idxInCurrentSrcSegments + 1]
          ? currentSrcSegments[idxInCurrentSrcSegments + 1].start
          : segment.duration,
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [
      handleMouseMove,
      handleMouseUp,
      controlPlayerHeadPositionStatus,
      resizingElement,
      player,
      videoSegments,
      activateResizeView,
    ],
  );

  return (
    <div
      ref={rangeTrackRef}
      onClick={(e) => e.stopPropagation()}
      className="flex h-12 items-center bg-gray-950"
    >
      {hasCover && (
        <div
          className="h-12 rounded bg-red-600"
          style={{ width: 11 * conversionFactor }}
        />
      )}
      {videoSegments.map((segment, idx) => (
        <div
          key={idx}
          ref={(el) => {
            if (el) {
              segmentRefs.current[idx] = el;
            } else {
              delete segmentRefs.current[idx];
            }
          }}
          className={`relative h-12 rounded border ${selectedSegment === idx ? "border-indigo-200 bg-indigo-700" : "border-indigo-500 bg-indigo-800"} `}
          style={{ width: (segment.end - segment.start) * conversionFactor }}
          onClick={() => {
            handleSelectSegment(idx);
          }}
        >
          <div
            onMouseDown={(e) => handleMouseDown(e, idx, "start")}
            className={`absolute top-1/2 left-0.5 h-4 w-1.25 -translate-y-1/2 cursor-ew-resize rounded-lg border bg-indigo-950 ${selectedSegment === idx ? "border-indigo-200" : "border-transparent"}`}
          />
          <div
            onMouseDown={(e) => handleMouseDown(e, idx, "end")}
            className={`absolute top-1/2 right-0.5 h-4 w-1.25 -translate-y-1/2 cursor-ew-resize rounded-lg border bg-indigo-950 ${selectedSegment === idx ? "border-indigo-200" : "border-transparent"}`}
          />
        </div>
      ))}

      {hasCover && (
        <div
          className="h-12 rounded bg-red-600"
          style={{ width: 10 * conversionFactor }}
        />
      )}
    </div>
  );
}
