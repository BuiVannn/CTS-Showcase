import type { Localized } from "./types";

// Shared interface copy (section eyebrows/titles, buttons, form, nav).
export const ui = {
  hero: {
    exploreCta: { en: "Explore ecosystem", vi: "Khám phá hệ sinh thái" } as Localized,
    vrCta: { en: "VR Tour", vi: "Tham quan VR" } as Localized,
    scroll: { en: "Scroll", vi: "Cuộn" } as Localized,
  },
  showcase: {
    eyebrow: { en: "Featured", vi: "Tiêu biểu" } as Localized,
    title: { en: "Showcase", vi: "Sản phẩm nổi bật" } as Localized,
    lead: {
      en: "Hardware and immersive builds where students learn by making — and by debugging what they make.",
      vi: "Những sản phẩm phần cứng và trải nghiệm nhập vai, nơi học sinh học bằng cách tạo ra — và gỡ lỗi chính thứ mình tạo ra.",
    } as Localized,
    watchDemo: { en: "Watch demo", vi: "Xem demo" } as Localized,
  },
  spotlight: {
    eyebrow: { en: "Interactive", vi: "Tương tác" } as Localized,
    title: { en: "Meet PTalk", vi: "Gặp gỡ PTalk" } as Localized,
    lead: {
      en: "Everything we build is meant to be touched, moved, and explored. Here's PTalk, live in 3D — drag to spin it, scroll to zoom in.",
      vi: "Mọi thứ chúng tôi tạo ra đều để chạm, di chuyển và khám phá. Đây là PTalk, sống động trong không gian 3D — kéo để xoay, cuộn để phóng to.",
    } as Localized,
    hint: { en: "Drag to rotate · scroll to zoom", vi: "Kéo để xoay · cuộn để phóng to" } as Localized,
  },
  ecosystem: {
    eyebrow: { en: "Ecosystem", vi: "Hệ sinh thái" } as Localized,
    title: { en: "App highlights", vi: "Ứng dụng tiêu biểu" } as Localized,
    ssoPrefix: { en: "All apps connected via ", vi: "Tất cả ứng dụng kết nối qua " } as Localized,
    ssoStrong: { en: "Single Sign-On", vi: "Đăng nhập một lần" } as Localized,
    learnMore: { en: "Learn more", vi: "Tìm hiểu thêm" } as Localized,
  },
  team: {
    eyebrow: { en: "The people", vi: "Con người" } as Localized,
    title: { en: "The team", vi: "Đội ngũ" } as Localized,
    lead: {
      en: "Mentors and makers from PTIT building the lab, one project at a time.",
      vi: "Những người cố vấn và sáng tạo từ PTIT cùng xây dựng phòng lab, qua từng dự án.",
    } as Localized,
  },
  partners: {
    eyebrow: { en: "Collaboration", vi: "Hợp tác" } as Localized,
    title: { en: "Partners & collaborations", vi: "Đối tác & Hợp tác" } as Localized,
  },
  contact: {
    eyebrow: { en: "Reach out", vi: "Kết nối" } as Localized,
    title: { en: "Contact", vi: "Liên hệ" } as Localized,
    heading: { en: "Get in touch", vi: "Liên hệ với chúng tôi" } as Localized,
    blurb: {
      en: "Interested in our research, products, or collaboration opportunities? We'd love to hear from you.",
      vi: "Quan tâm đến nghiên cứu, sản phẩm hay cơ hội hợp tác của chúng tôi? Chúng tôi rất mong được lắng nghe bạn.",
    } as Localized,
    emailLabel: { en: "Email", vi: "Email" } as Localized,
    phoneLabel: { en: "Phone", vi: "Điện thoại" } as Localized,
    addressLabel: { en: "Address", vi: "Địa chỉ" } as Localized,
    nameLabel: { en: "Name", vi: "Họ tên" } as Localized,
    namePlaceholder: { en: "Your name", vi: "Tên của bạn" } as Localized,
    emailPlaceholder: { en: "your@email.com", vi: "ban@email.com" } as Localized,
    messageLabel: { en: "Message", vi: "Lời nhắn" } as Localized,
    messagePlaceholder: { en: "Tell us about your inquiry…", vi: "Hãy cho chúng tôi biết bạn cần gì…" } as Localized,
    send: { en: "Send message", vi: "Gửi lời nhắn" } as Localized,
    sending: { en: "Sending…", vi: "Đang gửi…" } as Localized,
    success: { en: "Message sent — thank you!", vi: "Đã gửi — cảm ơn bạn!" } as Localized,
    error: { en: "Something went wrong. Please try again.", vi: "Đã có lỗi xảy ra. Vui lòng thử lại." } as Localized,
  },
  nav: {
    download: { en: "Download", vi: "Tải xuống" } as Localized,
    viewAll: { en: "View all products", vi: "Xem tất cả sản phẩm" } as Localized,
    getInTouch: { en: "Get in touch", vi: "Liên hệ" } as Localized,
    menu: { en: "Menu", vi: "Menu" } as Localized,
  },
  footer: {
    contact: { en: "Contact", vi: "Liên hệ" } as Localized,
    follow: { en: "Follow us", vi: "Theo dõi" } as Localized,
    rights: { en: "All rights reserved.", vi: "Bảo lưu mọi quyền." } as Localized,
  },
  products: {
    eyebrow: { en: "Our apps", vi: "Ứng dụng của chúng tôi" } as Localized,
    title: { en: "Products", vi: "Sản phẩm" } as Localized,
    intro: {
      en: "Explore our unified ecosystem of applications. Sign in once with your CTS account and reach every app seamlessly.",
      vi: "Khám phá hệ sinh thái ứng dụng hợp nhất của chúng tôi. Đăng nhập một lần bằng tài khoản CTS và truy cập mọi ứng dụng liền mạch.",
    } as Localized,
    downloadHeading: { en: "Download our apps", vi: "Tải ứng dụng của chúng tôi" } as Localized,
    download: { en: "Download", vi: "Tải xuống" } as Localized,
    backText: { en: "Interested in our research and other projects?", vi: "Quan tâm đến nghiên cứu và các dự án khác của chúng tôi?" } as Localized,
    backCta: { en: "Explore our full ecosystem", vi: "Khám phá toàn bộ hệ sinh thái" } as Localized,
  },
  vrTour: {
    eyebrow: { en: "PTIT Virtual Tour", vi: "Tham quan ảo PTIT" } as Localized,
    loading: { en: "Loading the 360° campus experience…", vi: "Đang tải trải nghiệm khuôn viên 360°…" } as Localized,
    back: { en: "Back", vi: "Quay lại" } as Localized,
  },
};
