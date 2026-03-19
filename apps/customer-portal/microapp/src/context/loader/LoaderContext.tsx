import { createContext } from "react";

export type LoaderContextType = {
  loading: boolean;
  setLoading: (state: boolean) => void;
};

export const LoaderContext = createContext<LoaderContextType | null>(null);
