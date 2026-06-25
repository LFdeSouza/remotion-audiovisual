import { useCallback, useEffect, useRef, useState } from "react";
import axios, { AxiosError } from "axios";
import { LoaderCircleIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { addVideoToIndexDb } from "~/lib/videoUtils";
import { Link } from "react-router";
import { CompositionProps, VideoFileWithUrl } from "~/remotion/schemata";
import { useRendering } from "~/lib/use-rendering";
import { UploadRouteResponse } from "~/getS3SignedUrl";
import { ProgressBar } from "./ProgressBar";

export interface RenderParams {
  videoFiles: VideoFileWithUrl[];
  inputProps: CompositionProps;
}

export default function ({ renderParams }: { renderParams: RenderParams }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        className="flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-800 p-2 px-4 text-sm text-white"
        onClick={() => setIsOpen(true)}
      >
        <Upload className="h-4 w-4" />
        Exportar
      </button>

      <RenderPanel
        renderParams={renderParams}
        isOpen={isOpen}
        closeRenderPanel={() => setIsOpen(false)}
      />
    </>
  );
}

function RenderPanel({
  isOpen,
  renderParams,
  closeRenderPanel,
}: {
  isOpen: boolean;
  renderParams: RenderParams;
  closeRenderPanel: (renderParams: null | RenderParams) => void;
}) {
  const sidePanel = useRef<HTMLDivElement>(null);
  const renderPanel = useRef<HTMLDivElement>(null);
  const [renderedReport, setRenderedReport] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [outName] = useState(
    renderParams.inputProps.orderData?.code
      ? renderParams.inputProps.orderData.code
      : Math.random().toString(36).slice(2, 12),
  );

  //Animation
  useEffect(() => {
    if (!renderPanel.current || !sidePanel.current) {
      return;
    }
    let timeout: ReturnType<typeof setTimeout>;
    const overlay = renderPanel.current;
    const panel = sidePanel.current;
    if (renderParams) {
      timeout = setTimeout(() => {
        overlay.classList.remove("opacity-0");
        overlay.classList.add("opacity-100");
        panel.classList.remove("translate-x-full");
      }, 1);
    }
    return () => clearTimeout(timeout);
  }, [isOpen, renderParams]);

  const { renderMedia, state, undo } = useRendering(outName);

  const resetProgress = useCallback(() => {
    setRenderedReport(null);
    undo();
  }, [undo]);

  const downloadAndSetOutput = useCallback(
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) {
        toast.error(
          "Alguma coisa deu errada. Por favor tente novamente mais tarde.",
        );
        resetProgress();
        return;
      }
      const blob = await res.blob();
      const filename = renderParams.videoFiles[0].filename.replace(
        /.mp4|.webm/,
        "",
      );

      const file = new File([blob], filename);
      await addVideoToIndexDb(blob, filename, "report");
      setRenderedReport(file);
      return file;
    },

    [renderParams, resetProgress],
  );

  // Upload local video blob to s3 so the renderer have access to it.
  // It will be deleted after 3 days.
  // Returns the list of paths where the video is saved in S3 to pass to the renderer function.
  const uploadBlob = useCallback(
    async (
      videosToUpload: VideoFileWithUrl[],
    ): Promise<[string[], null] | [null, string]> => {
      setUploading(true);
      // 1. Ask backend for an authorization to send files

      const getSignedRes = await fetch("/api/getS3SignedUrl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videosToUpload: videosToUpload.map((i) => ({ filename: i.filename })),
        }),
      });
      const signedUrls = (await getSignedRes.json()) as UploadRouteResponse;
      if (signedUrls.type === "error") {
        return [null, signedUrls.message];
      }
      const signedUrlsData = signedUrls.data;

      const uploadData = signedUrlsData.map((file, idx) => ({
        url: file.signedUrl,
        file: videosToUpload[idx].file,
        type: videosToUpload[idx].file.type,
      }));

      //Send files using the signed url
      try {
        await Promise.all(
          uploadData.map(async (data) => {
            return fetch(data.url, {
              method: "PUT",
              body: data.file,
              headers: {
                "Content-Type": data.type,
              },
            });
          }),
        );
      } catch (error) {
        return [null, (error as Error).message];
      } finally {
        setUploading(false);
      }

      const fileUrls = signedUrlsData.map((i) => i.fileUrl);
      return [fileUrls, null];
    },
    [],
  );

  // Upload rendered result to data center and create an entry on OrderFiles
  const uploadToMedicalReport = useCallback(
    async (renderedReport: File) => {
      if (!renderParams.inputProps.orderData || !renderedReport) {
        toast.error(
          "Alguma coisa deu errada. Por favor tente novamente mais tarde.",
        );
        return;
      }

      try {
        // Upload file to datacenter
        const formData = new FormData();
        formData.append("file", renderedReport);
        const id = renderParams.inputProps.orderData.id;
        const uploadRes = await axios.postForm(
          `https://apirouter.bmkimagem.com.br:21043/3dfile/${id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              "Access-Control-Allow-Origin": "*",
            },
            maxBodyLength: 10000000,
            maxContentLength: 10000000,
          },
        );

        // Create orderFile entry in database
        const hash = uploadRes.data.hash;
        const token = localStorage.getItem("token");
        await axios.post(
          `${import.meta.env.VITE_TELERISON_API}/createOrderFile`,
          {
            code: renderParams.inputProps.orderData.code,
            hash,
          },
          {
            headers: {
              Authorization: token,
            },
          },
        );

        return null;
      } catch (error) {
        console.error(error);
        if (error instanceof AxiosError) {
          return new Error(
            `Alguma coisa deu errada, ${error.response?.data?.error}`,
          );
        }
        return new Error("Alguma coisa deu errada");
      }
    },
    [renderParams],
  );

  useEffect(() => {
    if (state.status === "error") {
      toast.error(state.error.message);
      resetProgress();
    } else if (state.status === "done") {
      downloadAndSetOutput(state.url).then((file) => {
        if (renderParams.inputProps.orderData?.id && file) {
          uploadToMedicalReport(file).then((error) => {
            if (error) {
              toast.error(`Alguma coisa deu errada`);
              return;
            }
            toast.success(
              "Laudo audiovisual enviado para o exame, mas ele pode demorar alguns minutos para ficar disponível para visualização.",
            );
          });
        } else {
          toast.success("Laudo audiovisual criado com sucesso.");
        }
      });
    }
  }, [
    state,
    renderParams.inputProps,
    downloadAndSetOutput,
    resetProgress,
    uploadToMedicalReport,
  ]);

  // Download the rendered result and save it locally into index db

  const downloadFile = useCallback(async () => {
    if (!renderedReport) {
      return;
    }
    const downloadUrl = URL.createObjectURL(renderedReport);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${renderedReport.name}.mp4`;
    a.target = "_blank";
    a.click();
  }, [renderedReport]);

  const handleClosePanel = useCallback(() => {
    if (uploading || ["invoking", "rendering"].includes(state.status)) {
      return;
    }
    resetProgress();
    closeRenderPanel(null);
  }, [closeRenderPanel, resetProgress, state.status, uploading]);

  async function render() {
    if (!renderParams) {
      return;
    }

    resetProgress();
    const [filePaths, uploadError] = await uploadBlob(renderParams.videoFiles);
    if (uploadError) {
      console.error("error", uploadError);
      toast.error(uploadError);
      resetProgress();
      return;
    }

    const normalizedInputProps = {
      ...renderParams.inputProps,
      videoSegments: renderParams.inputProps.videoSegments.map((video) => {
        const index = renderParams.videoFiles.findIndex(
          (i) => i.url === video.src,
        );
        return { ...video, src: filePaths![index] };
      }),
    };

    renderMedia(normalizedInputProps);
  }

  return isOpen ? (
    <div
      ref={renderPanel}
      className="fixed inset-0 z-10000 h-screen w-screen bg-black/50 opacity-0 transition-opacity duration-300 ease-in-out"
      onClick={handleClosePanel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        ref={sidePanel}
        className="absolute top-14 right-0 bottom-0 w-[35dvw] translate-x-full bg-slate-700 transition-transform duration-300 ease-in-out"
      >
        <div className="h-full p-10 text-white">
          <h2 className="text-center text-xl font-semibold">Exportar vídeo</h2>
          <div className="p-10">
            {!uploading && state.status === "init" && (
              <>
                <p className="p-5 text-sm opacity-60">
                  Aperte em "gerar laudo" para realizar a conversão do vídeo.
                  Ele será salvo em seu navegador automáticamente, e estará
                  disponível na página: 'Meus laudos'{" "}
                </p>
                <button
                  onClick={render}
                  className="mx-auto mb-10 block w-full cursor-pointer rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
                >
                  Gerar vídeo
                </button>
              </>
            )}

            <div className="mx-auto">
              {(uploading || state.status === "invoking") && (
                <div className="flex items-center justify-center gap-5">
                  <p>Preparando:</p>
                  <LoaderCircleIcon className="spinner h-6 w-6" />
                </div>
              )}

              {state.status === "rendering" && (
                <ProgressBar progress={state.progress} />
              )}
              {state.status === "done" && !renderedReport && (
                <div className="flex items-center justify-center gap-5">
                  <p>Finalizando:</p>
                  <LoaderCircleIcon className="spinner h-6 w-6" />
                </div>
              )}

              {state.status === "done" && renderedReport && (
                <>
                  <p className="p-5 text-sm opacity-60">
                    Seu laudo audiovisual já foi encaminhado à solicitação,
                    porém, ele pode demorar alguns minutos para ficar disponível
                    em nossos servidores. Você também pode visualizar o laudo na
                    página "Meus laudos" ou fazer o download diretamente para o
                    seu computador.
                  </p>
                  <button
                    className="mx-auto mt-10 flex w-80 cursor-pointer items-center justify-center rounded-lg bg-red-500 p-2 text-sm text-white hover:bg-red-600"
                    onClick={downloadFile}
                  >
                    Download
                  </button>
                  <Link
                    className="mx-auto mt-10 flex w-80 cursor-pointer items-center justify-center rounded-lg bg-blue-600 p-2 text-sm hover:bg-blue-700"
                    to="/myVideos"
                  >
                    Ir para seus vídeos
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;
}
