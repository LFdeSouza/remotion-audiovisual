import { LoaderCircleIcon } from "lucide-react";

export default function Spinner({ className }: { className?: string }) {
  return (
    <LoaderCircleIcon className={`animate-spin stroke-blue-600 ${className}`} />
  );
}
