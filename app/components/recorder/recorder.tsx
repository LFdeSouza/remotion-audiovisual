import { LoaderCircleIcon } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";

export default function Recorder() {
  const [ClientRecorder, setClientRecorder] = useState<ComponentType | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    import("./recorder.client").then((mod) => {
      if (!cancelled) {
        setClientRecorder(() => mod.default);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ClientRecorder) {
    return (
      <div className="flex w-full items-center justify-center">
        <LoaderCircleIcon className="spinner" />
      </div>
    );
  }

  return <ClientRecorder />;
}
