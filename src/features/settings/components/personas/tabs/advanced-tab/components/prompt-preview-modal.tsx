import * as React from "react";
import { X, Loader2, Mars, Venus } from "lucide-react";
import { highlightPromptVariables } from "../advanced-tab.helpers";

interface PromptPreviewModalProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  isOverrideActive: boolean;
  previewCustomerGender: "male" | "female" | null;
  isPreviewLoading: boolean;
  diffResult: {
    diffA: { text: string; type: "normal" | "removed" }[];
    diffB: { text: string; type: "normal" | "added" }[];
  };
  previewPrompt: string;
  originalPrompt: string;
  leftScrollRef: React.RefObject<HTMLDivElement | null>;
  rightScrollRef: React.RefObject<HTMLDivElement | null>;
  handleLeftScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  handleRightScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  handleGenderChange: (gender: "male" | "female") => void;
}

export function PromptPreviewModal({
  dialogRef,
  isOverrideActive,
  previewCustomerGender,
  isPreviewLoading,
  diffResult,
  previewPrompt,
  originalPrompt,
  leftScrollRef,
  rightScrollRef,
  handleLeftScroll,
  handleRightScroll,
  handleGenderChange,
}: PromptPreviewModalProps) {
  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box w-screen max-w-none h-screen max-h-none rounded-none m-0 bg-base-100 border-none flex flex-col p-6">
        <div className="flex justify-between items-center border-b border-base-content/5 pb-3">
          <h3 className="font-bold text-xl flex items-center gap-2">
            Xem trước & So sánh System Prompt (Diff)
          </h3>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="btn btn-sm btn-circle btn-ghost"
          >
            <X size={20} />
          </button>
        </div>

        {/* Chọn giới tính khách hàng mockup */}
        <div className="flex items-center gap-3 py-2 border-b border-base-content/5">
          <span className="text-base-content/60">Giả lập giới tính Fan:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleGenderChange("male")}
              className={`btn btn-sm rounded-full gap-1.5 ${
                previewCustomerGender === "male"
                  ? "btn-primary text-primary-content"
                  : "btn-ghost border border-base-content/10"
              }`}
            >
              <Mars className="size-4" /> Khách là Nam
            </button>
            <button
              type="button"
              onClick={() => handleGenderChange("female")}
              className={`btn btn-sm rounded-full gap-1.5 ${
                previewCustomerGender === "female"
                  ? "btn-primary text-primary-content"
                  : "btn-ghost border border-base-content/10"
              }`}
            >
              <Venus className="size-4" /> Khách là Nữ
            </button>
          </div>
        </div>

        {isPreviewLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 flex-1">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="text-sm text-base-content/60 font-medium">
              Đang lắp ráp & so sánh System Prompt...
            </span>
          </div>
        ) : isOverrideActive ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 flex-1 min-h-0 overflow-hidden mt-2">
            {/* Cột trái: Original System Prompt */}
            <div className="flex flex-col h-full border-r border-base-content/10 pr-6 overflow-hidden">
              <div className="text-sm text-base-content/80 mb-2 tracking-wide">
                Original System Prompt (Mặc định)
              </div>
              <div
                ref={leftScrollRef}
                onScroll={handleLeftScroll}
                className="flex-1 overflow-y-auto pr-1"
              >
                <pre className="text-sm whitespace-pre-wrap leading-relaxed text-base-content font-mono">
                  {diffResult.diffA.map((line, idx) => (
                    <div
                      key={idx}
                      className={`min-h-5 ${
                        line.type === "removed"
                          ? "bg-error/10 text-error px-1 border-l-2 border-error font-medium"
                          : "text-base-content/60"
                      }`}
                    >
                      {line.text || " "}
                    </div>
                  ))}
                </pre>
              </div>
            </div>

            {/* Cột phải: Compiled Current Prompt */}
            <div className="flex flex-col h-full pl-6 overflow-hidden">
              <div className="text-sm text-base-content/80 mb-2 tracking-wide">
                Compiled Current Prompt (Đã tùy chỉnh)
              </div>
              <div
                ref={rightScrollRef}
                onScroll={handleRightScroll}
                className="flex-1 overflow-y-auto pr-1"
              >
                <pre className="text-sm whitespace-pre-wrap leading-relaxed text-base-content font-mono">
                  {diffResult.diffB.map((line, idx) => (
                    <div
                      key={idx}
                      className={`min-h-5 ${
                        line.type === "added"
                          ? "bg-success/10 text-success px-1 border-l-2 border-success font-medium"
                          : "text-base-content"
                      }`}
                    >
                      {line.text || " "}
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          /* Mode riêng chỉ coi chứ không so sánh */
          <div className="flex flex-col h-full overflow-hidden mt-2 max-w-4xl mx-auto w-full">
            <div className="text-sm text-base-content/80 mb-2 tracking-wide font-semibold">
              System Prompt Mặc định của Hệ thống
            </div>
            <div className="flex-1 overflow-y-auto pr-1 bg-soft/50 p-5 rounded-xl">
              <pre className="text-sm whitespace-pre-wrap leading-relaxed text-base-content/90 font-mono">
                {highlightPromptVariables(previewPrompt || originalPrompt)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
