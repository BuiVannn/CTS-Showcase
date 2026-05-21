import type { GlobalConfig } from "payload";

export const Partners: GlobalConfig = {
  slug: "partners",
  admin: {
    group: "Settings",
  },
  fields: [
    {
      name: "heading",
      type: "text",
      localized: true,
      defaultValue: "PARTNERS & COLLABORATIONS",
    },
    {
      name: "partnersList",
      type: "array",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "logo",
          type: "upload",
          relationTo: "media",
        },
        {
          name: "url",
          type: "text",
        },
        {
          name: "order",
          type: "number",
          defaultValue: 0,
        },
      ],
    },
  ],
};
