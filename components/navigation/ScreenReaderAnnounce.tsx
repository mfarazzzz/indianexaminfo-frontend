"use client";

import { useEffect, useState } from "react";

interface Props {
  message: string;
}

export function ScreenReaderAnnounce({ message }: Props) {
  const [announced, setAnnounced] = useState("");
  
  useEffect(() => {
    if (message) {
      setAnnounced(message);
      const timer = setTimeout(() => setAnnounced(""), 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {announced}
    </div>
  );
}
