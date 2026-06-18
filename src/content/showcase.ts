import type { ShowcaseItem } from "./types";

// NOTE: "Smart Arm" currently reuses /img/pcar.jpg (no dedicated asset exists yet).
// Flagged for the content owner to supply a real Smart Arm photo.
export const showcase: ShowcaseItem[] = [
  {
    id: "robot-clover",
    title: "Robot Clover",
    category: { en: "Robotics", vi: "Robot học" },
    description: {
      en: "A compact line-following robot equipped with precision optical sensors. Students program its path, test on the track, and debug in real time — learning the fundamental principle that machines only work flawlessly when human logic is set up correctly.",
      vi: "Một robot dò line nhỏ gọn được trang bị cảm biến quang học chính xác. Học sinh lập trình đường đi, chạy thử trên sa bàn và gỡ lỗi theo thời gian thực — thấu hiểu nguyên lý cốt lõi: máy móc chỉ vận hành hoàn hảo khi logic của con người được thiết lập đúng.",
    },
    image: { src: "/img/clover_bot.jpg", alt: { en: "Robot Clover", vi: "Robot Clover" } },
  },
  {
    id: "smart-arm",
    title: "Smart Arm",
    category: { en: "Engineering", vi: "Kỹ thuật" },
    description: {
      en: "A servo-driven robotic arm that draws geometric designs on paper based on programmed coordinates. Every deviation in logic is immediately exposed by a misplaced line — training spatial thinking and meticulous precision in every decision.",
      vi: "Cánh tay robot dẫn động bằng servo vẽ các thiết kế hình học lên giấy dựa trên toạ độ được lập trình. Mỗi sai lệch trong logic lập tức lộ ra qua một nét vẽ đặt sai chỗ — rèn luyện tư duy không gian và sự tỉ mỉ chính xác trong từng quyết định.",
    },
    image: { src: "/img/pcar.jpg", alt: { en: "Smart Arm", vi: "Cánh tay thông minh" } },
  },
  {
    id: "pcar",
    title: "PCar",
    category: { en: "AI Voice", vi: "Giọng nói AI" },
    description: {
      en: "A voice-controlled autonomous car that responds entirely to spoken commands — no remote controller needed. Students must speak clearly and decisively: 'forward', 'turn left', 'stop' — transforming their voice into control and building awareness of how language drives machines.",
      vi: "Chiếc xe tự hành điều khiển bằng giọng nói, phản hồi hoàn toàn theo khẩu lệnh — không cần tay điều khiển. Học sinh phải nói rõ ràng, dứt khoát: 'tiến', 'rẽ trái', 'dừng' — biến giọng nói thành quyền điều khiển và nhận ra ngôn ngữ dẫn dắt máy móc thế nào.",
    },
    image: { src: "/img/pcar.jpg", alt: { en: "PCar", vi: "PCar" } },
  },
  {
    id: "vex",
    title: "VEX Robotics",
    category: { en: "Competition", vi: "Thi đấu" },
    description: {
      en: "An international-standard robotics platform where students design mechanisms, assemble hardware, write autonomous code, and compete under strict time limits. Through breakdowns, sweat, and hard-won victories, they learn strategic thinking, teamwork, and the discipline of real engineering.",
      vi: "Nền tảng robot đạt chuẩn quốc tế, nơi học sinh thiết kế cơ cấu, lắp ráp phần cứng, viết mã tự hành và thi đấu trong giới hạn thời gian khắt khe. Qua những lần hỏng hóc, mồ hôi và chiến thắng khó nhọc, các em học được tư duy chiến lược, làm việc nhóm và kỷ luật của kỹ thuật thực thụ.",
    },
    image: { src: "/img/vex.jpg", alt: { en: "VEX Robotics", vi: "VEX Robotics" } },
  },
  {
    id: "vr",
    title: "VR Lab",
    category: { en: "Immersive", vi: "Nhập vai" },
    description: {
      en: "Fully immersive 3D environments that transform abstract lessons into vivid experiences — from walking through the historic Ba Dinh Square in 1945, to detailed frog dissection in Biology, to visualizing complex geometric transformations in Mathematics.",
      vi: "Những môi trường 3D nhập vai hoàn toàn, biến bài học trừu tượng thành trải nghiệm sống động — từ bước đi giữa Quảng trường Ba Đình lịch sử năm 1945, đến mổ ếch chi tiết trong môn Sinh học, hay hình dung các phép biến hình hình học phức tạp trong Toán học.",
    },
    image: { src: "/img/vr.jpg", alt: { en: "VR Lab", vi: "Phòng thí nghiệm VR" } },
  },
];

/** Repository seam, mirroring getProduct: look up a showcase build by id. */
export function getShowcaseItem(id: string): ShowcaseItem | undefined {
  return showcase.find((s) => s.id === id);
}
