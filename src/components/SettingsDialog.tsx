import { useEffect, useId, useRef, useState } from "react";
import { maskKey } from "../domain/keyFragment";
import { useT } from "../i18n/localeContext";
import buttons from "../styles/buttons.module.css";
import styles from "./SettingsDialog.module.css";
import { ShareKeyQr } from "./ShareKeyQr";

interface SettingsDialogProps {
  apiKey: string;
  onClose: () => void;
  onReplaceKey: () => void;
  onDeleteKey: () => void;
}

export function SettingsDialog({ apiKey, onClose, onReplaceKey, onDeleteKey }: SettingsDialogProps) {
  const t = useT();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [sharing, setSharing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId} onClose={onClose}>
      <div className={styles.head}>
        <h2 id={titleId} className={styles.title}>
          {t.settings.title}
        </h2>
        <button type="button" className={buttons.ghost} onClick={onClose}>
          {t.settings.close}
        </button>
      </div>

      <p className={styles.key}>
        <span>{t.settings.currentKey}: </span>
        <code>{maskKey(apiKey)}</code>
      </p>

      <div className={styles.actions}>
        <button
          type="button"
          className={buttons.secondary}
          aria-expanded={sharing}
          onClick={() => setSharing((current) => !current)}
        >
          {sharing ? t.settings.hideShare : t.settings.shareKey}
        </button>
        {sharing && <ShareKeyQr apiKey={apiKey} />}
        <button type="button" className={buttons.secondary} onClick={onReplaceKey}>
          {t.settings.replaceKey}
        </button>
        {confirmingDelete ? (
          <div className={styles.confirm} role="group" aria-label={t.settings.deleteKey}>
            <p className={styles.confirmText}>{t.settings.deleteConfirm}</p>
            <div className={styles.confirmButtons}>
              <button type="button" className={buttons.danger} onClick={onDeleteKey}>
                {t.settings.confirmDelete}
              </button>
              <button type="button" className={buttons.secondary} onClick={() => setConfirmingDelete(false)}>
                {t.settings.cancel}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className={buttons.danger} onClick={() => setConfirmingDelete(true)}>
            {t.settings.deleteKey}
          </button>
        )}
      </div>
    </dialog>
  );
}
