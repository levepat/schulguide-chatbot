import { useT } from "../i18n/localeContext";
import styles from "./Header.module.css";
import { LanguageSelector } from "./LanguageSelector";

interface HeaderProps {
  onOpenSettings?: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  const t = useT();
  return (
    <header className={styles.header}>
      <span className={styles.logoBadge}>
        <img
          className={styles.logo}
          src={`${import.meta.env.BASE_URL}logo-spengergasse-white.png`}
          alt={t.logoAlt}
          width={350}
          height={112}
        />
      </span>
      <h1 className={styles.title}>{t.appTitle}</h1>
      <div className={styles.actions}>
        <LanguageSelector />
        {onOpenSettings && (
          <button type="button" className={styles.iconButton} onClick={onOpenSettings} aria-label={t.settingsButton}>
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6a.5.5 0 0 0 .1-.6l-2-3.5a.5.5 0 0 0-.6-.2l-2.5 1a7.3 7.3 0 0 0-1.7-1l-.4-2.6a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 0-.5.4l-.4 2.7a7.3 7.3 0 0 0-1.7 1l-2.5-1a.5.5 0 0 0-.6.2l-2 3.5a.5.5 0 0 0 .1.6L4.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6a.5.5 0 0 0-.1.6l2 3.5a.5.5 0 0 0 .6.2l2.5-1a7.3 7.3 0 0 0 1.7 1l.4 2.6a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.4l.4-2.7a7.3 7.3 0 0 0 1.7-1l2.5 1a.5.5 0 0 0 .6-.2l2-3.5a.5.5 0 0 0-.1-.6L19.4 13ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"
              />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
