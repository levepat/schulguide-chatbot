import { useCallback, useEffect, useState } from "react";
import { ChatScreen } from "./components/ChatScreen";
import { Header } from "./components/Header";
import { SettingsDialog } from "./components/SettingsDialog";
import { SetupScreen } from "./components/SetupScreen";
import { useApiKey } from "./hooks/useApiKey";

interface AppProps {
  fragmentKey: string | null;
}

export function App({ fragmentKey }: AppProps) {
  const { apiKey, checking, problem, submitKey, clearKey } = useApiKey();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [replacing, setReplacing] = useState(false);

  useEffect(() => {
    if (!fragmentKey) return;
    let active = true;
    void submitKey(fragmentKey).then((ok) => {
      if (active && !ok) setReplacing(true);
    });
    return () => {
      active = false;
    };
  }, [fragmentKey, submitKey]);

  const onInvalidKey = useCallback(() => clearKey("invalidKey"), [clearKey]);

  const onSubmitKey = async (key: string) => {
    if (await submitKey(key)) setReplacing(false);
  };

  const showSetup = apiKey === null || replacing;

  return (
    <>
      <Header onOpenSettings={showSetup ? undefined : () => setSettingsOpen(true)} />
      {showSetup ? (
        <SetupScreen
          checking={checking}
          problem={problem}
          onSubmit={(key) => void onSubmitKey(key)}
          onCancel={replacing && apiKey !== null ? () => setReplacing(false) : undefined}
        />
      ) : (
        <ChatScreen key={apiKey} apiKey={apiKey} onInvalidKey={onInvalidKey} />
      )}
      {settingsOpen && apiKey !== null && (
        <SettingsDialog
          apiKey={apiKey}
          onClose={() => setSettingsOpen(false)}
          onReplaceKey={() => {
            setSettingsOpen(false);
            setReplacing(true);
          }}
          onDeleteKey={() => {
            setSettingsOpen(false);
            clearKey();
          }}
        />
      )}
    </>
  );
}
