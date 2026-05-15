import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function Tooltip({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current || !visible) {
      return;
    }

    const rect = ref.current.getBoundingClientRect();
    const top = rect.top;
    const left = rect.left + rect.width / 2;

    setCoords({ top, left });
  }, [visible]);

  return (
    <>
      <div
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        ref={ref}
        className="relative"
      >
        {children}
      </div>
      {visible &&
        createPortal(
          <p
            style={{
              left: coords.left,
              top: coords.top,
              transform: "translate(-50%, -100%)",
              zIndex: 10000,
            }}
            className="absolute bottom-4 right-0 h-7 w-fit rounded border border-slate-600 bg-slate-700 p-1 text-xs text-white"
          >
            {text}
          </p>,
          document.body,
        )}
    </>
  );
}
