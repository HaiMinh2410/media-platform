import React from "react";

interface ConfirmDialogProps {
  id: string;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmBtnClass?: string;
}

export function ConfirmDialog({
  id,
  title,
  description,
  onConfirm,
  confirmText = "Xóa",
  cancelText = "Hủy",
  confirmBtnClass = "btn-error",
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    if (typeof document !== "undefined") {
      const modal = document.getElementById(id) as HTMLDialogElement;
      modal?.close();
    }
  };

  return (
    <dialog id={id} className="modal modal-bottom sm:modal-middle">
      <div className="modal-box text-left p-6 border border-base-content/10 bg-base-100 rounded-lg shadow-xl">
        <h3 className="font-bold text-base-content font-brand mb-2">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-base-content/60 mb-6">
          {description}
        </p>
        <div className="modal-action mt-0">
          <form method="dialog" className="flex justify-end gap-2 w-full">
            {/* Nút Hủy tự động đóng dialog */}
            <button className="btn btn-soft btn-sm">
              {cancelText}
            </button>
            {/* Nút Xác nhận gọi callback */}
            <button
              type="button"
              onClick={handleConfirm}
              className={`btn btn-sm ${confirmBtnClass}`}
            >
              {confirmText}
            </button>
          </form>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button className="btn">close</button>
      </form>
    </dialog>
  );
}
