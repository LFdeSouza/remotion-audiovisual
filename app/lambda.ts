import {
  getFunctions,
  getCompositionsOnLambda,
  deleteSite,
} from "@remotion/lambda";
import { getSites } from "@remotion/lambda/client";
import "dotenv/config";
import { SITE_NAME } from "./remotion/constants.mjs";

const functions = await getFunctions({
  region: "sa-east-1",
  compatibleOnly: true,
});
console.log(functions);

const { sites } = await getSites({
  region: "sa-east-1",
});
console.log(sites);

console.log("name", process.env.REMOTION_FUNCTION_NAME);
const compositions = await getCompositionsOnLambda({
  functionName: "remotion-render-4-0-448-mem2048mb-disk2048mb-120sec",
  inputProps: {},
  region: "sa-east-1",
  serveUrl: "telerison-audiovisual",
  envVariables: {},
});

console.log("compositions", compositions);

// const { sites, buckets } = await getSites({
//   region: "sa-east-1",
// });

// console.log(sites, buckets);
