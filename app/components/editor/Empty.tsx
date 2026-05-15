import { PlayIcon } from "lucide-react";

export default function EmptySkeleton() {
  return (
    <div className="relative h-full overflow-hidden rounded">
      <div className="flex h-2/3 w-full items-center justify-center bg-slate-800/60">
        <div className="h-9/12 w-[65%] rounded-lg bg-black" />
      </div>

      <div>
        <div className="mx-auto flex w-full items-center justify-center gap-2 pt-4">
          <button className="peer cursor-default rounded-full bg-white p-1.5">
            <PlayIcon className="h-5 w-5 fill-black stroke-1" />
          </button>
          <p className="text-xs text-white">00:00 | 00:00</p>
        </div>
        <p className="mx-auto w-fit p-10 text-gray-200">
          Selecione um vídeo nas suas gravações para iniciar a edição.
        </p>
      </div>
    </div>
  );
}
