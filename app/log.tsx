import { ActionFunction } from "react-router";
import { errorAsJson } from "./lib/return-error-as-json";

export const action: ActionFunction = errorAsJson(async () => {
  console.log("should run on server");
  return "test";
});
