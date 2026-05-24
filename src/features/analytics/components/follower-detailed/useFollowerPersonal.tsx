import React from "react";
import { Check, AlertTriangle } from "lucide-react";
import {
  translateCountry,
  topCountryLabelIsVN,
} from "./follower-persona-utils";

interface DemographicItem {
  name: string;
  value: number;
}

const INDEX_TO_TIME_STR: Record<number, string> = {
  0: "12:00 (Nửa đêm)",
  1: "03:00 (Rạng sáng)",
  2: "06:00 (Sáng sớm)",
  3: "09:00 (Sáng)",
  4: "12:00 (Trưa)",
  5: "03:00 (Chiều)",
  6: "06:00 (Chiều tối)",
  7: "09:00 (Tối)",
};

function getPostingTime45MinBefore(index: number): string {
  const hour = index * 3;
  let targetHour = hour - 1;
  if (targetHour < 0) targetHour += 24;
  const targetMin = 15;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(targetHour)}:${pad(targetMin)}`;
}

export interface useFollowerPersonalProps {
  followersCount: number;
  demographics: {
    age: DemographicItem[];
    city: DemographicItem[];
    country: DemographicItem[];
    gender: DemographicItem[];
  };
  activeTimes: Record<string, number[]> | null;
}

export function useFollowerPersonal({
  followersCount,
  demographics,
  activeTimes,
}: useFollowerPersonalProps) {
  // ==========================================
  // I. DỮ LIỆU NỀN TẢNG & XỬ LÝ SỐ LIỆU ĐỘNG
  // ==========================================

  // 1. Phân tích Giới tính và Tỷ lệ (%)
  const genderData = demographics?.gender || [];
  const totalGender = genderData.reduce((sum, g) => sum + g.value, 0) || 1;

  const maleItem = genderData.find((g) => {
    const name = g.name.toLowerCase();
    return name.includes("male") || name === "m" || name.includes("nam");
  });
  const femaleItem = genderData.find((g) => {
    const name = g.name.toLowerCase();
    return name.includes("female") || name === "f" || name.includes("nữ");
  });

  const maleValue = maleItem ? maleItem.value : 0;
  const femaleValue = femaleItem ? femaleItem.value : 0;
  const otherValue = Math.max(0, totalGender - maleValue - femaleValue);

  const malePct = Math.round((maleValue / totalGender) * 100);
  const femalePct = Math.round((femaleValue / totalGender) * 100);
  const otherPct = Math.round((otherValue / totalGender) * 100);

  const topGender = genderData[0];
  const genderPct = topGender
    ? Math.round((topGender.value / totalGender) * 100)
    : 71;

  let genderLabel = "Nam giới";
  if (topGender) {
    const lowerName = topGender.name.toLowerCase();
    if (
      lowerName === "f" ||
      lowerName.includes("female") ||
      lowerName.includes("nữ")
    ) {
      genderLabel = "Nữ giới";
    } else if (
      lowerName === "m" ||
      lowerName.includes("male") ||
      lowerName.includes("nam")
    ) {
      genderLabel = "Nam giới";
    } else {
      genderLabel = "Khán giả";
    }
  }

  // 2. Phân tích Độ tuổi hàng đầu (Top Age Group) & Gen Z / Cận đi làm
  const ageData = demographics?.age || [];
  const totalAge = ageData.reduce((sum, a) => sum + a.value, 0) || 1;
  const topAge = ageData[0];
  const agePct = topAge ? Math.round((topAge.value / totalAge) * 100) : 41;
  const ageLabel = topAge ? `nhóm ${topAge.name}` : "nhóm 25-34";

  const age18to24Item = ageData.find((a) => a.name.includes("18-24"));
  const age18to24Pct = age18to24Item
    ? Math.round((age18to24Item.value / totalAge) * 100)
    : 0;
  const isGenZInstagram = age18to24Pct > 40;

  const age25to34 = ageData.find((a) => a.name.includes("25-34"))?.value || 0;
  const age35to44 = ageData.find((a) => a.name.includes("35-44"))?.value || 0;
  const pct25to44 = Math.round(((age25to34 + age35to44) / totalAge) * 100);
  const isAdultAudience = pct25to44 > 60;

  // 3. Phân tích Địa lý & Cân bằng đa quốc gia
  const countryData = demographics?.country || [];
  const topCountry = countryData[0];
  const totalCountry = countryData.reduce((sum, c) => sum + c.value, 0) || 1;
  const countryPct = topCountry
    ? Math.round((topCountry.value / totalCountry) * 100)
    : 32;
  const countryLabel = topCountry
    ? translateCountry(topCountry.name)
    : "Việt Nam";

  const topCountryPct = countryData[0]
    ? Math.round((countryData[0].value / totalCountry) * 100)
    : 0;
  const nextCountriesValue = countryData
    .slice(1, 5)
    .reduce((sum, c) => sum + c.value, 0);
  const nextCountriesPct = Math.round(
    (nextCountriesValue / totalCountry) * 100,
  );

  // Phân tầng ngưỡng quốc tế của IG
  let geoClassification = "nội địa";
  if (topCountryPct < 40) {
    geoClassification = "quốc tế phân tán (không có thị trường chủ đạo)";
  } else if (topCountryPct >= 40 && topCountryPct <= 60) {
    geoClassification = "đa quốc gia (có thị trường neo chính)";
  } else {
    geoClassification = "thị trường nội địa tập trung rất cao";
  }
  const isMultiNational = topCountryPct < 55 && nextCountriesPct > 30;

  // 4. Phân tích Nhịp sinh học & Nhận diện Đỉnh kép (Multi-peak)
  const TIME_LABELS = [
    "00:00",
    "03:00",
    "06:00",
    "09:00",
    "12:00",
    "15:00",
    "18:00",
    "21:00",
  ];
  const hourlyTotals = [0, 0, 0, 0, 0, 0, 0, 0];

  if (activeTimes) {
    Object.keys(activeTimes).forEach((day) => {
      const dayData = activeTimes[day] || [];
      dayData.forEach((val, idx) => {
        if (idx < 8) {
          hourlyTotals[idx] += val;
        }
      });
    });
  }

  // Tìm Đỉnh chính (Max_Y)
  let peakIndex = 7; // Mặc định 9 PM
  let maxVal = 0;
  hourlyTotals.forEach((val, idx) => {
    if (val > maxVal) {
      maxVal = val;
      peakIndex = idx;
    }
  });
  const peakHourLabel = TIME_LABELS[peakIndex];

  // Logic Cú đêm (isNightOwl) theo dải range: Đỉnh thuộc [21:00 - 5:00] (Tương ứng với 12 AM, 3 AM hoặc 9 PM)
  const isNightOwl = peakIndex === 0 || peakIndex === 1 || peakIndex === 7;

  // Nhận diện Đỉnh kép (Multi-peak)
  const peakValue = hourlyTotals[peakIndex];
  let secondPeakIndex = -1;
  let secondPeakValue = 0;

  hourlyTotals.forEach((val, idx) => {
    // Bỏ qua đỉnh chính và các index kề cận vòng tròn (độ dài mảng 8) để tìm đỉnh phụ độc lập
    const isAdjacent =
      idx === peakIndex ||
      idx === (peakIndex + 1) % 8 ||
      idx === (peakIndex - 1 + 8) % 8;
    if (!isAdjacent && val > secondPeakValue) {
      secondPeakValue = val;
      secondPeakIndex = idx;
    }
  });

  const isMultiPeak = secondPeakValue > 0.7 * peakValue;
  const secondPeakHourLabel = TIME_LABELS[secondPeakIndex];

  // 5. Chuẩn hóa dữ liệu 4 đỉnh để vẽ biểu đồ Radar
  const radarCountryPct = Math.min(100, countryPct);
  const radarAgePct = Math.min(100, agePct);
  const radarGenderPct = Math.min(100, genderPct);

  const personaData = [
    {
      subject: `Địa lý (${topCountry?.name || "VN"})`,
      value: radarCountryPct,
      display: `${radarCountryPct}% tại ${countryLabel}`,
    },
    {
      subject: `Độ tuổi (${topAge?.name || "25-34"})`,
      value: radarAgePct,
      display: `${radarAgePct}% thuộc ${ageLabel}`,
    },
    {
      subject: `Giới tính (${genderLabel === "Nam giới" ? "Nam" : genderLabel === "Nữ giới" ? "Nữ" : "Khác"})`,
      value: radarGenderPct,
      display: `${radarGenderPct}% ${genderLabel.toLowerCase()}`,
    },
    {
      subject: `Giờ vàng (${peakHourLabel})`,
      value: 100,
      display: `Hoạt động đỉnh lúc ${peakHourLabel}`,
    },
  ];

  // ==========================================
  // II. BỘ ENGINE PHÂN TÍCH TỰ ĐỘNG (NO HARDCODE)
  // ==========================================

  // 1. Audience Profiling Engine & Instagram Calibration

  // A. Giới tính (Định nghĩa dưới dạng React.ReactNode để bôi đậm từ khóa)
  let genderTag: React.ReactNode = "";
  if (malePct > 65) {
    genderTag = (
      <span>
        cộng đồng <strong className="text-base-content font-black">nam giới chiếm ưu thế tuyệt đối</strong> trên Instagram
      </span>
    );
  } else if (malePct >= 50 && malePct <= 65) {
    genderTag = (
      <span>
        cộng đồng thiên về <strong className="text-base-content font-black">nam giới</strong> (tín hiệu nổi bật trên IG)
      </span>
    );
  } else if (femalePct > 65) {
    genderTag = (
      <span>
        cộng đồng <strong className="text-base-content font-black">nữ giới chiếm ưu thế tuyệt đối</strong> trên Instagram
      </span>
    );
  } else if (femalePct >= 50 && femalePct <= 65) {
    genderTag = (
      <span>
        cộng đồng thiên về <strong className="text-base-content font-black">nữ giới</strong> (bám sát baseline IG)
      </span>
    );
  } else {
    genderTag = "khán giả phân bổ cân bằng giới tính trên Instagram";
  }

  // B. Xử lý ẩn danh / Khác (otherPct)
  let otherTag: React.ReactNode = "";
  let isGenderDataReliable = true;
  if (otherPct > 40) {
    otherTag = (
      <span>
        Cảnh báo: Dữ liệu giới tính bị loãng nghiêm trọng (tài khoản không khai báo giới tính chiếm tới <strong className="text-base-content font-black">{otherPct}%</strong>).
      </span>
    );
    isGenderDataReliable = false;
  } else if (otherPct > 20) {
    otherTag = (
      <span>
        Có sự hiện diện đáng kể của <strong className="text-base-content font-black">tài khoản Business</strong> hoặc người dùng quốc tế ẩn giới tính (<strong className="text-base-content font-black">{otherPct}%</strong>).
      </span>
    );
  }

  // C. Độ tuổi (Gen Z vs Adult và Fallback động)
  let ageTag: React.ReactNode = "";
  if (isGenZInstagram) {
    ageTag = (
      <span>
        tệp <strong className="text-base-content font-black">Gen Z thuần Instagram</strong> (nhóm <strong className="text-base-content font-black">18-24</strong> chiếm tỷ lệ cực kỳ lớn &gt;40%)
      </span>
    );
  } else if (isAdultAudience) {
    ageTag = (
      <span>
        tập khách hàng trưởng thành, đi làm, có thu nhập ổn định (<strong className="text-base-content font-black">25-44 tuổi</strong>)
      </span>
    );
  } else {
    // FALLBACK ĐỘNG: Lấy top 2 độ tuổi cao nhất
    const sortedAge = [...ageData].sort((a, b) => b.value - a.value);
    const top1Age = sortedAge[0]?.name || "18-24";
    const top2Age = sortedAge[1]?.name || "25-34";

    if (top1Age.includes("18-24") && top2Age.includes("25-34")) {
      ageTag = "tệp người trẻ và nhân viên văn phòng trẻ tuổi";
    } else if (top1Age.includes("13-17") && top2Age.includes("18-24")) {
      ageTag = "tệp học sinh - sinh viên và người trẻ tuổi năng động";
    } else {
      ageTag = (
        <span>
          tập trung vào phân khúc khán giả thuộc nhóm tuổi <strong className="text-base-content font-black">{top1Age} &amp; {top2Age}</strong>
        </span>
      );
    }
  }

  // D. Kết luận Output Persona Headline (Dạng Sentence Case chuẩn tiếng Việt)
  let personaHeadline = `${isGenZInstagram ? "Tệp Gen Z Instagram" : isAdultAudience ? "Khán giả trưởng thành" : "Khán giả trẻ tuổi"}`;
  if (malePct > 65) {
    personaHeadline += ", nam giới ưu thế";
  } else if (femalePct > 65) {
    personaHeadline += ", nữ giới ưu thế";
  } else {
    personaHeadline += ", đa dạng giới tính";
  }

  if (isMultiNational) {
    personaHeadline += `, phân bố đa quốc gia Đông Nam Á`;
  } else {
    personaHeadline += `, tập trung nội địa`;
  }

  if (otherPct > 20 && otherPct <= 40) {
    personaHeadline += ` (Chứa tệp Business)`;
  } else if (otherPct > 40) {
    personaHeadline += ` (Dữ liệu phân tán)`;
  }

  // 2. Behavioral Insight Engine & Nhịp sinh học
  let behaviorLabel = "";
  if (isMultiPeak) {
    behaviorLabel = `Khán giả 2 pha hoạt động (Khung giờ đỉnh: ${peakHourLabel} & ${secondPeakHourLabel})`;
  } else if (isNightOwl) {
    behaviorLabel = "Hoạt động xuyên đêm (Đỉnh điểm từ 00:00 – 06:00)";
  } else {
    behaviorLabel = `Đỉnh online lúc ${peakHourLabel} hàng ngày`;
  }

  // Tầng 2: Insight Text động (Trả về ReactNode có các từ khóa bôi đậm)
  const insightText = (
    <span>
      Kênh sở hữu tệp khán giả có chân dung sắc nét: {genderTag}. Về độ tuổi, kênh tập trung chủ yếu vào {ageTag}.{" "}
      {isMultiNational ? (
        <span>
          Địa lý thuộc nhóm <strong className="text-base-content font-black">{geoClassification}</strong> khi quốc gia dẫn đầu chiếm dưới 55% và 4 quốc gia tiếp theo cộng lại đạt <strong className="text-base-content font-black">{nextCountriesPct}%</strong>.{" "}
        </span>
      ) : (
        <span>
          Địa lý thuộc nhóm <strong className="text-base-content font-black">{geoClassification}</strong> (<strong className="text-base-content font-black">{countryLabel}</strong> chiếm <strong className="text-base-content font-black">{topCountryPct}%</strong>).{" "}
        </span>
      )}
      {otherTag && (
        <span>
          Đặc biệt lưu ý: {otherTag}
        </span>
      )}
    </span>
  );

  // ==========================================
  // III. CÁC ĐIỂM NÂNG CAO (CONFIDENCE & FALLBACK)
  // ==========================================

  // 1. Tính toán Confidence Score (Độ tin cậy của phân tích)
  let confidenceScore = 95;
  if (followersCount < 100) {
    confidenceScore = 40; // Quy mô quá nhỏ để phân tích chính xác
  } else if (followersCount < 500) {
    confidenceScore = 72; // Quy mô trung bình
  }

  if (otherPct > 40) {
    confidenceScore -= 25; // Ẩn danh/không khai báo làm giảm độ tin cậy giới tính
  } else if (otherPct > 20) {
    confidenceScore -= 8;
  }

  if (!isGenderDataReliable) {
    confidenceScore = Math.max(30, confidenceScore - 10);
  }
  confidenceScore = Math.max(10, Math.min(98, confidenceScore));

  const hasSufficientData = totalGender > 50 && totalAge > 50 && totalCountry > 50;
  if (!hasSufficientData) {
    confidenceScore = Math.min(confidenceScore, 45);
  }

  let confidenceLevel = "Rất Cao";
  let confidenceColor = "text-success";
  if (confidenceScore < 60) {
    confidenceLevel = "Thấp";
    confidenceColor = "text-error";
  } else if (confidenceScore < 80) {
    confidenceLevel = "Trung bình";
    confidenceColor = "text-warning";
  }

  // ==========================================
  // IV. ACTIONABLE RULES ENGINE (DỰA TRÊN CÔNG THỨC)
  // ==========================================

  const actionItems: React.ReactNode[] = [];

  // Rule 1: Ngôn ngữ (Language Strategy & Instagram Auto-Translation)
  if (isMultiNational) {
    if (topCountryLabelIsVN(countryLabel)) {
      actionItems.push(
        <span key="lang-rule">
          <strong className="text-accent font-black">
            Caption song ngữ & Auto-Translate:
          </strong>{" "}
          Do tệp quốc tế phân tán chiếm tới{" "}
          <strong className="text-accent font-black">
            {100 - topCountryPct}%
          </strong>
          , hãy giữ ngôn ngữ chính là Tiếng Việt, đồng thời bổ sung thêm một
          đoạn tóm tắt bằng Tiếng Anh ngắn gọn trong phần đầu caption hoặc ghim
          tại bình luận đầu tiên.
        </span>,
      );
    } else {
      actionItems.push(
        <span key="lang-rule">
          <strong className="text-accent font-black">
            Chiến lược đa ngôn ngữ toàn cầu:
          </strong>{" "}
          Cân nhắc sử dụng Tiếng Anh làm ngôn ngữ chính cho Caption và nội dung
          chữ trong ảnh, đi kèm phụ đề song ngữ cho Reels để khai thác triệt để{" "}
          <strong className="text-accent font-black">
            {100 - topCountryPct}%
          </strong>{" "}
          tệp khán giả ngoài thị trường nội địa.
        </span>,
      );
    }
  } else {
    actionItems.push(
      <span key="lang-rule">
        <strong className="text-accent font-black">
          Bản địa hóa & Tương tác sâu sắc:
        </strong>{" "}
        Dành 100% tài nguyên tối ưu hoá tiếng Việt bản địa, lồng ghép các thuật
        ngữ thịnh hành trong nước và các sự kiện thực tế tại địa phương để tạo
        sự gần gũi, khăng khít tối đa với tệp khán giả nội địa.
      </span>,
    );
  }

  // Rule 2: Khung giờ đăng phân tách cụ thể theo định dạng IG (Posting Schedule Optimization)
  if (isMultiPeak) {
    const peak1TimeStr = INDEX_TO_TIME_STR[peakIndex] || peakHourLabel;
    const peak2TimeStr = INDEX_TO_TIME_STR[secondPeakIndex] || secondPeakHourLabel;
    const postTime1 = getPostingTime45MinBefore(peakIndex);
    const postTime2 = getPostingTime45MinBefore(secondPeakIndex);

    actionItems.push(
      <span key="time-rule">
        <strong className="text-accent font-black">
          Lịch đăng 2 pha (Tận dụng hai đỉnh sóng thực tế):
        </strong>{" "}
        Khán giả phân bố tương tác mạnh vào cả hai khung giờ đỉnh:{" "}
        <strong className="font-bold">{peak1TimeStr}</strong> và{" "}
        <strong className="font-bold">{peak2TimeStr}</strong>.
        <ul className="list-disc pl-5 mt-1.5 space-y-1.5 text-sm text-base-content/80">
          <li>
            <strong className="text-info font-bold">Story (Real-time):</strong>{" "}
            Chia làm 2 đợt đăng đúng giờ đỉnh lúc{" "}
            <strong className="text-primary font-semibold">
              {peakHourLabel} 
            </strong>{" "}
            và{" "}
            <strong className="text-primary font-semibold">
              {secondPeakHourLabel}
            </strong>.
          </li>
          <li>
            <strong className="text-info font-bold">
              Reels / Feed Post (Tập trung đón đầu):
            </strong>{" "}
            Đăng trước mốc đỉnh 45 phút để thuật toán kịp phân phối: đợt 1 lúc{" "}
            <strong className="text-primary font-semibold">
              {postTime1}
            </strong>{" "}
            hoặc đợt 2 lúc{" "}
            <strong className="text-primary font-semibold">
              {postTime2}
            </strong>.
          </li>
        </ul>
      </span>,
    );
  } else if (isNightOwl) {
    actionItems.push(
      <span key="time-rule">
        <strong className="text-accent font-black">
          Lịch đăng Cú Đêm (Phân tách theo định dạng IG):
        </strong>{" "}
        Khán giả hoạt động mạnh mẽ xuyên đêm (
        <strong className="text-secondary font-black">00:00 - 06:00</strong>).
        <ul className="list-disc pl-5 mt-1.5 space-y-1.5 text-sm text-base-content/80">
          <li>
            <strong className="text-info font-bold">
              Story (Xem Real-time):
            </strong>{" "}
            Đăng trực tiếp vào giờ đỉnh{" "}
            <strong className="text-primary font-semibold">
              23:00 - 23:45
            </strong>
            .
          </li>
          <li>
            <strong className="text-info font-bold">
              Reels (Warm-up 60 phút):
            </strong>{" "}
            Đăng sớm lúc{" "}
            <strong className="text-primary font-semibold">
              22:15 - 22:45
            </strong>{" "}
            để thuật toán kịp lập chỉ mục.
          </li>
          <li>
            <strong className="text-info font-bold">
              Feed Post (Ảnh/Carousel):
            </strong>{" "}
            Đăng lúc{" "}
            <strong className="text-primary font-semibold">
              22:30 - 23:00
            </strong>{" "}
            (trước 30 phút).
          </li>
          <li>
            <strong className="text-warning font-bold">Lưu ý caption:</strong>{" "}
            Hạn chế viết caption quá dài (&gt;150 ký tự) vào khung giờ muộn, tập
            trung vào hook thị giác Reels/Story để tối đa thời gian xem của "cú
            đêm".
          </li>
        </ul>
      </span>,
    );
  } else {
    actionItems.push(
      <span key="time-rule">
        <strong className="text-info font-black">
          Lịch đăng Giờ Vàng (Phân tách theo định dạng IG):
        </strong>
        <ul className="list-disc pl-5 mt-1.5 space-y-1.5 text-sm text-base-content/80">
          <li>
            <strong className="text-info font-bold">
              Story (Xem Real-time):
            </strong>{" "}
            Đăng đúng giờ đỉnh{" "}
            <strong className="text-primary font-semibold">
              20:45 - 21:15
            </strong>
            .
          </li>
          <li>
            <strong className="text-info font-bold">
              Reels (Warm-up 60 phút):
            </strong>{" "}
            Đăng lúc{" "}
            <strong className="text-primary font-semibold">
              19:45 - 20:15
            </strong>{" "}
            để kịp phân phối vào đỉnh vàng.
          </li>
          <li>
            <strong className="text-info font-bold">
              Feed Post (Ảnh/Carousel):
            </strong>{" "}
            Đăng lúc{" "}
            <strong className="text-primary font-semibold">
              20:15 - 20:45
            </strong>
            .
          </li>
        </ul>
      </span>,
    );
  }

  // Rule 3: Instagram Algorithm Format-first Rule
  if (isGenZInstagram || isNightOwl) {
    actionItems.push(
      <span key="format-rule">
        <strong className="text-primary font-black flex items-center gap-1.5">
          <AlertTriangle size={14} className="text-primary shrink-0 mt-0.5" />
          Instagram Algorithm Priority:
        </strong>{" "}
        Do tệp khán giả của kênh mang đặc thù cực kỳ năng động (Gen Z hoặc Cú
        đêm hoạt động muộn),{" "}
        <strong className="text-primary">
          Reels và Story là hai định dạng ưu tiên tuyệt đối
        </strong>
        . Thuật toán phân phối tự nhiên của Instagram sẽ bóp nghẹt lượt tiếp cận
        của các ảnh tĩnh đơn lẻ trên Feed đối với tệp người dùng này.
      </span>,
    );
  }

  return {
    genderLabel,
    genderPct,
    ageLabel,
    agePct,
    countryLabel,
    countryPct,
    behaviorLabel,
    insightText,
    personaHeadline,
    personaData,
    geoClassification,
    confidenceScore,
    confidenceLevel,
    confidenceColor,
    actionItems,
  };
}
