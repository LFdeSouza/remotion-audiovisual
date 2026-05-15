import localforage from "localforage";
import type { VideoFile } from "~/remotion/schemata";

type VideoType = "recording" | "report";

/**
 * Get video metatdata
 *
 * Chorme has a know bug that returns Infinity as the duration of a video. Therefore, we need to manually
 * load the video and get the metadata. For convinience, we save this information alongside the video itself in indexDb.
 *
 * @param {Blob} blob - The video file, which can came from the screen recorder api or uploaded by the user.
 * @returns {Promise>{thumbnail:string; width:number;height:number;duration:number}>}
 **/
export const getVideoMetadata = async (
  blob: Blob,
): Promise<{
  thumbnail: string;
  width: number;
  height: number;
  duration: number;
}> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    video.muted = true; // Required in some browsers to auto-seek
    video.onloadedmetadata = async () => {
      const { videoWidth: width, videoHeight: height } = video;
      let duration = video.duration;

      const captureFrame = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const thumbnail = canvas.toDataURL("image/png");
          URL.revokeObjectURL(url);
          resolve({ width, height, duration, thumbnail });
        } else {
          return reject(new Error("Failed to draw video frame"));
        }
      };

      //Because we are setting the currentTime to the end in chorme, the onseeked event will trigger, getting the last frame.
      //Here we attach another onseeked envent, modify the currenTime again to trigger this new one, guaranteeing that we are
      //in the right frame
      const seekToZeroAndCapture = () => {
        video.onseeked = () => {
          video.onseeked = null;
          captureFrame();
        };
        video.currentTime = 0;
      };

      // Chrome has a known bug that returns Infinity as the duration of the video.
      if (duration === Infinity) {
        //Set an ontimeupdate handler that will be triggered below to capture the
        video.ontimeupdate = () => {
          video.ontimeupdate = null;
          duration = video.duration;

          // Reset to beginning to capture frame
          video.currentTime = 0;
        };

        // After seeking back to 0, wait for frame. Will be triggered after the ontimeupdate
        video.onseeked = () => {
          video.onseeked = null;
          seekToZeroAndCapture();
        };

        //Force the video to it's end to trigger the ontimeupdate event that will capture the correct duration
        video.currentTime = 1e10;
      } else {
        // Normal path: wait for first frame to decode
        video.onloadeddata = () => {
          video.onloadeddata = null;
          seekToZeroAndCapture();
        };
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load video"));
    };
  });

export async function getItemsFromIndexDb(type: VideoType) {
  const savedVideos = await localforage.keys();
  const videos = [];
  for (const k of savedVideos) {
    if (!k.includes(type)) {
      continue;
    }
    const video = (await localforage.getItem(k)) as VideoFile;
    videos.push({
      id: video.id,
      filename: video.filename,
      height: video.height,
      width: video.width,
      duration: video.duration,
      thumbnail: video.thumbnail,
      file: video.file,
    });
  }

  return videos;
}

export async function fetchFileFromlocalforage(
  selectedVideo: string,
): Promise<VideoFile | null> {
  return await localforage.getItem(selectedVideo);
}

/**
 * Add video
 *
 * Add videos to indexdb for later use in the editor. Video can come from a file or from a recording.
 * If orderData is present, it will save with the name of the video
 * if it comes from a recording (recorder area) or a report (after editing and rendered)
 **/
export async function addVideoToIndexDb(
  mediaBlob: File | Blob,
  orderCode: string | undefined,
  mediaType: VideoType,
): Promise<VideoFile> {
  let id = Math.random().toString(36).slice(-10);

  // update id to be the orderCode for more description. Users can have multiple recordings for the same order,
  // so include the n.
  if (orderCode) {
    const recordings = await localforage.keys();
    const nRecordings = recordings.filter((i) =>
      i.includes(`telerison_${mediaType}_${orderCode}`),
    ).length;
    id = `${orderCode}-${nRecordings + 1}`;
  }

  let type = mediaBlob.type;
  if (type === "application/octet-stream") {
    type = "video/mp4";
  }
  const ext = type.replace("video/", "");
  const filename = `${id}.${ext}`;
  const videoInfo = await getVideoMetadata(mediaBlob);
  if (!videoInfo) {
    throw new Error("Alguma coisa deu errada, por favor tente novamente");
  }

  const key = `telerison_${mediaType}_${id}`;
  const data = {
    id,
    filename,
    file: mediaBlob,
    orderCode,
    url: "",
    ...videoInfo,
  };

  await localforage.setItem(key, data);
  return data;
}

export async function deleteVideoFromIndexDb(videoKey: string) {
  await localforage.removeItem(videoKey);
  return videoKey;
}
