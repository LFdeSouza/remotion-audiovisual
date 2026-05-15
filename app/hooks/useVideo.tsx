import React, { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import {
  addVideoToIndexDb,
  deleteVideoFromIndexDb,
  getItemsFromIndexDb,
} from "../lib/videoUtils";
import { VideoFile, VideoFileWithUrl, OrderData } from "~/remotion/schemata";

interface IVideoContext {
  selectedVideos: VideoFileWithUrl[];
  selectVideo: (video: VideoFile) => void;
  startNewReport: (video: VideoFile) => void;
  videos: VideoFile[];
  addVideo: (
    mediaBlob: File | Blob,
  ) => Promise<[VideoFile, null] | [null, Error]>;
  deleteVideo: (id: string) => Promise<["ok", null] | [null, Error]>;
  loading: boolean;
  orderData: OrderData | null;
  resetState: boolean;
  clearResetState: () => void;
}

const VideoContext = React.createContext<IVideoContext | null>(null);

function VideosProvider({ children }: { children: React.ReactNode }) {
  const [searchParams] = useSearchParams();
  const [selectedVideos, setSelectedVideos] = useState<VideoFileWithUrl[]>([]);
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [resetState, setResetState] = useState(false);
  // Loading is necessary when there is a order in the search param. Component will start with loading set to true, and
  // will be set to false in the useEffect during mount
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  useEffect(() => {
    const getOrderData = async () => {
      const code = searchParams.get("order");
      if (!code) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const telerisonApi = import.meta.env.VITE_TELERISON_API;
        const res = await axios.get(`${telerisonApi}/order/${code}`, {
          headers: {
            Authorization: token,
          },
        });
        const orderData = res.data;
        setOrderData(orderData);
      } catch (error) {
        if (error instanceof AxiosError) {
          const message = error.response?.data?.error || error.message;
          console.error(message);
          toast.error(message);
        }
      }
      setLoading(false);
    };

    //Fetch recorder videos saved in localforage
    getItems();
    //Fetch current order data
    getOrderData();
  }, [searchParams]);

  /**
   * Get saved recordings from index db
   * Search through index db via localforage to get all saved recordings.
   **/
  const getItems = async () => {
    const videos = await getItemsFromIndexDb("recording");
    setVideos(videos);
  };

  const selectVideo = (file: VideoFile) => {
    const fileWithUrl = { ...file, url: URL.createObjectURL(file.file) };
    setSelectedVideos((prev) => {
      return [...prev, fileWithUrl];
    });
  };

  /**
   * Add video
   * Add video to the current timeline
   */
  const addVideo = async (
    mediaBlob: File | Blob,
  ): Promise<[VideoFile, null] | [null, Error]> => {
    try {
      const data = await addVideoToIndexDb(
        mediaBlob,
        orderData?.code,
        "recording",
      );
      setVideos([data, ...videos]);
      return [data, null];
    } catch (error) {
      return [null, error as Error];
    }
  };

  /**
   * Start new report
   * Clear selected videos and set a new one
   */
  const startNewReport = (file: VideoFile) => {
    setResetState(true);
    setSelectedVideos((prev) => {
      //Revoke unused urls
      for (const video of prev) {
        URL.revokeObjectURL(video.url);
      }

      const url = URL.createObjectURL(file.file);
      return [{ ...file, url }];
    });
  };

  const clearResetState = async () => {
    setResetState(false);
  };

  /**
   * Delete video
   * Deletes a video from indexDb
   **/
  const deleteVideo = async (
    id: string,
  ): Promise<["ok", null] | [null, Error]> => {
    try {
      await deleteVideoFromIndexDb(`telerison_recording_${id}`);
      setSelectedVideos([]);
      setVideos((prev) => prev.filter((i) => i.id !== id));
      return ["ok", null];
    } catch (error) {
      return [null, error as Error];
    }
  };

  return (
    <VideoContext.Provider
      value={{
        selectedVideos,
        selectVideo,
        videos,
        addVideo,
        startNewReport,
        deleteVideo,
        loading,
        orderData,
        resetState,
        clearResetState,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
}

const useVideoContext = () => {
  const ctx = useContext(VideoContext);
  if (!ctx) {
    throw new Error("Use video must be called within a Video provider");
  }
  return ctx;
};

export { useVideoContext, VideosProvider };
