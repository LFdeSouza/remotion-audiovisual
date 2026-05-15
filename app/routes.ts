import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  index("./home.tsx"),
  route("/login", "./components/login/login.tsx"),
  layout("./private.tsx", [
    route("/recorder", "./components/recorder/recorder.tsx"),
    route("/editor", "./components/editor/Editor.tsx"),
    route("/myVideos", "./components/myVideos/myVideos.tsx"),
  ]),
  route("/api/lambda/progress", "./progress.tsx"),
  route("/api/lambda/render", "./render.tsx"),
  route("/api/log", "./log.tsx"),
  route("/api/getS3SignedUrl", "./getS3SignedUrl.tsx"),
  route("*", "./notFound.tsx"),
] satisfies RouteConfig;
