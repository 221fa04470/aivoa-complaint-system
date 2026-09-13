export const FORM_SECTIONS = [
  {
    title: "1. Complainant",
    fields: [
      { key: "customer_name", label: "Customer name" },
      { key: "customer_type", label: "Customer type" },
      { key: "date_received", label: "Date received" },
      { key: "source_channel", label: "Source channel" },
    ],
  },
  {
    title: "2. Product",
    fields: [
      { key: "product_name", label: "Product name" },
      { key: "product_strength", label: "Strength / grade" },
      { key: "dosage_form", label: "Dosage form" },
      { key: "batch_number", label: "Batch / lot number" },
      { key: "manufacturing_date", label: "Manufacturing date" },
      { key: "expiry_date", label: "Expiry date" },
      { key: "affected_quantity", label: "Affected quantity" },
      { key: "packaging_details", label: "Packaging details" },
    ],
  },
  {
    title: "3. Defect Analysis",
    fields: [
      { key: "complaint_category", label: "Complaint category" },
      { key: "complaint_description", label: "Description", multiline: true },
    ],
  },
];

export const ALL_FIELD_KEYS = FORM_SECTIONS.flatMap((s) => s.fields.map((f) => f.key));
