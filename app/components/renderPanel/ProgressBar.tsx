import React, { useMemo } from "react";

export const ProgressBar: React.FC<{
  progress: number;
}> = ({ progress }) => {
  const fill: React.CSSProperties = useMemo(() => {
    return {
      width: `${progress * 100}%`,
    };
  }, [progress]);

  return (
    <div className="mt-2.5 mb-6 w-full rounded-md bg-transparent">
      <p>Progresso:</p>
      <div className="w-full rounded-lg bg-gray-950">
        <div
          className="h-3.5 animate-pulse rounded-md bg-blue-700 transition-all duration-100 ease-in-out"
          style={fill}
        ></div>
      </div>
    </div>
  );
};
