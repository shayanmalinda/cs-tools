import { useCallback, useRef, useState, type ReactNode } from "react";
import { SnackbarContext, type SnackbarQueueItem } from "./SnackbarContext";
import { Snackbar } from "@components/core";

export default function SnackbarProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SnackbarQueueItem[]>([]);
  const [open, setOpen] = useState(false);

  const enqueue = useCallback((item: SnackbarQueueItem) => {
    setItems((prev) => [...prev, item]);
    setOpen(true);
  }, []);

  const dequeue = useCallback(() => {
    setItems((prev) => prev.slice(1));
  }, []);

  const currentRef = useRef<SnackbarQueueItem | undefined>(undefined);

  if (items.length > 0) {
    currentRef.current = items[0];
  }

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      dequeue();
      if (items.length > 1) setOpen(true);
    }, 500);
  };

  return (
    <SnackbarContext.Provider value={{ queue: items, enqueue, dequeue }}>
      <Snackbar
        open={open}
        message={currentRef.current?.message ?? ""}
        severity={currentRef.current?.severity ?? "info"}
        onClose={handleClose}
      />
      {children}
    </SnackbarContext.Provider>
  );
}
