import { Disc2, Trash2, VideoIcon, FileVideo2Icon } from "lucide-react";
import { useVideoContext } from "~/hooks/useVideo";
import { VideoFile } from "~/remotion/schemata";
import { formatTime } from "../utils";
import { useLocation, Link, useNavigate } from "react-router";
import Tooltip from "../shared/tooltip";
import {
  MouseEvent,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export default function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const search = location.search;
  const {
    videos,
    selectedVideos,
    addVideo,
    selectVideo,
    startNewReport,
    deleteVideo,
  } = useVideoContext();

  const navigate = useNavigate();
  const importMedia = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      await addVideo(file);
    },
    [addVideo],
  );

  const handleSelectVideo = useCallback(
    async (file: VideoFile) => {
      selectVideo(file);
      navigate(`/editor${window.location.search}`);
    },
    [selectVideo, navigate],
  );

  const handleDeleteVideo = useCallback(
    async (id: string) => {
      const confirm = window.confirm(
        "Tem certeza que deseja excluir este item?",
      );
      if (!confirm) {
        return;
      }

      const [, error] = await deleteVideo(id);
      if (error) {
        return;
      }
    },
    [deleteVideo],
  );

  const handleStartNewReport = useCallback(
    async (video: VideoFile) => {
      startNewReport(video);
      navigate(`/editor${window.location.search}`);
    },
    [startNewReport, navigate],
  );

  return (
    <aside className="flex h-[calc(100dvh-3.5rem)] gap-2 px-0.5 pb-4">
      <div className="w-16">
        <Link to={`/myVideos${search}`}>
          <div
            className={`flex flex-col items-center justify-center p-2 ${pathname === "/myVideos" ? "bg-linear-to-r from-indigo-800/60 to-slate-800/60" : "bg-transparent"} mb-4 cursor-pointer rounded-lg transition-colors duration-200 ease-in-out hover:bg-indigo-900/70`}
          >
            <FileVideo2Icon className="h-5 w-5 stroke-1 text-gray-100" />
            <p className="mt-1 text-center text-[0.65rem] font-medium text-gray-100">
              Laudos
            </p>
          </div>
        </Link>

        <Link to={`/editor${search}`}>
          <div
            className={`flex flex-col items-center justify-center p-2 ${pathname === "/editor" ? "bg-linear-to-r from-indigo-800/60 to-slate-800/60" : "bg-transparent"} cursor-pointer rounded-lg transition-colors duration-200 ease-in-out hover:bg-indigo-900/70`}
          >
            <VideoIcon className="h-5 w-5 stroke-1 text-gray-100" />
            <p className="mt-1 text-center text-[0.65rem] font-medium text-gray-100">
              Editar
            </p>
          </div>
        </Link>

        <Link to={`/recorder${search}`}>
          <div
            className={`mt-4 flex flex-col items-center justify-center p-2 ${pathname === "/recorder" ? "bg-linear-to-r from-indigo-800/60 to-slate-800/60" : "bg-transparent"} cursor-pointer rounded-lg transition-colors duration-200 ease-in-out hover:bg-indigo-900/70`}
          >
            <Disc2 className="h-5 w-5 stroke-1 text-gray-100" />
            <p className="mt-1 text-center text-[0.65rem] font-medium text-gray-100">
              Gravar
            </p>
          </div>
        </Link>
      </div>
      <div className="w-72 rounded-lg border border-slate-700/70 bg-slate-800/40 p-3">
        <h2 className="mb-6 border-b border-slate-700/70 p-1 text-center text-lg font-semibold text-white">
          Gravações
        </h2>
        <div>
          <input
            type="file"
            id="importMedia"
            className="hidden"
            accept=".mp4"
            onChange={(e) => importMedia(e.target.files?.[0])}
          />
        </div>
        <label
          htmlFor="importMedia"
          className="mb-4 block w-full cursor-pointer rounded-lg bg-indigo-800 p-1.5 text-center text-sm text-white transition-colors duration-200 ease-in-out hover:bg-indigo-900"
        >
          Importar vídeo
        </label>

        <div className="max-h-[85%] overflow-auto">
          {videos.map((video) => (
            <VideoTumbnail
              selected={!!selectedVideos.some((i) => i.id === video.id)}
              key={video.id}
              video={video}
              showClearTimeline={!!selectedVideos.length}
              handleSelectVideo={handleSelectVideo}
              handleDeleteVideo={handleDeleteVideo}
              handleStartNewReport={handleStartNewReport}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

function VideoTumbnail({
  video,
  selected,
  showClearTimeline,
  handleSelectVideo,
  handleDeleteVideo,
  handleStartNewReport,
}: {
  video: VideoFile;
  selected: boolean;
  showClearTimeline: boolean;
  handleDeleteVideo: (id: string) => void;
  handleSelectVideo: (video: VideoFile) => void;
  handleStartNewReport: (video: VideoFile) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleOpenMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  return (
    <div
      className={`${selected ? "bg-slate-700/50" : ""} relative mb-8 cursor-pointer rounded-lg p-1`}
      ref={ref}
      onClick={() => handleSelectVideo(video)}
      onContextMenu={handleOpenMenu}
    >
      <div className="h-40">
        <img
          className="h-full w-full rounded border border-slate-700 object-contain"
          src={video.thumbnail}
          alt={video.filename}
        />
      </div>
      <p className="text-xs text-white opacity-50">{video.filename}</p>
      <p className="absolute right-2 bottom-6 rounded border border-gray-800 bg-black/50 p-0.5 px-1.5 text-xs text-white">
        {formatTime(video.duration)}
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteVideo(video.id);
        }}
        className="absolute top-2 right-2 rounded-lg bg-slate-700/40 p-1"
      >
        <Tooltip text="Excluir">
          <Trash2 className="h-4 w-4 stroke-red-500" />
        </Tooltip>
      </button>
      <VideoSelectionMenu
        video={video}
        parentRef={ref}
        closeMenu={closeMenu}
        isOpen={menuOpen}
        showClearTimeline={showClearTimeline}
        handleSelectVideo={handleSelectVideo}
        handleStartNewReport={handleStartNewReport}
      />
    </div>
  );
}

const VideoSelectionMenu = ({
  parentRef,
  closeMenu,
  isOpen,
  video,
  showClearTimeline,
  handleSelectVideo,
  handleStartNewReport,
}: {
  parentRef: RefObject<HTMLDivElement | null>;
  closeMenu: () => void;
  isOpen: boolean;
  video: VideoFile;
  showClearTimeline: boolean;
  handleSelectVideo: (file: VideoFile) => void;

  handleStartNewReport: (video: VideoFile) => void;
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!isOpen) {
      setIsEntering(false);
      return;
    }

    const rect = parentRef.current!.getBoundingClientRect();
    setCoords({ left: rect.right + 20, top: rect.top + 10 });
    const animationFrame = requestAnimationFrame(() => {
      setIsEntering(true);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [isOpen, parentRef]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        closeMenu();
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside);
  }, [closeMenu, isOpen]);

  return createPortal(
    isOpen && (
      <div
        ref={menuRef}
        style={{
          left: coords.left,
          top: coords.top,
        }}
        className={`absolute z-10000 w-60 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-sm text-white shadow-xl transition-opacity duration-150 ease-out ${
          isEntering
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-1 scale-95 opacity-0"
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSelectVideo(video);
          }}
          className="block w-full cursor-pointer rounded p-2 text-left hover:bg-slate-800"
        >
          Adicionar a linha do tempo
        </button>
        {showClearTimeline && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStartNewReport(video);
            }}
            className="block w-full cursor-pointer rounded p-2 text-left hover:bg-slate-800"
          >
            Começar outro laudo
          </button>
        )}
      </div>
    ),
    document.body,
  );
};
