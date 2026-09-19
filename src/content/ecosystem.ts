import type { EcosystemApp } from "./types";

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
    downloads: { android: { status: "soon" }, ios: { status: "soon" } },
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
    downloads: {
      android: { status: "available", kind: "apk", target: "/downloads/viet-creative.apk", version: "1.0.0", updatedAt: "2026-09-19" },
      ios: { status: "soon" },
    },
    image: { src: "/img/vietCreative.jpg", alt: { en: "VietCreative", vi: "VietCreative" } },
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
    downloads: {
      android: { status: "available", kind: "play", target: "https://play.google.com/store/apps/details?id=uni.learn.app&hl=vi" },
      ios: { status: "available", kind: "appstore", target: "https://apps.apple.com/vn/app/unilearn-gia-s%C6%B0-ai/id6747472124" },
    },
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
    downloads: {
      // TODO(user): đổi `target` sang host thật khi chốt (games origin :8090 / public/ / thư mục ngoài repo).
      android: { status: "available", kind: "apk", target: "/downloads/kidmentor.apk", version: "1.0.1", updatedAt: "2026-09-20" },
      ios: { status: "soon" },
    },
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
    downloads: {
      // TODO(user): đổi `target` sang host thật khi chốt (games origin :8090 / public/ / thư mục ngoài repo).
      android: { status: "available", kind: "apk", target: "/downloads/ptalk-signature.apk", version: "1.0.0", updatedAt: "2026-07-06" },
      ios: { status: "soon" },
    },
    image: { src: "/img/1account.png", alt: { en: "PTalk Signature", vi: "PTalk Signature" } },
    logo: "/img/logos/logo_ptalk_signature.png",
    device: true,
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
    downloads: {
      android: { status: "available", kind: "apk", target: "/downloads/p-connect.apk", version: "1.0.0", updatedAt: "2026-09-19" },
      ios: { status: "soon" },
    },
    image: { src: "/img/1account.png", alt: { en: "P-Connect", vi: "P-Connect" } },
    logo: "/img/logos/logo_p_connect.png",
  },
];

/** VR-headset products (Meta Quest / standalone). Kept SEPARATE from `ecosystem`
 *  so the /products grid + ecosystem tests (which require android+ios on every
 *  ecosystem app) stay unchanged. Surfaced only in the VR group on /download. */
export const vrDevices: EcosystemApp[] = [
  {
    id: "stem-vr",
    name: "STEM VR",
    slug: "stem-vr",
    year: 2025,
    category: "vr",
    categoryLabel: { en: "VR Learning", vi: "Học tập VR" },
    icon: "vr",
    excerpt: {
      en: "Immersive STEM lessons for Meta Quest and standalone VR headsets.",
      vi: "Bài học STEM nhập vai cho Meta Quest và các kính VR độc lập.",
    },
    description: {
      en: "STEM VR turns abstract science and technology lessons into hands-on, immersive experiences on Meta Quest and other standalone VR headsets.",
      vi: "STEM VR biến các bài học khoa học và công nghệ trừu tượng thành trải nghiệm nhập vai, thực hành trực tiếp trên Meta Quest và các kính VR độc lập khác.",
    },
    features: {
      en: [
        "Immersive, hands-on STEM simulations",
        "Runs on Meta Quest and standalone VR headsets",
        "Curriculum-aligned lesson modules",
      ],
      vi: [
        "Mô phỏng STEM nhập vai, thực hành trực tiếp",
        "Chạy trên Meta Quest và kính VR độc lập",
        "Học phần bám sát chương trình",
      ],
    },
    tags: { en: ["VR", "STEM", "Immersive"], vi: ["VR", "STEM", "Nhập vai"] },
    downloads: {
      vr: { status: "available", kind: "apk", target: "/downloads/stem-vr.apk", version: "1.0.1", updatedAt: "2026-09-19" },
    },
    image: { src: "/img/vr.jpg", alt: { en: "STEM VR", vi: "STEM VR" } },
  },
];
