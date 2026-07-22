import { useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Modal } from "./ui/Modal";

interface Props {
  open: boolean;
  onCancel: () => void;
  onClose: (remember: boolean) => void;
  onHide: (remember: boolean) => void;
}

export function CloseActionDialog({ open, onCancel, onClose, onHide }: Props) {
  const { t } = useTranslation();
  const [remember, setRemember] = useState(false);

  const handleCancel = () => {
    setRemember(false);
    onCancel();
  };

  const handleClose = () => {
    onClose(remember);
    setRemember(false);
  };

  const handleHide = () => {
    onHide(remember);
    setRemember(false);
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      contentClassName="bg-surface border border-border rounded-panel w-full max-w-sm p-5 app-floating-edge"
    >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-semibold text-primary">
            {t("closeAction.title")}
          </h2>
          <button
            onClick={handleCancel}
            className="text-muted hover:text-secondary p-1 rounded transition-colors outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[13px] text-tertiary mb-4">{t("closeAction.message")}</p>

        <label className="flex items-center gap-2 mb-5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-3.5 h-3.5 accent-[rgb(var(--color-accent))]"
          />
          <span className="text-[13px] text-muted">{t("closeAction.remember")}</span>
        </label>

        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 rounded-control text-[13px] font-medium text-tertiary hover:text-secondary hover:bg-surface-hover transition-colors outline-none"
          >
            {t("closeAction.close")}
          </button>
          <button
            onClick={handleHide}
            className="px-3 py-1.5 rounded-control bg-accent-dark hover:bg-accent text-white text-[13px] font-medium transition-colors border border-accent-border outline-none"
          >
            {t("closeAction.hide")}
          </button>
        </div>
    </Modal>
  );
}
