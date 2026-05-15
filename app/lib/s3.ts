import { S3Client } from "@aws-sdk/client-s3";
import "dotenv/config";

export const s3 = new S3Client({
  region: process.env.REMOTION_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.REMOTION_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.REMOTION_AWS_SECRET_ACCESS_KEY!,
  },
});
