import type { CollectionConfig } from "payload";

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "year", "featured", "order"],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "description",
      type: "richText",
      localized: true,
    },
    {
      name: "excerpt",
      type: "textarea",
      localized: true,
      admin: {
        description: "Short description for cards and previews",
      },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "category",
      type: "select",
      required: true,
      options: [
        { label: "Artificial Intelligence", value: "ai" },
        { label: "Robotics", value: "robotics" },
        { label: "Virtual Reality", value: "vr" },
        { label: "IoT", value: "iot" },
        { label: "Research", value: "research" },
        { label: "Commercial", value: "commercial" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "year",
      type: "number",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "tags",
      type: "array",
      fields: [
        {
          name: "tag",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Show in horizontal scroll gallery",
      },
    },
    {
      name: "order",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        description: "Display order (lower = first)",
      },
    },
  ],
};
