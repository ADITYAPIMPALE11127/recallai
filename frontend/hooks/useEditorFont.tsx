import { useLocalStorage } from "usehooks-ts";

export type EditorFont = "default" | "Lora" | "JetBrains Mono";

interface UseEditorFontOptions {
  enabled?: boolean;
}

export const useEditorFont = ({ enabled = true }: UseEditorFontOptions) => {
  const [editorFont, setEditorFont] = useLocalStorage<EditorFont>(
    "zotion-editor-font",
    "default",
  );

  // Convex removed - using localStorage only
  // TODO: Add Django API integration if server-side persistence is needed

  const isFontLoading = false; // No async loading with localStorage

  return { editorFont, setEditorFont, isFontLoading };
};