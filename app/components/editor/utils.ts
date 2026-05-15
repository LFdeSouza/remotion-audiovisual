import { COVER_DURATION_IN_SECONDS } from "~/remotion/constants.mjs";
import { VideoSegment } from "~/remotion/schemata";
/**
 * Adjust time with segments offset.
 * Used for resizing, splitting and seeking the time.
 *
 *  Videos array holds the start and end values in relation to the original video.
 *  Therefore, if we trim the first 60 sec of a video, a currentTime of 10 corresponds to the 70th second of the original video.
 *
 * The idea is that if we trim the video, let's say the first 30 seconds, we need to add 30 seconds to the current time.
 * If we have multiple segments, we need to add the offset videos[i].start - videos[i - 1].end for each segments up to the current time.
 * Also, we need to account for a 0.5 second transition at the start end end of each segment.
 *
 * For example, if we have [{start: 10, end:20}, {start:30, end:40}, {start: 50, end: 60}].
 * For a currentTime of 5, the offset will be 10 (10 - 0), and the adjustedTime 15 (5 + 10)
 * For a currentTime of 15, the offset will be 20 ((10 - 0) + (30 - 20)), and the adjustedTime 34 (15 + 10 + 10)
 **/

export function compositionToInVideoTime(
  currentTime: number,
  segments: VideoSegment[],
  hasCover: boolean,
) {
  if (hasCover && currentTime <= COVER_DURATION_IN_SECONDS) {
    return 0;
  }

  let adjustedTime = currentTime;
  if (hasCover) {
    adjustedTime -= COVER_DURATION_IN_SECONDS;
  }

  for (let i = 0; i < segments.length; i++) {
    if (currentTime <= segments[i].compositionStart) {
      break;
    } else if (segments[i - 1]) {
      adjustedTime += segments[i].start - segments[i - 1].end;
    } else {
      adjustedTime += segments[i].start;
    }

    // else if (i === 0) {
    //   adjustedTime += segments[i].start;
    // } else if (i > 0) {
    //   adjustedTime += segments[i].start - segments[i - 1].end;
    // }
  }
  return adjustedTime;
}

export function inVideoToCompositionTime(
  currentTime: number,
  segments: VideoSegment[],
  hasCover: boolean = true,
) {
  let compositionTime = currentTime;
  if (hasCover && currentTime <= COVER_DURATION_IN_SECONDS) {
    return 0;
  }

  if (hasCover) {
    compositionTime += COVER_DURATION_IN_SECONDS;
  }
  for (let i = 0; i < segments.length; i++) {
    if (compositionTime <= segments[i].compositionStart) {
      break;
    } else if (i === 0) {
      compositionTime -= segments[i].start;
    } else if (i > 0) {
      compositionTime -= segments[i].start - segments[i - 1].end;
    }
  }
  return compositionTime;
}
