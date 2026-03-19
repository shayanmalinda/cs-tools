import { useState } from "react";
import { LoaderContext } from "./LoaderContext";
import { Backdrop, CircularProgress } from "@wso2/oxygen-ui";

export default function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <LoaderContext.Provider value={{ loading, setLoading }}>
      {children}

      <Backdrop
        open={loading}
        sx={{
          color: "primary.contrastText",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </LoaderContext.Provider>
  );
}
