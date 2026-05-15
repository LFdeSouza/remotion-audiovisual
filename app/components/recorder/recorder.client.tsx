import { useVideoContext } from "../../hooks/useVideo";
import {
  Circle,
  EditIcon,
  LoaderCircleIcon,
  Pause,
  PlayIcon,
  SquareIcon,
  TrashIcon,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { StatusMessages, useReactMediaRecorder } from "react-media-recorder";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function () {
  const navigate = useNavigate();
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const { addVideo, selectVideo, loading, orderData } = useVideoContext();

  const mimeType = MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")
    ? "video/mp4;codecs=avc1"
    : "video/webm";

  const {
    status,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    mediaBlobUrl,
    previewStream,
    clearBlobUrl,
  } = useReactMediaRecorder({
    video: true,
    screen: true,
    audio: true,

    onStop: onStop,
    mediaRecorderOptions: {
      mimeType,
    },
  });

  async function onStop(_: string, blob: Blob) {
    setMediaBlob(blob);
    const confirm = window.confirm("Você deseja salvar esta gravação?");
    if (!confirm) {
      return;
    }

    await saveAndEdit(blob);
  }

  async function saveAndEdit(blob: Blob | null) {
    if (!blob) {
      return;
    }
    const [video, error] = await addVideo(blob);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Gravação adicionada com sucesso!");
    // Begin editing
    selectVideo(video);

    navigate(`/editor${window.location.search}`);
  }

  if (loading) {
    return <LoaderCircleIcon className="spinner" />;
  }

  return (
    <div className="relative h-[calc(100dvh-3.5rem)] w-full min-w-150 pr-14 pb-4 pl-2">
      <div className="h-full w-full rounded-lg border border-slate-700/80 bg-slate-800/70 p-10 text-white shadow">
        {orderData && (
          <div className="absolute top-4 left-1/2 mb-14 flex -translate-x-1/2 justify-center gap-3 text-gray-400">
            <p>
              Código: <span className="text-white">{orderData.code}</span>
            </p>
            <p>
              Exame: <span className="text-white">{orderData.portfolio}</span>
            </p>
          </div>
        )}
        <div className="mx-auto mt-10 flex items-center justify-center gap-10">
          {status === "idle" && (
            <button
              className="grid cursor-pointer place-items-center rounded-lg p-1.5 text-sm hover:bg-blue-800/50"
              onClick={startRecording}
            >
              <Circle className="h-5 w-5 fill-red-600 stroke-1 hover:fill-red-500" />
              Gravar
            </button>
          )}

          {status === "recording" && (
            <button
              className="grid cursor-pointer place-items-center rounded-lg p-1.5 px-2 text-sm hover:bg-blue-800/50"
              onClick={pauseRecording}
            >
              <Pause className="h-5 w-5 fill-gray-300" />
              Pause
            </button>
          )}

          {status === "recording" && (
            <button
              className="grid cursor-pointer place-items-center rounded-lg p-1.5 px-2 text-sm hover:bg-blue-800/50"
              onClick={stopRecording}
            >
              <SquareIcon className="h-5 w-5 fill-gray-300" />
              Parar
            </button>
          )}

          {status === "paused" && (
            <button
              className="grid cursor-pointer place-items-center rounded-lg p-1.5 px-2 text-sm hover:bg-blue-800/50"
              onClick={resumeRecording}
            >
              <PlayIcon className="h-5 w-5 fill-gray-300" />
              Reiniciar
            </button>
          )}

          {status === "stopped" && (
            <>
              <button
                className="grid cursor-pointer place-items-center rounded-lg p-1.5 text-sm hover:bg-blue-800/50"
                onClick={clearBlobUrl}
              >
                <TrashIcon className="h-5 w-5 stroke-1 hover:bg-slate-500" />
                Descartar
              </button>
              <button
                className="grid cursor-pointer place-items-center rounded-lg p-1.5 text-sm hover:bg-blue-800/50"
                onClick={() => saveAndEdit(mediaBlob)}
              >
                <EditIcon className="h-5 w-5" />
                Salvar e Editar
              </button>
            </>
          )}
        </div>

        <div className="mt-10 flex w-full items-center justify-center">
          <VideoPortion
            status={status}
            previewStream={previewStream}
            mediaBlobUrl={mediaBlobUrl}
          />
        </div>
      </div>
    </div>
  );
}

function VideoPortion({
  status,
  previewStream,
  mediaBlobUrl,
}: {
  status: StatusMessages;
  previewStream: MediaProvider | null;
  mediaBlobUrl: string | undefined;
}) {
  if (status === "recording" && previewStream) {
    return <LivePreview stream={previewStream} />;
  }

  if (status === "stopped" && mediaBlobUrl) {
    return (
      <video
        key={status}
        className="h-[60dvh] w-fit rounded-lg"
        src={mediaBlobUrl}
        controls
        autoPlay
        loop
      />
    );
  }
  return <div className="h-[60dvh] w-10/12 rounded-lg bg-black" />;
}

function LivePreview({ stream }: { stream: MediaProvider }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <video
      className="h-[60dvh] w-fit rounded-lg"
      ref={videoRef}
      autoPlay
      muted
      playsInline
    />
  );
}
