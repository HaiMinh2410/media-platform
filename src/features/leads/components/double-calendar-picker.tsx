import { cn } from "@shared/lib";

import React from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface DoubleCalendarPickerProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  triggerClassName?: string;
}

const datePresets = [
  { value: "Hôm nay", label: "Hôm nay" },
  { value: "7 ngày qua", label: "7 ngày qua" },
  { value: "14 ngày qua", label: "14 ngày qua" },
  { value: "30 ngày qua", label: "30 ngày qua" },
  { value: "90 ngày qua", label: "90 ngày qua" },
  { value: "Tùy chỉnh", label: "Tùy chỉnh" },
];

export function DoubleCalendarPicker({
  selectedDate,
  onSelectDate,
  triggerClassName,
}: DoubleCalendarPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempDateFilter, setTempDateFilter] = React.useState(selectedDate);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // State quản lý tháng/năm hiển thị bắt đầu ở lịch bên trái (Tháng 5 là index 4)
  const [currentMonth, setCurrentMonth] = React.useState(4);
  const [currentYear, setCurrentYear] = React.useState(2026);

  // Sync temp state khi selectedDate prop thay đổi từ bên ngoài
  React.useEffect(() => {
    setTempDateFilter(selectedDate);
  }, [selectedDate]);

  // Đóng mở dropdown khi click outside
  React.useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Logic tiến/lùi tháng
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Xác định tháng/năm cho lịch trái và lịch phải
  const leftMonth = currentMonth;
  const leftYear = currentYear;

  let rightMonth = currentMonth + 1;
  let rightYear = currentYear;
  if (rightMonth > 11) {
    rightMonth = 0;
    rightYear = currentYear + 1;
  }

  // Label hiển thị Tháng/Năm
  const getMonthLabel = (month: number, year: number) => {
    return `Tháng ${month + 1} ${year}`;
  };

  // Ngày hôm nay tham chiếu mock của DB là 28/05/2026
  const referenceToday = new Date(2026, 4, 28);
  referenceToday.setHours(0, 0, 0, 0);

  // Hàm chuyển đổi filter sang khoảng ngày (start & end Date)
  const getRangeFromFilter = (
    filterVal: string,
  ): { start: Date; end: Date } | null => {
    const today = new Date(referenceToday);

    if (filterVal === "Hôm nay") {
      return { start: today, end: today };
    }
    if (filterVal === "7 ngày qua") {
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      const end = new Date(today);
      end.setDate(today.getDate() - 1); // 7 ngày trước ngày hôm nay
      return { start, end };
    }
    if (filterVal === "14 ngày qua") {
      const start = new Date(today);
      start.setDate(today.getDate() - 14);
      const end = new Date(today);
      end.setDate(today.getDate() - 1); // 14 ngày trước ngày hôm nay (từ 14 đến 27)
      return { start, end };
    }
    if (filterVal === "30 ngày qua") {
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      const end = new Date(today);
      end.setDate(today.getDate() - 1);
      return { start, end };
    }
    if (filterVal === "90 ngày qua") {
      const start = new Date(today);
      start.setDate(today.getDate() - 90);
      const end = new Date(today);
      end.setDate(today.getDate() - 1);
      return { start, end };
    }

    // Nếu filterVal là khoảng ngày dạng "DD/MM/YYYY - DD/MM/YYYY"
    if (filterVal.includes(" - ")) {
      const parts = filterVal.split(" - ");
      const pStart = parts[0].split("/");
      const pEnd = parts[1].split("/");
      return {
        start: new Date(
          parseInt(pStart[2]),
          parseInt(pStart[1]) - 1,
          parseInt(pStart[0]),
        ),
        end: new Date(
          parseInt(pEnd[2]),
          parseInt(pEnd[1]) - 1,
          parseInt(pEnd[0]),
        ),
      };
    }

    // Nếu filterVal là một ngày cụ thể (ví dụ: "28/05/2026")
    if (filterVal.includes("/")) {
      const parts = filterVal.split("/");
      if (parts.length === 3) {
        const d = new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0]),
        );
        return { start: d, end: d };
      }
    }

    return null;
  };

  const currentRange = getRangeFromFilter(tempDateFilter);

  // Nhãn hiển thị khoảng ngày thân thiện ở footer
  const getRangeLabel = (range: { start: Date; end: Date } | null) => {
    if (!range) return "";

    const formatSingle = (date: Date) => {
      return `${date.getDate()} Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
    };

    if (range.start.getTime() === range.end.getTime()) {
      return formatSingle(range.start);
    }

    return `${formatSingle(range.start)} - ${formatSingle(range.end)}`;
  };

  // Xác định trạng thái của từng ngày trên lịch để tô màu dải băng
  const getDayStatus = (
    d: number,
    m: number,
    y: number,
    range: { start: Date; end: Date } | null,
  ) => {
    if (!range) return { isStart: false, isEnd: false, isWithin: false };

    const current = new Date(y, m, d);
    current.setHours(0, 0, 0, 0);

    const startTime = range.start.getTime();
    const endTime = range.end.getTime();
    const currentTime = current.getTime();

    const isStart = currentTime === startTime;
    const isEnd = currentTime === endTime;
    const isWithin = currentTime > startTime && currentTime < endTime;

    return { isStart, isEnd, isWithin };
  };

  // Xử lý khi click vào một ngày cụ thể (Range Selection thông minh)
  const handleDayClick = (dayStr: string) => {
    // Nếu tempDateFilter đang là ngày bắt đầu đơn (chỉ chứa dấu "/" và không chứa dấu "-")
    if (tempDateFilter.includes("/") && !tempDateFilter.includes(" - ")) {
      const partsStart = tempDateFilter.split("/");
      const partsNew = dayStr.split("/");

      const dateStart = new Date(
        parseInt(partsStart[2]),
        parseInt(partsStart[1]) - 1,
        parseInt(partsStart[0]),
      );
      const dateNew = new Date(
        parseInt(partsNew[2]),
        parseInt(partsNew[1]) - 1,
        parseInt(partsNew[0]),
      );

      if (dateNew >= dateStart) {
        // Thiết lập khoảng ngày hoàn chỉnh
        setTempDateFilter(`${tempDateFilter} - ${dayStr}`);
      } else {
        // Đặt lại ngày bắt đầu mới
        setTempDateFilter(dayStr);
      }
    } else {
      // Thiết lập ngày bắt đầu đơn
      setTempDateFilter(dayStr);
    }
  };

  // Hàm kiểm định preset nào đang active
  const isPresetActive = (presetValue: string) => {
    if (presetValue === "Tùy chỉnh") {
      const standardPresets = [
        "Hôm nay",
        "7 ngày qua",
        "14 ngày qua",
        "30 ngày qua",
        "90 ngày qua",
      ];
      return !standardPresets.includes(tempDateFilter);
    }
    return tempDateFilter === presetValue;
  };

  // Hàm render ngày của một tháng bất kỳ
  const renderCalendarDays = (m: number, y: number) => {
    const totalDays = new Date(y, m + 1, 0).getDate();
    const firstDayIndex = new Date(y, m, 1).getDay(); // 0 = CN, 1 = T2...

    const emptySlots = Array.from({ length: firstDayIndex });
    const dayNumbers = Array.from({ length: totalDays }, (_, i) => i + 1);

    return (
      <>
        {emptySlots.map((_, i) => (
          <div key={`empty-${m}-${i}`} className="h-7 w-7" />
        ))}
        {dayNumbers.map((dayNum) => {
          const { isStart, isEnd, isWithin } = getDayStatus(
            dayNum,
            m,
            y,
            currentRange,
          );

          const formattedDate = `${dayNum < 10 ? "0" + dayNum : dayNum}/${m + 1 < 10 ? "0" + (m + 1) : m + 1}/${y}`;

          // Mốc ngày Hôm nay mẫu là 28/05/2026
          const isTodayMock = dayNum === 28 && m === 4 && y === 2026;

          return (
            <button
              key={`day-${m}-${dayNum}`}
              type="button"
              onClick={() => handleDayClick(formattedDate)}
              className={cn(
                "h-7 w-7 mx-auto flex items-center justify-center cursor-pointer font-medium font-mono transition-all duration-200 hover:scale-105 active:scale-90",
                // Nút bắt đầu hoặc kết thúc khoảng ngày (Xanh đậm, chữ trắng)
                (isStart || isEnd) &&
                  "bg-primary text-primary-content font-bold rounded-lg shadow-sm shadow-primary/20 scale-105 z-10",
                // Các ngày ở giữa khoảng ngày (Xanh nhạt, dải băng liền mạch)
                isWithin &&
                  "bg-primary/10 text-primary font-semibold rounded-none scale-y-[1.03]",
                // Trạng thái ngày bình thường
                !isStart &&
                  !isEnd &&
                  !isWithin &&
                  "text-base-content/80 hover:bg-base-200 rounded-full",
                // Highlight chữ màu xanh dương cho ngày hôm nay 28/05/2026 khi không được chọn trong khoảng
                isTodayMock &&
                  !isStart &&
                  !isEnd &&
                  !isWithin &&
                  "text-primary font-bold hover:bg-primary/10",
              )}
            >
              {dayNum}
            </button>
          );
        })}
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "dropdown dropdown-bottom dropdown-end",
        isOpen && "dropdown-open",
      )}
    >
      {/* Trigger Button */}
      <div
        role="button"
        className={triggerClassName || cn(
          "btn btn-soft btn-sm hover:bg-base-100",
          selectedDate !== "all" &&
            "border-primary text-primary bg-primary/5 font-bold shadow-3xs shadow-primary/5",
        )}
        onClick={() => {
          setIsOpen(!isOpen);
          setTempDateFilter(selectedDate);
        }}
      >
        <div className="flex items-center gap-1.5 truncate">
          <Calendar size={13} className="opacity-70 shrink-0" />
          <span className="truncate">
            {selectedDate === "all" ? "Chọn ngày" : selectedDate}
          </span>
        </div>
        <ChevronDown
          size={12}
          className="opacity-60 shrink-0 transition-transform duration-300"
          style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
        />
      </div>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="dropdown-content bg-soft rounded-lg border border-base-content/5 mt-2 flex flex-row overflow-hidden z-150 w-[640px] max-w-[95vw] select-none text-left animate-fade-in">
          {/* Cột trái: Presets chọn nhanh */}
          <div className="shrink-0 border-r border-base-content/5 p-2 px-2.5 flex flex-col gap-1.5 bg-base-100/20 justify-center">
            {datePresets.map((preset) => {
              const isActive = isPresetActive(preset.value);
              return (
                <label
                  key={preset.value}
                  onClick={() => {
                    if (preset.value === "Tùy chỉnh") {
                      // Nếu bấm Tùy chỉnh, mặc định highlight ngày hôm nay mẫu là 28/05/2026
                      setTempDateFilter("28/05/2026");
                    } else {
                      setTempDateFilter(preset.value);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-1.5 hover:bg-base-100/50 dark:hover:bg-base-800/40 rounded-md cursor-pointer group select-none transition-colors"
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border border-base-content/5 flex items-center justify-center shrink-0 transition-all duration-200 active:scale-90",
                      isActive
                        ? "border-primary bg-base-100"
                        : "border-base-content/20 bg-base-100 group-hover:border-base-content/40",
                    )}
                  >
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-primary animate-scale-up" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm transition-colors duration-200",
                      isActive
                        ? "text-primary"
                        : "text-base-content/70 group-hover:text-base-content",
                    )}
                  >
                    {preset.label}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Cột phải: Lịch đôi (Double Calendar) */}
          <div className="flex-1 p-3.5 flex flex-col">
            {/* Header Lịch */}
            <div className="flex items-center justify-between w-full text-base-content relative mb-0.5">
              {/* Nút quay lại trái */}
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-base-200 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 shrink-0"
              >
                <ChevronLeft
                  size={15}
                  className="text-base-content/50 hover:text-base-content"
                />
              </button>

              {/* Nhãn 2 tháng căn giữa tương ứng trên 2 lịch */}
              <div className="flex-1 grid grid-cols-2 text-center text-sm text-base-content">
                <span>{getMonthLabel(leftMonth, leftYear)}</span>
                <span>{getMonthLabel(rightMonth, rightYear)}</span>
              </div>

              {/* Nút tiến phải */}
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-base-200 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 shrink-0"
              >
                <ChevronRight
                  size={15}
                  className="text-base-content/50 hover:text-base-content"
                />
              </button>
            </div>

            {/* Lưới lịch 2 tháng */}
            <div className="grid grid-cols-2 gap-6 w-full">
              {/* Lịch Tháng bên trái */}
              <div className="flex flex-col gap-2">
                {/* Thứ trong tuần */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-base-content/40 tracking-wide font-mono pb-1 border-b border-base-content/5">
                  {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
                    <div
                      key={d}
                      className="h-5 flex items-center justify-center"
                    >
                      {d}
                    </div>
                  ))}
                </div>
                {/* Lưới ngày */}
                <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-base-content/85">
                  {renderCalendarDays(leftMonth, leftYear)}
                </div>
              </div>

              {/* Lịch Tháng bên phải */}
              <div className="flex flex-col gap-2">
                {/* Thứ trong tuần */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-base-content/40 tracking-wide font-mono pb-1 border-b border-base-content/5">
                  {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
                    <div
                      key={d}
                      className="h-5 flex items-center justify-center"
                    >
                      {d}
                    </div>
                  ))}
                </div>
                {/* Lưới ngày */}
                <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-base-content/85">
                  {renderCalendarDays(rightMonth, rightYear)}
                </div>
              </div>
            </div>

            {/* Footer Lịch */}
            <div className="flex items-center justify-between border-t border-base-content/5 pt-1.5 mt-1.5 font-sans">
              <div className="flex flex-col gap-0.5 text-left">
                {currentRange && (
                  <span className="text-2xs font-bold text-base-content font-brand tracking-tight animate-fade-in leading-none">
                    {getRangeLabel(currentRange)}
                  </span>
                )}
                <span className="text-xs text-base-content/40 leading-none tracking-wide">
                  Ngày hiển thị theo Giờ Việt Nam
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setTempDateFilter(selectedDate);
                    setIsOpen(false);
                  }}
                  className="btn btn-active btn-sm rounded-full"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectDate(tempDateFilter);
                    setIsOpen(false);
                  }}
                  className="btn btn-active btn-primary btn-sm rounded-full"
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
