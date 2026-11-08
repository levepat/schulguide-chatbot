import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { readKeyFromHash } from "./domain/keyFragment";
import { LocaleProvider } from "./i18n/LocaleProvider";
import "./styles/global.css";

function consumeKeyFragment(): string | null {
  const { hash, pathname, search } = window.location;
  if (!hash) return null;
  history.replaceState(history.state, "", pathname + search);
  return readKeyFromHash(hash);
}

const fragmentKey = consumeKeyFragment();
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <LocaleProvider>
        <App fragmentKey={fragmentKey} />
      </LocaleProvider>
    </StrictMode>,
  );
}
