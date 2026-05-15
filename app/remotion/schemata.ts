export type VideoSegment = {
  src: string;
  duration: number;
  start: number;
  end: number;
  height: number;
  width: number;
  compositionStart: number;
  compositionEnd: number;
};

export type VideoFile = {
  id: string;
  filename: string;
  height: number;
  width: number;
  duration: number;
  thumbnail: string;
  orderCode?: string;
  file: Blob;
};

export type OrderData = {
  id: string;
  code: string;
  portfolio: string;
  clinic: string;
  user: string;
  accountId: string;
};

export type VideoFileWithUrl = VideoFile & {
  url: string;
};

export type CompositionProps = {
  resizingVideo: VideoSegment | null;
  videoSegments: VideoSegment[];
  hasCover: boolean;
  orderData: OrderData | null;
};

export type RenderRequest = {
  inputProps: CompositionProps;
  outName: string;
};

export type Request = {
  type: "success" | "error";
  data: unknown;
};

export type ProgressRequest = {
  bucketName: string;
  id: string;
};

export type ProgressResponse =
  | {
      type: "error";
      message: string;
    }
  | {
      type: "progress";
      progress: number;
    }
  | {
      type: "done";
      url: string;
      size: number;
    };
