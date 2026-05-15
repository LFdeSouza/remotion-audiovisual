import { getRenderProgress } from "@remotion/lambda/client";
import { ActionFunction } from "react-router";
import { errorAsJson } from "./lib/return-error-as-json";
import { ProgressRequest, ProgressResponse } from "./remotion/schemata";
import { LAMBDA_FUNCTION_NAME, REGION } from "./remotion/constants.mjs";
import "dotenv/config";

export const action: ActionFunction = errorAsJson(
  async ({ request }): Promise<ProgressResponse> => {
    const body = (await request.json()) as ProgressRequest;

    const renderProgress = await getRenderProgress({
      renderId: body.id,
      bucketName: body.bucketName,
      functionName: LAMBDA_FUNCTION_NAME,
      region: REGION,
    });
    if (renderProgress.fatalErrorEncountered) {
      return {
        type: "error",
        message: renderProgress.errors[0].message,
      };
    }

    if (renderProgress.done) {
      return {
        type: "done",
        url: renderProgress.outputFile as string,
        size: renderProgress.outputSizeInBytes as number,
      };
    }

    return {
      type: "progress",
      progress: Math.max(0.03, renderProgress.overallProgress),
    };
  },
);
