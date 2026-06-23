import type { Localized } from "./types";

export const sso: {
  eyebrow: Localized;
  title: Localized;
  description: Localized;
  caption: Localized;
  bannerTitle: Localized;
  bannerDescription: Localized;
  image: string;
  lead: Localized;
  more: Localized;
} = {
  eyebrow: { en: "Identity", vi: "Định danh" },
  title: { en: "One Account", vi: "Một tài khoản" },
  description: {
    en: "Access every CTS Lab application with a single account. Sign in once and move seamlessly across PTalk, VietCreative, Vision Tale, Unilearn, and more.",
    vi: "Truy cập mọi ứng dụng của CTS Lab chỉ với một tài khoản. Đăng nhập một lần và di chuyển liền mạch giữa PTalk, VietCreative, Vision Tale, Unilearn và hơn thế nữa.",
  },
  caption: { en: "Single Sign-On", vi: "Đăng nhập một lần" },
  bannerTitle: {
    en: "One Account · Single Sign-On · Unified Ecosystem",
    vi: "Một tài khoản · Đăng nhập một lần · Hệ sinh thái hợp nhất",
  },
  bannerDescription: {
    en: "Every CTS Lab application shares a single authentication system. Create your account once and enjoy seamless access across all our products.",
    vi: "Mọi ứng dụng của CTS Lab dùng chung một hệ thống xác thực. Tạo tài khoản một lần và tận hưởng quyền truy cập liền mạch trên mọi sản phẩm.",
  },
  image: "/img/1account.png",
  lead: { en: "One account for every CTS Lab app.", vi: "Một tài khoản cho mọi ứng dụng CTS Lab." },
  more: { en: "…and more.", vi: "…và hơn thế nữa." },
};
