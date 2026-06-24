import { ActionFunction } from "react-router";
import {
  SITE_NAME,
  COMPOSITION_ID,
  REGION,
  LAMBDA_FUNCTION_NAME,
} from "./remotion/constants.mjs";
import { errorAsJson } from "./lib/return-error-as-json";
import { CompositionProps } from "./remotion/schemata";
import { renderMediaOnLambda } from "@remotion/lambda/client";

export const action: ActionFunction = errorAsJson(async ({ request }) => {
  const body = (await request.json()) as {
    outName: string;
    inputProps: CompositionProps;
  };
  const { inputProps, outName } = body;

  const { renderId, bucketName } = await renderMediaOnLambda({
    region: REGION,
    functionName: LAMBDA_FUNCTION_NAME,
    serveUrl: SITE_NAME,
    composition: COMPOSITION_ID,
    inputProps,
    codec: "h264",
    crf: 28,
    downloadBehavior: {
      type: "download",
      fileName: `${outName}.mp4`,
    },
    metadata: null,
    licenseKey: process.env.REMOTION_LICENCE,
  });

  return {
    renderId,
    bucketName,
    functionName: LAMBDA_FUNCTION_NAME,
    region: REGION,
  };
});
