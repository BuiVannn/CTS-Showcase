import { getPayload } from "payload";
import config from "@payload-config";

const seed = async () => {
  const payload = await getPayload({ config });

  payload.logger.info("Seeding database...");

  // Create admin user
  await payload.create({
    collection: "users",
    data: {
      email: "admin@cts.ptit.edu.vn",
      password: "admin123",
      name: "Admin",
    },
  });
  payload.logger.info("Admin user created: admin@cts.ptit.edu.vn / admin123");

  // Seed products
  const products = [
    {
      title: "AI Tutoring System",
      excerpt: "Intelligent tutoring platform powered by machine learning algorithms that adapt to each student's learning style and pace.",
      slug: "ai-tutoring",
      category: "ai" as const,
      year: 2024,
      featured: true,
      order: 1,
      tags: [{ tag: "AI" }, { tag: "Machine Learning" }, { tag: "Education" }],
    },
    {
      title: "STEM Robotics Kit",
      excerpt: "Modular robotics kit designed for hands-on STEM education, featuring programmable sensors and actuators.",
      slug: "stem-robotics",
      category: "robotics" as const,
      year: 2024,
      featured: true,
      order: 2,
      tags: [{ tag: "Robotics" }, { tag: "IoT" }, { tag: "Education" }],
    },
    {
      title: "VR Science Lab",
      excerpt: "Immersive virtual reality laboratory for conducting scientific experiments in a safe, simulated environment.",
      slug: "vr-science-lab",
      category: "vr" as const,
      year: 2023,
      featured: true,
      order: 3,
      tags: [{ tag: "VR" }, { tag: "Science" }, { tag: "Simulation" }],
    },
    {
      title: "Smart Campus IoT",
      excerpt: "Internet of Things platform for smart campus management, integrating environmental monitoring and automation.",
      slug: "smart-campus",
      category: "iot" as const,
      year: 2024,
      featured: true,
      order: 4,
      tags: [{ tag: "IoT" }, { tag: "Smart City" }, { tag: "Sensors" }],
    },
    {
      title: "EdTech Analytics Dashboard",
      excerpt: "Data analytics platform providing insights into student performance, engagement, and learning outcomes.",
      slug: "edtech-analytics",
      category: "commercial" as const,
      year: 2025,
      featured: false,
      order: 5,
      tags: [{ tag: "Analytics" }, { tag: "Data Science" }, { tag: "EdTech" }],
    },
    {
      title: "NLP Research Framework",
      excerpt: "Natural language processing research framework for Vietnamese language understanding and generation.",
      slug: "nlp-framework",
      category: "research" as const,
      year: 2025,
      featured: true,
      order: 6,
      tags: [{ tag: "NLP" }, { tag: "Research" }, { tag: "Vietnamese" }],
    },
  ];

  for (const product of products) {
    await payload.create({
      collection: "products",
      data: product,
    });
  }
  payload.logger.info(`Seeded ${products.length} products`);

  // Seed team members
  const teamMembers = [
    {
      name: "Dr. Nguyen Van A",
      role: "Lab Director",
      bio: "Leading researcher in AI and machine learning with over 15 years of experience in STEM education innovation.",
      highlight: true,
      order: 1,
      social: {
        email: "nguyenvana@ptit.edu.vn",
        linkedin: "https://linkedin.com",
      },
    },
    {
      name: "Tran Thi B",
      role: "Senior Researcher",
      bio: "Specialist in robotics and embedded systems, passionate about hands-on STEM learning methodologies.",
      order: 2,
      social: {
        email: "tranthib@ptit.edu.vn",
      },
    },
    {
      name: "Le Van C",
      role: "VR Developer",
      bio: "Expert in virtual reality and 3D visualization, creating immersive educational experiences.",
      order: 3,
      social: {
        github: "https://github.com",
      },
    },
    {
      name: "Pham Thi D",
      role: "Data Scientist",
      bio: "Data analytics specialist focused on educational data mining and learning analytics.",
      order: 4,
    },
    {
      name: "Hoang Van E",
      role: "IoT Engineer",
      bio: "Hardware and firmware engineer specializing in IoT sensor networks and smart campus solutions.",
      order: 5,
    },
    {
      name: "Vo Thi F",
      role: "UX Designer",
      bio: "User experience designer creating intuitive interfaces for educational technology products.",
      order: 6,
    },
  ];

  for (const member of teamMembers) {
    await payload.create({
      collection: "team",
      data: member,
    });
  }
  payload.logger.info(`Seeded ${teamMembers.length} team members`);

  // Seed site settings
  await payload.updateGlobal({
    slug: "site-settings",
    data: {
      siteName: "Creative Technologies and Simulation Lab",
      siteDescription: "STEM Innovation Lab at the Posts & Telecommunications Institute of Technology",
      heroHeadline: "CTS LAB",
      heroSubtitle: "Hanoi - Vietnam",
      heroBadge: "Posts & Telecommunications Institute of Technology",
      missionStatement:
        "Pioneering the future of STEM education through innovative research, cutting-edge technology, and hands-on learning experiences. We bridge the gap between academic theory and real-world application.",
      aboutDescription:
        "Founded at PTIT, CTS Lab is dedicated to advancing STEM education through technology-driven solutions.",
      contactEmail: "contact@cts.ptit.edu.vn",
      contactPhone: "+84 xxx xxx xxx",
      contactAddress: "Posts & Telecommunications Institute of Technology, Km 10, Nguyen Trai, Ha Dong, Hanoi",
      socialLinks: {
        github: "https://github.com/cts",
        facebook: "https://facebook.com/cts",
        youtube: "https://youtube.com/@cts",
        email: "contact@cts.ptit.edu.vn",
      },
    },
  });
  payload.logger.info("Site settings seeded");

  // Seed partners
  await payload.updateGlobal({
    slug: "partners",
    data: {
      heading: "PARTNERS & COLLABORATIONS",
      partnersList: [
        { name: "PTIT", url: "https://ptit.edu.vn", order: 1 },
        { name: "Ministry of Education", url: "#", order: 2 },
        { name: "Viettel Group", url: "#", order: 3 },
        { name: "FPT Software", url: "#", order: 4 },
        { name: "VNPT", url: "#", order: 5 },
        { name: "UNESCO", url: "#", order: 6 },
      ],
    },
  });
  payload.logger.info("Partners seeded");

  payload.logger.info("Seed complete!");
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
