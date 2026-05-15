import { fetchFileFromlocalforage } from "../../lib/videoUtils";
import { DownloadIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function PlayVideoModal({
  videoId,
  closeModal,
}: {
  videoId: string | null;
  closeModal: () => void;
}) {
  const [videoSrc, setVideoSrc] = useState("");
  const [filename, setFilename] = useState("");

  function handleDownloadVideo() {
    const a = document.createElement("a");
    a.href = videoSrc;
    a.download = `${filename}`;
    a.target = "_blank";
    a.click();
  }

  useEffect(() => {
    const fetchVideoUrl = async () => {
      try {
        const video = await fetchFileFromlocalforage(
          `telerison_report_${videoId}`,
        );
        if (!video) {
          return;
        }
        const url = URL.createObjectURL(video.file);
        setVideoSrc(url);
        setFilename(video.filename);
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        }
      }
    };
    fetchVideoUrl();
  }, [videoId]);

  if (!videoId) {
    return null;
  }
  return (
    <div className="fixed inset-0 bg-slate-900/80" onClick={closeModal}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="- absolute left-1/2 top-20 flex h-[80dvh] w-[70dvw] -translate-x-1/2 flex-col items-center justify-center rounded-lg bg-slate-800"
      >
        <video
          controls
          playsInline
          className="w-10/12 rounded-lg bg-black"
          src={videoSrc}
        />
        <button
          className="mt-2 flex items-center gap-4 rounded-lg bg-blue-600 p-2 px-4 text-white hover:bg-blue-700"
          onClick={handleDownloadVideo}
        >
          <DownloadIcon />
          Download
        </button>
      </div>
    </div>
  );
}
