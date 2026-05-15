import useVideos from "./useVideos";
import type { Video } from "~/lib/types";
import { useState } from "react";
import { LoaderCircleIcon, Trash2 } from "lucide-react";
import { formatTime } from "../utils";
import Tooltip from "../shared/tooltip";
import PlayVideoModal from "./playVideoModal";

export default function () {
  const { loading, reports, handleDeleteVideo } = useVideos();
  const [videoIdToModal, setVideoIdToModal] = useState<null | string>(null);

  const handleSetVideo = (id: string) => {
    setVideoIdToModal(id);
  };

  if (loading) {
    return (
      <main className="relative h-[calc(100dvh-3.5rem)] w-full min-w-150 pb-4 pl-2 pr-14">
        <LoaderCircleIcon className="spinner" />
      </main>
    );
  }

  return (
    <main className="relative h-[calc(100dvh-3.5rem)] w-full min-w-150 pb-4 pl-2 pr-14">
      <div className="h-full w-full rounded-lg border border-slate-700/80 bg-slate-800/70 p-10 text-white shadow">
        <h2 className="text-xl text-white">Meus laudos</h2>
        <div className="grid max-h-[80dvh] gap-4 overflow-auto p-10 xl:grid-cols-3 2xl:grid-cols-4">
          {reports.map((i) => (
            <VideoTumbnail
              video={i}
              handleDeleteVideo={handleDeleteVideo}
              selectVideo={handleSetVideo}
            />
          ))}
        </div>
      </div>
      <PlayVideoModal
        videoId={videoIdToModal}
        closeModal={() => setVideoIdToModal(null)}
      />
    </main>
  );
}

function VideoTumbnail({
  video,
  selectVideo,
  handleDeleteVideo,
}: {
  video: Video;
  selectVideo: (id: string) => void;
  handleDeleteVideo: (id: string) => void;
}) {
  return (
    <div
      className={`relative mb-8 w-fit cursor-pointer rounded-lg p-1 hover:bg-slate-900`}
      onClick={() => selectVideo(video.id)}
    >
      <div className="h-40">
        <img
          className="peer h-full rounded border border-slate-700 object-contain"
          src={video.thumbnail}
          alt={video.filename}
        />
      </div>
      <p className="text-xs text-white opacity-50">{video.filename}</p>
      <p className="absolute bottom-6 right-2 rounded border border-gray-800 bg-black/50 p-0.5 px-1.5 text-xs text-white">
        {formatTime(video.duration)}
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteVideo(video.id);
        }}
        className="absolute right-2 top-2 rounded-lg bg-slate-700/40 p-1"
      >
        <Tooltip text="Excluir">
          <Trash2 className="h-4 w-4 stroke-red-500" />
        </Tooltip>
      </button>
    </div>
  );
}
