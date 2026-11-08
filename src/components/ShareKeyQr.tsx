import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { buildShareUrl } from "../domain/keyFragment";
import { useT } from "../i18n/localeContext";
import styles from "./ShareKeyQr.module.css";

interface ShareKeyQrProps {
  apiKey: string;
}

export function ShareKeyQr({ apiKey }: ShareKeyQrProps) {
  const t = useT();
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = buildShareUrl(window.location.origin, import.meta.env.BASE_URL, apiKey);
    QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 2, width: 280 })
      .then((generated) => {
        if (!cancelled) setDataUrl(generated);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  return (
    <figure className={styles.figure}>
      {dataUrl && <img className={styles.qr} src={dataUrl} alt={t.settings.qrAlt} width={280} height={280} />}
      <figcaption className={styles.hint}>{t.settings.shareHint}</figcaption>
    </figure>
  );
}
