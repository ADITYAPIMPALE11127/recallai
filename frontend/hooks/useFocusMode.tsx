import { useLocalStorage } from "usehooks-ts";

interface UseFocusModeOptions {
  enabled?: boolean;
}

export const useFocusMode = ({ enabled = true }: UseFocusModeOptions = {}) => {
  const [focusMode, setFocusMode] = useLocalStorage<boolean>(
    "notion-focus-mode",
    false,
  );

  // Convex removed - using localStorage only
  // TODO: Add Django API integration if server-side persistence is needed

  const setFocusModeWrapper = (value: boolean) => {
    if (!enabled) return;
    setFocusMode(value);
  };

  return { focusMode, setFocusMode: setFocusModeWrapper };
};