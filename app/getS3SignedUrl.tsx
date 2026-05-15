import { PutObjectCommand } from "@aws-sdk/client-s3";
import { ActionFunction } from "react-router";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "./lib/s3";
import crypto from "crypto";
import { errorAsJson } from "./lib/return-error-as-json";
import "dotenv/config";
import { REGION } from "./remotion/constants.mjs";

export type UploadRouteResponse = {
  type: "success" | "error";
  data: { signedUrl: string; fileUrl: string }[]; //on success
  message: string; // on error
};

/**
 * Get signed url from S3.
 *
 * Renders happen on lambda functions in aws. Because the videos are saved on the client browser, render function has no way to access them
 * to perform the necessary work. Therefore, we need to send videos to a s3 bucked prior to rendering. This route authenticate the shared user
 * for telerison-audiovisual to aws and get a signed url so the client browser can send uploads directely to the s3 bucket. There is a policy
 * in the bucket that automatially deletes files older than 3 days.
 *
 * @param {string[]} videosToUpload - array containing the filename of the files to upload in order
 * @returns {{signedUrl:string, fileUrl:string}[]} - signedUrls to be used for uploading file to bucket, and fileUrl to access it after.
 */
export const action: ActionFunction = errorAsJson(async ({ request }) => {
  const { videosToUpload } = (await request.json()) as {
    videosToUpload: {
      filename: string;
    }[];
  };

  const urls = await Promise.all(
    videosToUpload.map(async (video) => {
      const key = `${crypto.randomUUID()}-${video.filename}`;
      const command = new PutObjectCommand({
        Bucket: process.env.UPLOAD_AWS_BUCKET!,
        ContentType: video.filename,
        Key: key,
      });
      //
      const signedUrl = await getSignedUrl(s3, command, {
        expiresIn: 300, // 5 minutes
      });
      const fileUrl = `https://${process.env.UPLOAD_AWS_BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
      return { signedUrl, fileUrl };
    }),
  );

  return urls;
});
