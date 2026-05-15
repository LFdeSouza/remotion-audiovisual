import { useEffect, useRef, useState } from "react";

export function DropdownMenu() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  const updatePosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();

    setPosition({
      left: rect.left,
      top: rect.bottom,
    });
  };

  useEffect(() => {
    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, []);

  return (
    <>
      <button ref={buttonRef}>Open</button>

      <div
        style={{
          position: "fixed",
          left: position.left,
          top: position.top,
        }}
      >
        Menu
      </div>
    </>
  );
}
