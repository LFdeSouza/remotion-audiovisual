import "./app.css";
import { useAuth } from "./hooks/useAuth";
import { Navigate, Outlet, useLocation } from "react-router";
import { VideosProvider } from "./hooks/useVideo";
import Topbar from "./components/Topbar/Topbar";
import Sidebar from "./components/sidebar/Sidebar";
import Spinner from "./components/shared/spinner";

export default function RootLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Spinner />;
  }

  if (!user) {
    return <Navigate to={`/login${location.search}`} />;
  }

  return (
    <VideosProvider>
      <Topbar />
      <div className="flex h-full">
        <Sidebar />
        <Outlet />
      </div>
    </VideosProvider>
  );
}
