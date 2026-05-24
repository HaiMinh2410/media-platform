import React from "react";
import { Check } from "lucide-react";
import {
  translateCountry,
  topCountryLabelIsVN,
} from "./follower-persona-utils";

interface DemographicItem {
  name: string;
  value: number;
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
  const isMultiNational = topCountryPct < 60 && nextCountriesPct > 25;

  // 4. Phân tích Nhịp sinh học & Nhận diện Đỉnh kép (Multi-peak)
  const TIME_LABELS = [
    "12 AM",
    "3 AM",
    "6 AM",
    "9 AM",
    "12 PM",
    "3 PM",
    "6 PM",
    "9 PM",
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

  // Logic Cú đêm (isNightOwl) theo dải range: Đỉnh thuộc [22:00 - 5:00] (Tương ứng với 12 AM [00h] hoặc 3 AM [03h])
  const isNightOwl = peakIndex === 0 || peakIndex === 1;

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

  // A. Giới tính
  let genderTag = "";
  if (malePct > 65) {
    genderTag = "Cộng đồng Nam giới chiếm ưu thế tuyệt đối trên Instagram";
  } else if (malePct >= 50 && malePct <= 65) {
    genderTag = "Cộng đồng thiên về Nam giới (tín hiệu nổi bật trên IG)";
  } else if (femalePct > 65) {
    genderTag = "Cộng đồng Nữ giới chiếm ưu thế tuyệt đối trên Instagram";
  } else if (femalePct >= 50 && femalePct <= 65) {
    genderTag = "Cộng đồng thiên về Nữ giới (bám sát baseline IG)";
  } else {
    genderTag = "Khán giả phân bổ cân bằng giới tính trên Instagram";
  }

  // B. Xử lý ẩn danh / Khác (otherPct)
  let otherTag = "";
  let isGenderDataReliable = true;
  if (otherPct > 40) {
    otherTag = `Cảnh báo: Dữ liệu giới tính bị loãng nghiêm trọng (tài khoản không khai báo giới tính chiếm tới ${otherPct}%).`;
    isGenderDataReliable = false;
  } else if (otherPct > 20) {
    otherTag = `Có sự hiện diện đáng kể của tài khoản Business hoặc người dùng quốc tế ẩn giới tính (${otherPct}%).`;
  }

  // C. Độ tuổi (Gen Z vs Adult và Fallback động)
  let ageTag = "";
  if (isGenZInstagram) {
    ageTag =
      "Tệp Gen Z thuần Instagram (nhóm 18-24 chiếm tỷ lệ cực kỳ lớn >40%)";
  } else if (isAdultAudience) {
    ageTag =
      "Tập khách hàng trưởng thành, đi làm, có thu nhập ổn định (25-44 tuổi)";
  } else {
    // FALLBACK ĐỘNG: Lấy top 2 độ tuổi cao nhất
    const sortedAge = [...ageData].sort((a, b) => b.value - a.value);
    const top1Age = sortedAge[0]?.name || "18-24";
    const top2Age = sortedAge[1]?.name || "25-34";

    if (top1Age.includes("18-24") && top2Age.includes("25-34")) {
      ageTag = "Tệp người trẻ và nhân viên văn phòng trẻ tuổi";
    } else if (top1Age.includes("13-17") && top2Age.includes("18-24")) {
      ageTag = "Tệp học sinh - sinh viên và người trẻ tuổi năng động";
    } else {
      ageTag = `Tập trung vào phân khúc khán giả thuộc nhóm tuổi ${top1Age} & ${top2Age}`;
    }
  }

  // D. Kết luận Output Persona Headline
  let personaHeadline = `${isGenZInstagram ? "Tệp Gen Z Instagram" : isAdultAudience ? "Khán giả Trưởng thành" : "Khán giả Trẻ tuổi"}`;
  if (malePct > 65) {
    personaHeadline += " Nam giới ưu thế";
  } else if (femalePct > 65) {
    personaHeadline += " Nữ giới ưu thế";
  } else {
    personaHeadline += " Đa dạng giới tính";
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
    behaviorLabel = "Hoạt động xuyên đêm (Đỉnh điểm từ 12 AM – 6 AM)";
  } else {
    behaviorLabel = `Đỉnh online lúc ${peakHourLabel} hàng ngày`;
  }

  // Tầng 2: Insight Text động
  let insightText = `Kênh sở hữu tệp khán giả có chân dung sắc nét: ${genderTag}. Về độ tuổi, kênh tập trung chủ yếu vào ${ageTag}. `;
  if (isMultiNational) {
    insightText += `Địa lý thuộc nhóm ${geoClassification} khi quốc gia dẫn đầu chiếm dưới 60% và 4 quốc gia tiếp theo cộng lại đạt ${nextCountriesPct}%. `;
  } else {
    insightText += `Thị trường chủ đạo phân bổ tập trung cao ở thị trường nội địa (${countryLabel} chiếm ${topCountryPct}%). `;
  }
  if (otherTag) {
    insightText += `Đặc biệt lưu ý: ${otherTag}`;
  }

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

  let confidenceLevel = "Rất Cao";
  let confidenceColor = "bg-success/10 text-success border-success/20";
  if (confidenceScore < 60) {
    confidenceLevel = "Thấp";
    confidenceColor = "bg-error/10 text-error border-error/20";
  } else if (confidenceScore < 80) {
    confidenceLevel = "Trung bình";
    confidenceColor = "bg-warning/10 text-warning border-warning/20";
  }

  // ==========================================
  // IV. ACTIONABLE RULES ENGINE (DỰA TRÊN CÔNG THỨC)
  // ==========================================

  const actionItems: React.ReactNode[] = [];

  // Rule 1: Nội dung (Content Strategy) - Khuyến nghị Format IG
  const isMaleHigh = malePct > 65;
  if (isMaleHigh && isAdultAudience) {
    actionItems.push(
      <span key="content-rule">
        <strong className="text-amber-500 dark:text-amber-400 font-black">
          Nội dung logic & Format IG chuyên sâu:
        </strong>{" "}
        Tập trung vào các chủ đề có tính logic, thực tế, kỹ thuật hoặc tài chính
        (Kinh doanh, Công nghệ, Đầu tư, Nghề nghiệp). Hạn chế các nội dung quá
        nặng về cảm xúc cá nhân hoặc bắt trend ngắn hạn. Ưu tiên định dạng{" "}
        <strong className="text-primary font-bold">Carousel infographic</strong>{" "}
        phân tích số liệu + video ngắn{" "}
        <strong className="text-primary font-bold">Reels</strong> có hook
        insight giật gân ngay 3 giây đầu để giữ chân người xem.
      </span>,
    );
  } else if (isGenZInstagram) {
    actionItems.push(
      <span key="content-rule">
        <strong className="text-amber-500 dark:text-amber-400 font-black">
          Nội dung Gen Z & Visual-First:
        </strong>{" "}
        Tập trung tối đa vào các chủ đề phong cách sống, trải nghiệm sáng tạo,
        làm đẹp hoặc các challenge năng động. Ưu tiên định dạng{" "}
        <strong className="text-primary font-bold">Reels</strong> có âm nhạc
        thịnh hành, nhịp dựng nhanh và{" "}
        <strong className="text-primary font-bold">Story tương tác</strong>{" "}
        (Sticker câu hỏi/bình chọn) để tối ưu hoá tương tác.
      </span>,
    );
  } else {
    actionItems.push(
      <span key="content-rule">
        <strong className="text-amber-500 dark:text-amber-400 font-black">
          Nội dung đời sống & Giáo dục thực tế:
        </strong>{" "}
        Tập trung nội dung mang tính chia sẻ giá trị, cân bằng cuộc sống, tri
        thức và phát triển cá nhân. Kết hợp hài hòa giữa Reels tạo độ phủ và
        Carousel hình ảnh thẩm mỹ để xây dựng niềm tin dài hạn.
      </span>,
    );
  }

  // Rule 2: Ngôn ngữ (Language Strategy & Instagram Auto-Translation)
  if (isMultiNational) {
    if (topCountryLabelIsVN(countryLabel)) {
      actionItems.push(
        <span key="lang-rule">
          <strong className="text-emerald-500 dark:text-emerald-400 font-black">
            Caption song ngữ & Auto-Translate:
          </strong>{" "}
          Do tệp quốc tế phân tán chiếm tới{" "}
          <strong className="text-emerald-500 dark:text-emerald-400 font-black">
            {100 - topCountryPct}%
          </strong>
          , hãy giữ ngôn ngữ chính là Tiếng Việt, đồng thời bổ sung thêm một
          đoạn tóm tắt bằng Tiếng Anh ngắn gọn trong phần đầu caption hoặc ghim
          tại bình luận đầu tiên. Tận dụng các hình ảnh visual dạng sơ đồ/icon
          không lời để tăng khả năng tiếp cận toàn cầu.
        </span>,
      );
    } else {
      actionItems.push(
        <span key="lang-rule">
          <strong className="text-emerald-500 dark:text-emerald-400 font-black">
            Chiến lược đa ngôn ngữ toàn cầu:
          </strong>{" "}
          Cân nhắc sử dụng Tiếng Anh làm ngôn ngữ chính cho Caption và nội dung
          chữ trong ảnh, đi kèm phụ đề song ngữ cho Reels để khai thác triệt để{" "}
          <strong className="text-emerald-500 dark:text-emerald-400 font-black">
            {100 - topCountryPct}%
          </strong>{" "}
          tệp khán giả ngoài thị trường nội địa.
        </span>,
      );
    }
  } else {
    actionItems.push(
      <span key="lang-rule">
        <strong className="text-emerald-500 dark:text-emerald-400 font-black">
          Bản địa hóa & Tương tác sâu sắc:
        </strong>{" "}
        Dành 100% tài nguyên tối ưu hoá tiếng Việt bản địa, lồng ghép các thuật
        ngữ thịnh hành trong nước và các sự kiện thực tế tại địa phương để tạo
        sự gần gũi, khăng khít tối đa với tệp khán giả nội địa.
      </span>,
    );
  }

  // Rule 3: Khung giờ đăng phân tách cụ thể theo định dạng IG (Posting Schedule Optimization)
  if (isNightOwl) {
    actionItems.push(
      <span key="time-rule">
        <strong className="text-info font-black">
          Lịch đăng Cú Đêm (Phân tách theo định dạng IG):
        </strong>{" "}
        Khán giả hoạt động mạnh mẽ xuyên đêm (
        <strong className="text-secondary font-black">12 AM - 6 AM</strong>).
        <ul className="list-disc pl-5 mt-1.5 space-y-1.5 text-xs text-base-content/80">
          <li>
            <strong className="text-info font-bold">
              Story (Xem Real-time):
            </strong>{" "}
            Đăng trực tiếp vào giờ đỉnh{" "}
            <strong className="text-amber-500 dark:text-amber-400 font-semibold">
              23:00 - 23:45
            </strong>
            .
          </li>
          <li>
            <strong className="text-info font-bold">
              Reels (Warm-up 60 phút):
            </strong>{" "}
            Đăng sớm lúc{" "}
            <strong className="text-amber-500 dark:text-amber-400 font-semibold">
              22:15 - 22:45
            </strong>{" "}
            để thuật toán kịp lập chỉ mục.
          </li>
          <li>
            <strong className="text-info font-bold">
              Feed Post (Ảnh/Carousel):
            </strong>{" "}
            Đăng lúc{" "}
            <strong className="text-amber-500 dark:text-amber-400 font-semibold">
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
  } else if (isMultiPeak) {
    actionItems.push(
      <span key="time-rule">
        <strong className="text-info font-black">
          Lịch đăng 2 pha (Tận dụng hai đỉnh sóng):
        </strong>{" "}
        Khán giả phân bố tương tác mạnh vào cả trưa và chiều tối.
        <ul className="list-disc pl-5 mt-1.5 space-y-1.5 text-xs text-base-content/80">
          <li>
            <strong className="text-info font-bold">Story (Real-time):</strong>{" "}
            Chia làm 2 đợt đăng đúng giờ đỉnh lúc{" "}
            <strong className="text-amber-500 dark:text-amber-400 font-semibold">
              12:00
            </strong>{" "}
            trưa và{" "}
            <strong className="text-amber-500 dark:text-amber-400 font-semibold">
              21:00
            </strong>{" "}
            tối.
          </li>
          <li>
            <strong className="text-info font-bold">
              Reels / Feed Post (Tập trung tối):
            </strong>{" "}
            Đăng đợt chính lúc{" "}
            <strong className="text-amber-500 dark:text-amber-400 font-semibold">
              19:45 - 20:15
            </strong>{" "}
            để thuật toán kịp phân phối và đạt đỉnh tương tác vào buổi tối.
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
        <ul className="list-disc pl-5 mt-1.5 space-y-1.5 text-xs text-base-content/80">
          <li>
            <strong className="text-info font-bold">
              Story (Xem Real-time):
            </strong>{" "}
            Đăng đúng giờ đỉnh{" "}
            <strong className="text-amber-500 dark:text-amber-400 font-semibold">
              20:45 - 21:15
            </strong>
            .
          </li>
          <li>
            <strong className="text-info font-bold">
              Reels (Warm-up 60 phút):
            </strong>{" "}
            Đăng lúc{" "}
            <strong className="text-amber-500 dark:text-amber-400 font-semibold">
              19:45 - 20:15
            </strong>{" "}
            để kịp phân phối vào đỉnh vàng.
          </li>
          <li>
            <strong className="text-info font-bold">
              Feed Post (Ảnh/Carousel):
            </strong>{" "}
            Đăng lúc{" "}
            <strong className="text-amber-500 dark:text-amber-400 font-semibold">
              20:15 - 20:45
            </strong>
            .
          </li>
        </ul>
      </span>,
    );
  }

  // Rule 4: Instagram Algorithm Format-first Rule
  if (isGenZInstagram || isNightOwl) {
    actionItems.push(
      <span key="format-rule">
        <strong className="text-primary font-black">
          ⚠️ Instagram Algorithm Priority:
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
    confidenceScore,
    confidenceLevel,
    confidenceColor,
    actionItems,
  };
}
