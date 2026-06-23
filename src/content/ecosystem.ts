import type { EcosystemApp } from "./types";

// NOTE: "Vision Tale" currently reuses /img/vietCreative.jpg (no dedicated asset yet).
// Flagged for the content owner to supply a real Vision Tale still.
export const ecosystem: EcosystemApp[] = [
  {
    id: "ptalk",
    name: "PTalk",
    slug: "ptalk",
    year: 2025,
    category: "ai-voice",
    categoryLabel: { en: "AI Voice", vi: "Giọng nói AI" },
    icon: "mic",
    excerpt: {
      en: "AI voice assistant for curriculum-aligned speaking practice — a safe space for every student to find their voice.",
      vi: "Trợ lý giọng nói AI giúp luyện nói bám sát chương trình — một không gian an toàn để mỗi học sinh tìm thấy tiếng nói của mình.",
    },
    description: {
      en: "An AI voice learning assistant that listens, responds, and guides students through curriculum-aligned exercises. Speak up, get instant feedback, and build confidence — a safe space for every student to find their voice.",
      vi: "Trợ lý học tập bằng giọng nói AI biết lắng nghe, phản hồi và dẫn dắt học sinh qua các bài tập bám sát chương trình. Hãy cất tiếng, nhận phản hồi tức thì và xây dựng sự tự tin — một không gian an toàn để mỗi học sinh tìm thấy tiếng nói của mình.",
    },
    features: {
      en: [
        "AI-powered speech recognition & natural language processing",
        "Curriculum-aligned content following the national textbook program",
        "Instant spoken feedback with guided follow-up questions",
      ],
      vi: [
        "Nhận dạng giọng nói & xử lý ngôn ngữ tự nhiên bằng AI",
        "Nội dung bám sát chương trình sách giáo khoa quốc gia",
        "Phản hồi bằng lời tức thì kèm câu hỏi gợi mở",
      ],
    },
    tags: {
      en: ["AI", "Voice", "Education"],
      vi: ["AI", "Giọng nói", "Giáo dục"],
    },
    downloadHref: "#",
    image: { src: "/img/ptalk.jpg", alt: { en: "PTalk", vi: "PTalk" } },
  },
  {
    id: "viet-creative",
    name: "VietCreative",
    slug: "viet-creative",
    year: 2025,
    category: "creative-ai",
    categoryLabel: { en: "Creative AI", vi: "Sáng tạo AI" },
    icon: "paintbrush",
    excerpt: {
      en: "Vietnamese lessons, personal AI tutor, and smart drawing — an all-in-one creative studio on a tablet.",
      vi: "Bài học tiếng Việt, gia sư AI riêng và vẽ thông minh — một studio sáng tạo tất-cả-trong-một trên máy tính bảng.",
    },
    description: {
      en: "An all-in-one creative studio on a tablet — Vietnamese language lessons, a personal AI tutor for instant Q&A, and an intelligent drawing tool that transforms rough sketches into polished artwork.",
      vi: "Một studio sáng tạo tất-cả-trong-một trên máy tính bảng — bài học tiếng Việt, gia sư AI cá nhân giải đáp tức thì và công cụ vẽ thông minh biến phác thảo thô thành tác phẩm hoàn chỉnh.",
    },
    features: {
      en: [
        "Vietnamese language lessons with structured exercises",
        "Personal AI tutor for 1-on-1 Q&A anytime",
        "Smart drawing canvas with AI-assisted artwork completion",
      ],
      vi: [
        "Bài học tiếng Việt với hệ thống bài tập bài bản",
        "Gia sư AI cá nhân hỏi-đáp 1-1 mọi lúc",
        "Khung vẽ thông minh hoàn thiện tác phẩm với hỗ trợ AI",
      ],
    },
    tags: {
      en: ["Creative", "AI Tutor", "Vietnamese"],
      vi: ["Sáng tạo", "Gia sư AI", "Tiếng Việt"],
    },
    downloadHref: "#",
    image: { src: "/img/vietCreative.jpg", alt: { en: "VietCreative", vi: "VietCreative" } },
  },
  {
    id: "vision-tale",
    name: "Vision Tale",
    slug: "vision-tale",
    year: 2025,
    category: "video-ai",
    categoryLabel: { en: "Video AI", vi: "Video AI" },
    icon: "film",
    excerpt: {
      en: "Write scripts, design characters, arrange scenes — then watch AI render your story into an animated video.",
      vi: "Viết kịch bản, thiết kế nhân vật, dàn cảnh — rồi xem AI dựng câu chuyện của bạn thành video hoạt hình.",
    },
    description: {
      en: "An AI-powered filmmaking tool where students write scripts, design custom characters, and arrange scene-by-scene storyboards — then watch their vision rendered into a fully animated video.",
      vi: "Công cụ làm phim ứng dụng AI, nơi học sinh viết kịch bản, thiết kế nhân vật riêng và sắp xếp storyboard theo từng cảnh — rồi xem ý tưởng của mình được dựng thành video hoạt hình hoàn chỉnh.",
    },
    features: {
      en: [
        "Generative AI video rendering from text prompts",
        "Deep character customization & scene-by-scene control",
        "Storyboard workflow teaching narrative structure & visual logic",
      ],
      vi: [
        "Dựng video bằng AI tạo sinh từ câu lệnh văn bản",
        "Tuỳ biến nhân vật sâu & kiểm soát theo từng cảnh",
        "Quy trình storyboard dạy cấu trúc tự sự & logic hình ảnh",
      ],
    },
    tags: {
      en: ["Generative AI", "Video", "Storytelling"],
      vi: ["AI tạo sinh", "Video", "Kể chuyện"],
    },
    downloadHref: "#",
    image: { src: "/img/vietCreative.jpg", alt: { en: "Vision Tale", vi: "Vision Tale" } },
  },
  {
    id: "unilearn",
    name: "Unilearn",
    slug: "unilearn",
    year: 2025,
    category: "learning-ai",
    categoryLabel: { en: "Learning AI", vi: "Học tập AI" },
    icon: "music",
    excerpt: {
      en: "Dual-module AI: step-by-step math problem-solving on one side, music theory and composition on the other.",
      vi: "AI hai phân hệ: một bên giải toán theo từng bước, một bên lý thuyết âm nhạc và sáng tác.",
    },
    description: {
      en: "A dual-module AI platform that sharpens both hemispheres of the brain — step-by-step math problem solving with guided hints, and interactive music theory, rhythm training, and basic composition.",
      vi: "Nền tảng AI hai phân hệ giúp rèn cả hai bán cầu não — giải toán theo từng bước kèm gợi ý dẫn dắt, cùng lý thuyết âm nhạc tương tác, luyện tiết tấu và sáng tác cơ bản.",
    },
    features: {
      en: [
        "AI-guided math from basic to advanced with step-by-step hints",
        "Music theory, rhythm training, and basic composition module",
        "Balanced left-brain logic and right-brain creativity development",
      ],
      vi: [
        "Toán học dẫn dắt bằng AI từ cơ bản đến nâng cao kèm gợi ý từng bước",
        "Phân hệ lý thuyết âm nhạc, luyện tiết tấu và sáng tác cơ bản",
        "Phát triển cân bằng logic não trái và sáng tạo não phải",
      ],
    },
    tags: {
      en: ["Math", "Music", "AI"],
      vi: ["Toán", "Âm nhạc", "AI"],
    },
    downloadHref: "#",
    image: { src: "/img/unilearn.jpg", alt: { en: "Unilearn", vi: "Unilearn" } },
  },
  {
    id: "kidmentor",
    name: "KidMentor",
    slug: "kidmentor",
    year: 2025,
    category: "learning-ai",
    categoryLabel: { en: "Kids Learning", vi: "Học tập cho trẻ" },
    icon: "graduation",
    excerpt: {
      en: "An AI learning companion that guides children through lessons at their own pace.",
      vi: "Người bạn học AI đồng hành, dẫn dắt trẻ qua từng bài học theo nhịp độ riêng.",
    },
    description: {
      en: "KidMentor is an AI companion for young learners — it personalises lessons by grade and curriculum, answers questions patiently, and gives parents a clear view of progress in a safe, age-appropriate space.",
      vi: "KidMentor là người bạn AI cho trẻ nhỏ — cá nhân hoá bài học theo lớp và chương trình, kiên nhẫn trả lời câu hỏi và cho phụ huynh thấy rõ tiến độ trong một không gian an toàn, phù hợp lứa tuổi.",
    },
    features: {
      en: [
        "Lessons personalised by grade and curriculum",
        "Patient, age-appropriate AI tutoring",
        "Parent view of learning progress",
      ],
      vi: [
        "Bài học cá nhân hoá theo lớp và chương trình",
        "Gia sư AI kiên nhẫn, phù hợp lứa tuổi",
        "Phụ huynh theo dõi tiến độ học tập",
      ],
    },
    tags: { en: ["AI", "Kids", "Learning"], vi: ["AI", "Trẻ em", "Học tập"] },
    downloadHref: "#",
    // image = existing placeholder so /products + Hệ sinh thái cards never break;
    // logo = convention path the user drops a file at (grid shows it when present).
    image: { src: "/img/1account.png", alt: { en: "KidMentor", vi: "KidMentor" } },
    logo: "/img/logos/logo_kidmentor.png",
    device: true,
  },
  {
    id: "ptalk-signature",
    name: "PTalk Signature",
    slug: "ptalk-signature",
    year: 2025,
    category: "ai-voice",
    categoryLabel: { en: "AI Voice", vi: "Giọng nói AI" },
    icon: "signature",
    excerpt: {
      en: "The signature PTalk voice assistant — a refined everyday companion that listens and responds naturally.",
      vi: "Bản Signature của trợ lý giọng nói PTalk — người bạn đồng hành hằng ngày, lắng nghe và phản hồi tự nhiên.",
    },
    description: {
      en: "PTalk Signature is the premium voice-assistant experience of the PTalk family — natural spoken dialogue, helpful daily routines, and a friendly companion designed for comfort and everyday use.",
      vi: "PTalk Signature là trải nghiệm trợ lý giọng nói cao cấp của dòng PTalk — đối thoại tự nhiên bằng giọng nói, hỗ trợ thói quen hằng ngày và là người bạn thân thiện, dễ dùng.",
    },
    features: {
      en: [
        "Natural, real-time spoken dialogue",
        "Helpful daily routines and reminders",
        "Friendly companion designed for everyday use",
      ],
      vi: [
        "Đối thoại tự nhiên bằng giọng nói, thời gian thực",
        "Hỗ trợ thói quen và nhắc việc hằng ngày",
        "Người bạn thân thiện, dễ dùng hằng ngày",
      ],
    },
    tags: { en: ["AI", "Voice", "Assistant"], vi: ["AI", "Giọng nói", "Trợ lý"] },
    downloadHref: "#",
    image: { src: "/img/1account.png", alt: { en: "PTalk Signature", vi: "PTalk Signature" } },
    logo: "/img/logos/logo_ptalk_signature.png",
  },
  {
    id: "p-connect",
    name: "P-Connect",
    slug: "p-connect",
    year: 2025,
    category: "connectivity",
    categoryLabel: { en: "Connectivity", vi: "Kết nối" },
    icon: "bluetooth",
    excerpt: {
      en: "Pairs and manages the lab's assistant devices over Bluetooth — one tap to connect.",
      vi: "Ghép nối và quản lý các thiết bị trợ lý của lab qua Bluetooth — chạm một lần là kết nối.",
    },
    description: {
      en: "P-Connect is the companion app that discovers, pairs, and manages CTS Lab's assistant hardware over Bluetooth — keep devices updated, switch between them, and connect in a single tap.",
      vi: "P-Connect là ứng dụng đồng hành giúp dò tìm, ghép nối và quản lý các thiết bị trợ lý của CTS Lab qua Bluetooth — cập nhật thiết bị, chuyển đổi giữa các thiết bị và kết nối chỉ với một chạm.",
    },
    features: {
      en: [
        "Discover and pair devices over Bluetooth",
        "Manage and update connected hardware",
        "One-tap switching between devices",
      ],
      vi: [
        "Dò tìm và ghép nối thiết bị qua Bluetooth",
        "Quản lý và cập nhật thiết bị đã kết nối",
        "Chuyển đổi giữa các thiết bị chỉ với một chạm",
      ],
    },
    tags: { en: ["Bluetooth", "Devices", "Connectivity"], vi: ["Bluetooth", "Thiết bị", "Kết nối"] },
    downloadHref: "#",
    image: { src: "/img/1account.png", alt: { en: "P-Connect", vi: "P-Connect" } },
    logo: "/img/logos/logo_p_connect.png",
  },
];
