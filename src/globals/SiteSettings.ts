import type { GlobalConfig } from "payload";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  admin: {
    group: "Settings",
  },
  fields: [
    {
      name: "siteName",
      type: "text",
      required: true,
      localized: true,
      defaultValue: "Creative Technologies and Simulation Lab",
    },
    {
      name: "siteDescription",
      type: "textarea",
      localized: true,
      defaultValue:
        "STEM Innovation Lab at the Posts & Telecommunications Institute of Technology",
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Hero",
          fields: [
            {
              name: "heroHeadline",
              type: "text",
              required: true,
              localized: true,
              defaultValue: "CTS LAB",
            },
            {
              name: "heroSubtitle",
              type: "text",
              localized: true,
              defaultValue: "Hanoi - Vietnam",
            },
            {
              name: "heroBadge",
              type: "text",
              localized: true,
              defaultValue: "Posts & Telecommunications Institute of Technology",
            },
          ],
        },
        {
          label: "About",
          fields: [
            {
              name: "missionStatement",
              type: "textarea",
              localized: true,
              defaultValue:
                "Pioneering the future of STEM education through innovative research, cutting-edge technology, and hands-on learning experiences.",
            },
            {
              name: "aboutDescription",
              type: "textarea",
              localized: true,
            },
          ],
        },
        {
          label: "Contact",
          fields: [
            {
              name: "contactEmail",
              type: "email",
              defaultValue: "contact@cts.ptit.edu.vn",
            },
            {
              name: "contactPhone",
              type: "text",
              defaultValue: "+84 xxx xxx xxx",
            },
            {
              name: "contactAddress",
              type: "textarea",
              localized: true,
              defaultValue:
                "Posts & Telecommunications Institute of Technology, Hanoi, Vietnam",
            },
          ],
        },
        {
          label: "Social",
          fields: [
            {
              name: "socialLinks",
              type: "group",
              fields: [
                { name: "github", type: "text" },
                { name: "facebook", type: "text" },
                { name: "youtube", type: "text" },
                { name: "linkedin", type: "text" },
                { name: "email", type: "email" },
              ],
            },
          ],
        },
      ],
    },
  ],
};
