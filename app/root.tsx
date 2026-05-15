import {
  Links,
  Meta,
  MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import "./app.css";
import { Toaster } from "sonner";
import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import { AuthProvider } from "./hooks/useAuth";

export const meta: MetaFunction = () => {
  return [
    {
      title: "Telerison audiovisual",
    },
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { property: "og:title", content: "Remotion + React Router" },
  ];
};
export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="bg-slate-900 inter">
        <Toaster
          position="top-center"
          toastOptions={{ style: { background: "#07102a", color: "white" } }}
          icons={{
            success: (
              <CircleCheckIcon className="h-7 w-7 fill-cyan-600 stroke-black" />
            ),
            error: <CircleAlertIcon className="fill-red-500 stroke-black" />,
          }}
        />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
