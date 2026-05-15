import { useMemo } from "react";
import { formatTime } from "~/utils/formatTime";

const Ruler = ({
  length,
  conversionFactor,
}: {
  length: number;
  conversionFactor: number;
}) => {
  const ticks = useMemo(() => {
    const ticks: React.ReactNode[] = [];
    for (let i = 0; i <= length; i++) {
      if (i % 10 !== 0) {
        continue;
      }
      // One major tick per minute
      const isMajorTick = i % 60 === 0;

      if (isMajorTick) {
        ticks.push(
          <div
            key={i}
            className="absolute top-0 h-5 w-[0.5px] bg-white opacity-50 select-none"
            style={{ left: `${i * conversionFactor}px` }}
          >
            <span className="absolute top-2 left-1 text-xs text-white">
              {formatTime(i)}
            </span>
          </div>,
        );
      } else {
        ticks.push(
          <div
            key={i}
            className="absolute top-0.5 h-1.5 w-[0.5px] bg-white opacity-50"
            style={{ left: i * conversionFactor }}
          />,
        );
      }
    }
    return ticks;
  }, [conversionFactor, length]);

  return (
    <div className="relative h-16 w-full border-t border-white select-none">
      {ticks}
    </div>
  );
};

export default Ruler;
