import styles from "./BotAvatar.module.css";

interface BotAvatarProps {
  size?: "small" | "large";
}

export function BotAvatar({ size = "small" }: BotAvatarProps) {
  return (
    <span className={`${styles.avatar} ${size === "large" ? styles.large : ""}`} aria-hidden="true">
      <img className={styles.star} src={`${import.meta.env.BASE_URL}favicon.png`} alt="" width={64} height={64} />
    </span>
  );
}
