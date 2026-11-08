import schoolInfo from "../../context/schulinfo.md?raw";
import systemPrompt from "./system-prompt.md?raw";

export function composeStaticPrefix(prompt: string, info: string): string {
  return prompt + "\n\n<school_info>\n" + info + "\n</school_info>\n";
}

export const STATIC_PREFIX = composeStaticPrefix(systemPrompt, schoolInfo);
