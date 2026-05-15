import { RefObject } from "react";
import { PlayerRef } from "@remotion/player";
import {
  useCurrentPlayerFrame,
  useCurrentPlayerStatus,
} from "~/hooks/useCurrentPlayerFrame";
import Tooltip from "../shared/tooltip";
import {
  AlbumIcon,
  PauseIcon,
  PlayIcon,
  ScissorsIcon,
  Trash2Icon,
} from "lucide-react";
import { formatTime } from "../utils";
import { COMPOSITION_FPS } from "~/remotion/constants.mjs";
import {
  VideoSegment,
  CompositionProps,
  VideoFileWithUrl,
} from "~/remotion/schemata";
import RenderPanelButton from "../renderPanel/RenderPanel";

type Props = {
  player: RefObject<PlayerRef | null>;
  duration: number;
  canDelete: boolean;
  videoFiles: VideoFileWithUrl[];
  inputProps: CompositionProps;
  handleSplitVideo: () => void;
  handleDeleteSegment: () => void;
  handleToggleCover: () => void;
};

export default function Controls({
  player,
  duration,
  handleSplitVideo,
  videoFiles,
  inputProps,
  canDelete,
  handleDeleteSegment,
  handleToggleCover,
}: Props) {
  return (
    <div className="my-2 grid w-full grid-cols-[0.1fr,1fr,0.1fr] place-items-center pt-2">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center">
          <SplitButton
            splitVideo={handleSplitVideo}
            player={player}
            videoSegments={inputProps.videoSegments}
          />

          <Tooltip text="Exluir segment">
            <button
              className={`p-2 ${canDelete ? "cursor-pointer" : "cursor-default"}`}
              onClick={handleDeleteSegment}
            >
              <Trash2Icon
                className={`h-6 w-6 ${canDelete ? "stroke-white" : "stroke-slate-800"}`}
              />
            </button>
          </Tooltip>

          <Tooltip text="Adicionar capa">
            <button className="p-2" onClick={handleToggleCover}>
              <AlbumIcon
                className={`h-6 w-6 cursor-pointer ${inputProps.hasCover ? "stroke-white" : "stroke-slate-500"}`}
              />
            </button>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <PlayButton player={player} />
          <TimeDisplay player={player} duration={duration} />
        </div>
        <div className="mr-10">
          <RenderPanelButton
            renderParams={{
              videoFiles: videoFiles,
              inputProps,
            }}
          />
        </div>
      </div>
    </div>
  );
}

const PlayButton = ({ player }: { player: RefObject<PlayerRef | null> }) => {
  const isPlaying = useCurrentPlayerStatus(player);
  const handleTogglePlay = () => {
    if (!player.current) {
      return;
    }

    if (isPlaying) {
      player.current.pause();
    } else {
      player.current.play();
    }
  };
  return (
    <button
      onClick={handleTogglePlay}
      className="peer cursor-pointer rounded-full bg-white p-1.5 transition-colors duration-200 ease-in-out hover:bg-indigo-800"
    >
      {isPlaying ? (
        <PauseIcon className="h-5 w-5 fill-black stroke-0" />
      ) : (
        <PlayIcon className="h-5 w-5 fill-black stroke-0" />
      )}
    </button>
  );
};

const TimeDisplay = ({
  player,
  duration,
}: {
  player: RefObject<PlayerRef | null>;
  duration: number;
}) => {
  const currentFrame = useCurrentPlayerFrame(player);
  const currentTime = currentFrame / COMPOSITION_FPS;
  return (
    <p className="text-xs text-white">
      {formatTime(currentTime)} | {formatTime(duration)}
    </p>
  );
};

const SplitButton = ({
  player,
  splitVideo,
  videoSegments,
}: {
  player: RefObject<PlayerRef | null>;
  splitVideo: () => void;
  videoSegments: VideoSegment[];
}) => {
  const currentFrame = useCurrentPlayerFrame(player);
  const currentTime = currentFrame / COMPOSITION_FPS;

  const withinAllowedBoundary = () => {
    const currSegment = videoSegments.find(
      (i) =>
        i.compositionStart <= currentTime && i.compositionEnd >= currentTime,
    );

    if (!currSegment) {
      return false;
    }

    const insideSegment =
      currentTime >= currSegment!.compositionStart + 5 &&
      currentTime <= currSegment!.compositionEnd - 5;

    if (insideSegment) {
      return true;
    }

    return false;
  };

  const canSplitVideo = withinAllowedBoundary() ? true : false;

  return (
    <Tooltip text="Adicionar segmento">
      <button
        className={`ml-4 p-2 ${canSplitVideo ? "cursor-pointer" : "cursor-default"}`}
        onClick={canSplitVideo ? splitVideo : () => {}}
      >
        <ScissorsIcon
          className={`h-6 w-6 ${canSplitVideo ? "stroke-white" : "stroke-slate-800"}`}
        />
      </button>
    </Tooltip>
  );
};
