import { Composition } from "remotion";
import {
  COMPOSITION_FPS,
  COMPOSITION_HEIGHT,
  COMPOSITION_ID,
  COMPOSITION_WIDTH,
  COVER_DURATION_IN_SECONDS,
} from "./constants.mjs";
import { Main } from "./components/Main";
import type { CompositionProps } from "./schemata";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id={COMPOSITION_ID}
        component={Main}
        fps={COMPOSITION_FPS}
        width={COMPOSITION_WIDTH}
        height={COMPOSITION_HEIGHT}
        calculateMetadata={({ props }: { props: CompositionProps }) => {
          const videoSeconds = props.videoSegments.reduce((acc, seg) => {
            return acc + (seg.end - seg.start);
          }, 0);
          const totalSeconds =
            COVER_DURATION_IN_SECONDS +
            videoSeconds +
            COVER_DURATION_IN_SECONDS;
          return {
            durationInFrames: Math.max(
              1,
              Math.ceil(totalSeconds * COMPOSITION_FPS),
            ),
            props: props,
          };
        }}
        defaultProps={{
          resizingVideo: null,
          hasCover: true,
          orderData: {
            accountId: "2",
            code: "rmuf7ym7",
            user: "Iugiro Kuroki",
            portfolio: "Pescoço",
            id: "10023",
            clinic: "RADMED",
          },
          videoSegments: [
            {
              src: "https://revideo-telerison.s3.sa-east-1.amazonaws.com/uploads/fd6743ee-094f-44f4-866b-b43e2de3dcaf-m2fp23b3tk.mp4",
              duration: 292,
              start: 0,
              end: 250,
              height: 1080,
              width: 1920,
              compositionStart: 11,
              compositionEnd: 11 + 292,
            },
          ],
        }}
      />
    </>
  );
};
