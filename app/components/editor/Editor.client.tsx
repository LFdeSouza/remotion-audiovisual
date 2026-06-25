import { Player, PlayerRef } from "@remotion/player";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  COMPOSITION_FPS,
  COMPOSITION_HEIGHT,
  COMPOSITION_WIDTH,
  COVER_DURATION_IN_SECONDS,
  ONE_FRAME,
} from "../../remotion/constants.mjs";
import { Main } from "../../remotion/components/Main";
import { CompositionProps, VideoSegment } from "../../remotion/schemata";
import Timeline from "./timeline/Timeline";
import Controls from "./Controls";
import useResizeSubscription from "../../hooks/useResizeSubscription";
import { compositionToInVideoTime } from "./utils";
import { useVideoContext } from "~/hooks/useVideo";
import { LoaderCircleIcon } from "lucide-react";
import EmptySkeleton from "./Empty";

export default function Editor() {
  const {
    selectedVideos,
    loading,
    orderData,
    timelineAction,
    changeTimelineAction,
    revokeUnusedVideo,
  } = useVideoContext();
  const videoAreaRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<PlayerRef | null>(null);
  const [rulerLength, setRulerLength] = useState(0);
  const [conversionFactor, setConversionFactor] = useState(0);
  const [hasCover, setHasCover] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState(0);
  const trackLeftPositionInPx = useResizeSubscription(videoAreaRef);
  const [timeline, setTimeline] = useState({
    videoSegments: [] as VideoSegment[],
    resizingVideo: null as VideoSegment | null,
    durationInFrames: 0,
  });
  // This ref stores the value of hasCover. The reason for this is to avoid running useLayoutEffect to
  // add another video to the timeline on selection. Ideally, we shouldn't need to store compositionStart
  // and the useLayout effect could run fine without this dependency. TODO
  const hasCoverRef = useRef(hasCover);

  /**
   * Update timeline segments on video selection
   *
   * When user selects a video to be added to the timeline, we need to calculate the
   * ruler length and set the correct start and finish composition times for each video.
   */
  useLayoutEffect(() => {
    if (!videoAreaRef.current || !selectedVideos.length) {
      return;
    }

    // Skip reseting timeline if selectedFiles changed because of a deleted segment
    if (timelineAction === "revokeUnused") {
      changeTimelineAction("editing");
      return;
    }
    const dimensions = videoAreaRef.current.getBoundingClientRect();
    const timelineWidth = dimensions.width;
    const maxDurationInSeconds = selectedVideos.reduce(
      (acc, curr) => (acc += curr.duration),
      0,
    );

    // Video should ocupy 80% of timeline for better editing experience
    const rulerLength = Math.max(
      ((maxDurationInSeconds + COVER_DURATION_IN_SECONDS * 2) * 100) / 75,
      120,
    );
    setRulerLength(rulerLength);
    //Conversion factor to convert px to seconds in the timeline
    setConversionFactor(timelineWidth / rulerLength);

    setTimeline((prev) => {
      const currVideosInTimeline = prev.videoSegments.map((i) => i.src);
      const newVideo = selectedVideos.filter(
        (i) => !currVideosInTimeline.includes(i.url),
      );
      if (!newVideo.length) {
        return prev;
      }
      let accumulatedDuration = hasCoverRef.current
        ? COVER_DURATION_IN_SECONDS
        : 0;
      //Get the accumulated duration of previous state of the video only if is editing.
      //Otherwise it will be reseting the timeline to start a new composition
      if (timelineAction === "editing") {
        for (const segment of prev.videoSegments) {
          accumulatedDuration += segment.end - segment.start;
        }
      }
      const videoToAdd = selectedVideos[selectedVideos.length - 1];
      const newSegment = {
        src: videoToAdd.url,
        duration: videoToAdd.duration,
        height: videoToAdd.height,
        width: videoToAdd.width,
        start: 0,
        end: videoToAdd.duration,
        compositionStart: accumulatedDuration,
        compositionEnd: accumulatedDuration + videoToAdd.duration,
      };
      accumulatedDuration += videoToAdd.duration;

      const newCompositionDuration =
        accumulatedDuration + COVER_DURATION_IN_SECONDS;

      let newSegments = [];
      if (timelineAction === "resetTimeline") {
        newSegments = [newSegment];
      } else {
        newSegments = [...prev.videoSegments, newSegment];
      }

      return {
        videoSegments: newSegments,
        durationInFrames: Math.floor(newCompositionDuration * COMPOSITION_FPS),
        resizingVideo: null,
      };
    });
    //Reset the timelineAction to editing in case it is reseting
    changeTimelineAction("editing");
  }, [selectedVideos, timelineAction, changeTimelineAction]);

  const handleToggleCover = useCallback(() => {
    setHasCover((hadCover) => {
      const cover = !hadCover;

      // Adjust segment and video duration
      setTimeline((prev) => {
        let accumulatedDuration = cover ? COVER_DURATION_IN_SECONDS : 0;
        const updatedComposition = prev.videoSegments.map((segment) => {
          const segmentDuration = segment.end - segment.start;
          const updatedSegment = {
            ...segment,
            compositionStart: accumulatedDuration,
            compositionEnd: accumulatedDuration + segmentDuration,
          };
          accumulatedDuration += segmentDuration;
          return updatedSegment;
        });

        const fullCoverDuration = COVER_DURATION_IN_SECONDS * COMPOSITION_FPS;
        const newDuration = hadCover
          ? prev.durationInFrames - fullCoverDuration
          : prev.durationInFrames + fullCoverDuration;
        return {
          videoSegments: updatedComposition,
          durationInFrames: newDuration,
          resizingVideo: null,
        };
      });

      hasCoverRef.current = cover;
      return cover;
    });
  }, []);

  const handleDeleteSegment = useCallback(() => {
    setTimeline((prev) => {
      let accumulatedDuration = hasCover ? COVER_DURATION_IN_SECONDS : 0;
      if (prev.videoSegments.length === 1) {
        return prev;
      }
      // Filter removed segment and recalculate start and end of each segment
      const newSegments = prev.videoSegments
        .filter((_, idx) => idx !== selectedSegment)
        .map((segment) => {
          const segmentDuration = segment.end - segment.start;
          const updatedSegment = {
            ...segment,
            compositionStart: accumulatedDuration,
            compositionEnd: accumulatedDuration + segmentDuration,
          };
          accumulatedDuration += segmentDuration;
          return updatedSegment;
        });

      const totalDurationInSeconds = hasCover
        ? accumulatedDuration + COVER_DURATION_IN_SECONDS
        : accumulatedDuration;

      // If there is no more references to the url of the deleted segment, update selectedFiles
      const deletedSegmentUrl = prev.videoSegments[selectedSegment].src;
      const stillInTimeline = newSegments.find(
        (i) => i.src === deletedSegmentUrl,
      );
      if (!stillInTimeline) {
        revokeUnusedVideo(deletedSegmentUrl);
        changeTimelineAction("revokeUnused");
      }
      return {
        videoSegments: newSegments,
        durationInFrames: Math.floor(totalDurationInSeconds * COMPOSITION_FPS),
        resizingVideo: null,
      };
    });
    setSelectedSegment(0);
  }, [hasCover, selectedSegment, revokeUnusedVideo, changeTimelineAction]);

  const consolidateSegmentResize = useCallback(
    (idx: number, start: number, end: number) => {
      setTimeline((prev) => {
        let newCompositionDuration = timeline.durationInFrames;
        let accumulatedVideoTime = hasCover ? COVER_DURATION_IN_SECONDS : 0;

        const newSegments = prev.videoSegments.map((segment, i) => {
          if (idx === i) {
            segment.start = start;
            segment.end = end;
          }
          const segmentDuration = segment.end - segment.start;
          segment.compositionStart = accumulatedVideoTime;
          segment.compositionEnd = accumulatedVideoTime + segmentDuration;
          accumulatedVideoTime += segmentDuration;
          return segment;
        });

        newCompositionDuration = Math.floor(
          (accumulatedVideoTime + COVER_DURATION_IN_SECONDS) * COMPOSITION_FPS,
        );
        return {
          videoSegments: newSegments,
          durationInFrames: newCompositionDuration,
          resizingVideo: null,
        };
      });
    },
    [timeline, hasCover],
  );

  const activateResizeView = useCallback(
    (src: string) => {
      if (!selectedVideos.length) {
        return;
      }

      const video = selectedVideos.find((i) => i.url === src)!;
      setTimeline((prev) => ({
        resizingVideo: {
          src: video.url,
          duration: video.duration,
          height: video.height,
          width: video.width,
          start: 0,
          end: video.duration,
          compositionStart: COVER_DURATION_IN_SECONDS,
          compositionEnd: COVER_DURATION_IN_SECONDS + video.duration,
        },
        durationInFrames: Math.floor(video.duration * COMPOSITION_FPS),
        videoSegments: prev.videoSegments,
      }));
    },
    [selectedVideos],
  );

  const handleSelectSegment = useCallback((idx: number) => {
    setSelectedSegment(idx);
  }, []);

  const inputProps: CompositionProps = useMemo(() => {
    return {
      videoSegments: timeline.videoSegments,
      resizingVideo: timeline.resizingVideo,
      hasCover,
      orderData,
    };
  }, [timeline, hasCover, orderData]);

  const handleSplit = useCallback(() => {
    if (!playerRef.current) {
      return;
    }

    const currentFrame = playerRef.current.getCurrentFrame();
    const currentTimeInSeconds = currentFrame / COMPOSITION_FPS;

    setTimeline((prev) => {
      const currentVideo = prev.videoSegments.find(
        (i) =>
          currentTimeInSeconds >= i.compositionStart &&
          currentTimeInSeconds <= i.compositionEnd,
      )!;
      const inVideoTime = compositionToInVideoTime(
        currentTimeInSeconds,
        prev.videoSegments,
        hasCover,
      );

      const newSegments = prev.videoSegments.flatMap((segment) => {
        const insideSegement =
          segment.src === currentVideo.src &&
          inVideoTime >= segment.start &&
          inVideoTime <= segment.end;
        if (insideSegement) {
          return [
            {
              ...segment,
              end: inVideoTime,
              compositionStart: segment.compositionStart,
              compositionEnd: currentTimeInSeconds,
            },
            {
              ...segment,
              start: inVideoTime,
              compositionStart: currentTimeInSeconds + ONE_FRAME,
              compositionEnd:
                currentTimeInSeconds + (segment.end - inVideoTime),
            },
          ];
        } else {
          return segment;
        }
      });
      return {
        videoSegments: newSegments,
        durationInFrames: prev.durationInFrames,
        resizingVideo: null,
      };
    });
  }, [hasCover]);

  if (loading) {
    return <LoaderCircleIcon className="spinner" />;
  }

  return (
    <main className="relative h-[calc(100dvh-3.5rem)] w-full min-w-150 pr-14 pb-4 pl-2">
      <div className="h-full w-full rounded-lg border border-slate-700/80 bg-slate-800/70 text-white shadow">
        {orderData && (
          <div className="absolute -top-8 left-1/2 flex -translate-x-1/2 justify-center gap-3 text-sm text-gray-400">
            <p>
              Código: <span className="text-white">{orderData.code}</span>
            </p>
            <p>
              Exame: <span className="text-white">{orderData.portfolio}</span>
            </p>
          </div>
        )}

        <div id="videoArea" ref={videoAreaRef} className="h-full">
          {!timeline.durationInFrames && <EmptySkeleton />}
          {!!timeline.durationInFrames && (
            <div className="flex h-full flex-col justify-between">
              <Player
                acknowledgeRemotionLicense
                ref={playerRef}
                component={Main}
                inputProps={inputProps}
                durationInFrames={timeline.durationInFrames}
                fps={COMPOSITION_FPS}
                compositionHeight={COMPOSITION_HEIGHT}
                compositionWidth={COMPOSITION_WIDTH}
                style={{
                  // Can't use tailwind class for width since player's default styles take presedence over tailwind's,
                  // but not over inline styles
                  width: "65%",
                  margin: "auto",
                  borderRadius: "7px",
                }}
                controls
                loop
              />
              <div className="overflow-hidden rounded-b-lg bg-slate-900">
                <Controls
                  player={playerRef}
                  duration={timeline.durationInFrames / COMPOSITION_FPS}
                  handleSplitVideo={handleSplit}
                  canDelete={timeline.videoSegments.length > 1}
                  videoFiles={selectedVideos}
                  inputProps={inputProps}
                  handleToggleCover={handleToggleCover}
                  handleDeleteSegment={handleDeleteSegment}
                />
                <Timeline
                  player={playerRef}
                  timelineInfo={timeline}
                  rulerLength={rulerLength}
                  trackLeftPositionInPx={trackLeftPositionInPx}
                  conversionFactor={conversionFactor}
                  hasCover={hasCover}
                  selectedSegment={selectedSegment}
                  consolidateSegmentResize={consolidateSegmentResize}
                  activateResizeView={activateResizeView}
                  handleSelectSegment={handleSelectSegment}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
