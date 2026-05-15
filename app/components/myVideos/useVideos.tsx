import {
  deleteVideoFromIndexDb,
  getItemsFromIndexDb,
} from "../../lib/videoUtils";
import type { Video } from "~/lib/types";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const useVideos = () => {
  const [reports, setReports] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const savedReports = await getItemsFromIndexDb("report");
        setReports(savedReports);
      } catch (error) {
        console.error(error);
        if (error instanceof Error) {
          toast.error(`Alguma coisa deu errada: ${error.message}`);
        }
      }
      setLoading(false);
    };
    fetchReports();
  }, []);

  async function handleDeleteVideo(id: string) {
    try {
      await deleteVideoFromIndexDb(`telerison_report_${id}`);
      setReports((prev) => prev.filter((i) => i.id !== id));
      toast.success("Laudo excluído com sucesso");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Alguma coisa deu errada: ${error.message}`);
      }
    }
  }
  return { reports, loading, handleDeleteVideo };
};

export default useVideos;
