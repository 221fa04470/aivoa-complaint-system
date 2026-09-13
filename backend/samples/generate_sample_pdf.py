"""Generates samples/customer_complaint_metformin.pdf - a realistic-looking
customer complaint letter for a pharmaceutical API, used to demo the
'document extraction' AI tool. Run: python generate_sample_pdf.py
"""
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

styles = getSampleStyleSheet()
title_style = ParagraphStyle("TitleC", parent=styles["Title"], fontSize=15, spaceAfter=4)
label_style = ParagraphStyle("Label", parent=styles["Normal"], fontName="Helvetica-Bold")
body_style = styles["Normal"]

doc = SimpleDocTemplate("customer_complaint_metformin.pdf", pagesize=letter,
                         topMargin=0.7 * inch, bottomMargin=0.7 * inch)
story = []

story.append(Paragraph("Vantara Life Sciences Pvt. Ltd.", title_style))
story.append(Paragraph("Customer Complaint Notification Form", styles["Heading2"]))
story.append(Spacer(1, 10))

meta_table = Table([
    ["Complaint Ref No.:", "VLS-CC-2026-0342", "Date Received:", "12-Jul-2026"],
    ["Received Via:", "Email", "Received By:", "Quality Assurance Dept."],
], colWidths=[1.4 * inch, 2.0 * inch, 1.3 * inch, 1.6 * inch])
meta_table.setStyle(TableStyle([
    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
    ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 9),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story.append(meta_table)
story.append(Spacer(1, 14))

story.append(Paragraph("Complainant Details", styles["Heading3"]))
complainant_table = Table([
    ["Customer Name:", "Meridian Pharma Distributors Pvt. Ltd."],
    ["Customer Type:", "Distributor"],
    ["Contact Person:", "R. Suresh Babu, QA Manager"],
    ["Contact Email:", "qa.meridianpharma@example.com"],
], colWidths=[1.6 * inch, 4.4 * inch])
complainant_table.setStyle(TableStyle([
    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 9.5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
]))
story.append(complainant_table)
story.append(Spacer(1, 14))

story.append(Paragraph("Product Details", styles["Heading3"]))
product_table = Table([
    ["Product Name:", "Metformin Hydrochloride API"],
    ["Product Strength / Grade:", "IP/BP Grade"],
    ["Batch / Lot Number:", "MFH260712A"],
    ["Manufacturing Date:", "02-Jan-2026"],
    ["Expiry Date:", "01-Jan-2028"],
    ["Affected Quantity:", "25 kg (1 HDPE drum)"],
], colWidths=[1.9 * inch, 4.1 * inch])
product_table.setStyle(TableStyle([
    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 9.5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
]))
story.append(product_table)
story.append(Spacer(1, 14))

story.append(Paragraph("Complaint Description", styles["Heading3"]))
story.append(Paragraph(
    "During incoming quality inspection at our warehouse, the received drum of Metformin "
    "Hydrochloride API (Batch MFH260712A) was found to have a strong, unusual odour inconsistent "
    "with the reference standard. The Certificate of Analysis accompanying the shipment did not "
    "flag any deviation. We request immediate investigation into the root cause and confirmation "
    "of whether the remaining stock from this batch is safe to release for formulation use.",
    body_style,
))
story.append(Spacer(1, 10))
story.append(Paragraph(
    "This complaint is being raised as a potential quality/GMP deviation and we request a formal "
    "CAPA response within the standard 15-business-day timeline as per our Quality Agreement.",
    body_style,
))

doc.build(story)
print("Wrote customer_complaint_metformin.pdf")
