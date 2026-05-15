import { LoaderCircleIcon } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";

export default function Editor() {
  const [ClientEditor, setClientEditor] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("./Editor.client").then((mod) => {
      if (!cancelled) {
        setClientEditor(() => mod.default);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ClientEditor) {
    return (
      <div className="flex w-full items-center justify-center">
        <LoaderCircleIcon className="spinner" />
      </div>
    );
  }

  return <ClientEditor />;
}
