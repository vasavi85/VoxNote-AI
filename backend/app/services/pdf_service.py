import io
import json
from datetime import datetime
from typing import Optional, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from app.models.transcript import Transcript, Note

# Register Arial if available
try:
    pdfmetrics.registerFont(TTFont("Arial", "C:/Windows/Fonts/arial.ttf"))
    DEFAULT_FONT = "Arial"
    BOLD_FONT = "Arial"
except Exception:
    DEFAULT_FONT = "Helvetica"
    BOLD_FONT = "Helvetica-Bold"


class PDFService:
    @staticmethod
    def generate_transcript_pdf(transcript: Transcript, note: Optional[Note] = None) -> bytes:
        """Generate a professionally designed PDF for a transcript and its notes."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40,
        )

        styles = getSampleStyleSheet()

        # Custom styles
        header_title = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName=BOLD_FONT,
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#4F46E5"),  # Indigo
        )

        header_subtitle = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontName=DEFAULT_FONT,
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#6B7280"),
        )

        section_heading = ParagraphStyle(
            "SectionHeading",
            parent=styles["Normal"],
            fontName=BOLD_FONT,
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#1F2937"),
            spaceBefore=14,
            spaceAfter=6,
        )

        body_text = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontName=DEFAULT_FONT,
            fontSize=10,
            leading=15,
            textColor=colors.HexColor("#374151"),
        )

        bullet_item = ParagraphStyle(
            "BulletItem",
            parent=styles["Normal"],
            fontName=DEFAULT_FONT,
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor("#374151"),
            leftIndent=15,
            firstLineIndent=-10,
        )

        elements = []

        # 1. Header Banner
        elements.append(Paragraph("VoxNote AI", header_title))
        elements.append(Paragraph("Turn Every Voice Into Intelligent Notes &bull; Powered by Gnani AI Prisma v3.0", header_subtitle))
        elements.append(Spacer(1, 12))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#E5E7EB"), spaceAfter=14))

        # 2. Metadata Box
        meta_data = [
            [
                Paragraph("<b>Filename:</b>", body_text),
                Paragraph(transcript.filename, body_text),
                Paragraph("<b>Language:</b>", body_text),
                Paragraph(f"{transcript.detected_language or transcript.language}", body_text),
            ],
            [
                Paragraph("<b>Duration:</b>", body_text),
                Paragraph(f"{transcript.duration:.1f}s ({round(transcript.duration / 60, 1)}m)", body_text),
                Paragraph("<b>Output Mode:</b>", body_text),
                Paragraph(transcript.output_mode.capitalize(), body_text),
            ],
            [
                Paragraph("<b>Model:</b>", body_text),
                Paragraph(transcript.model, body_text),
                Paragraph("<b>Date:</b>", body_text),
                Paragraph(transcript.created_at.strftime("%Y-%m-%d %H:%M UTC"), body_text),
            ],
        ]

        meta_table = Table(meta_data, colWidths=[70, 190, 80, 190])
        meta_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F9FAFB")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#E5E7EB")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#F3F4F6")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ])
        )
        elements.append(meta_table)
        elements.append(Spacer(1, 16))

        # 3. Smart Notes Section (if available)
        if note and (note.summary or note.key_points or note.action_items):
            elements.append(Paragraph("Smart Notes &amp; Summary", section_heading))
            elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#4F46E5"), spaceAfter=8))

            if note.summary:
                elements.append(Paragraph("<b>Executive Summary:</b>", body_text))
                elements.append(Spacer(1, 4))
                elements.append(Paragraph(note.summary, body_text))
                elements.append(Spacer(1, 10))

            # Key Points
            kp_list = []
            if note.key_points:
                try:
                    kp_list = json.loads(note.key_points) if isinstance(note.key_points, str) and note.key_points.startswith("[") else [note.key_points]
                except Exception:
                    kp_list = [note.key_points]
            if kp_list:
                elements.append(Paragraph("<b>Key Takeaways:</b>", body_text))
                elements.append(Spacer(1, 4))
                for pt in kp_list:
                    elements.append(Paragraph(f"&bull; {pt}", bullet_item))
                elements.append(Spacer(1, 10))

            # Action Items
            act_list = []
            if note.action_items:
                try:
                    act_list = json.loads(note.action_items) if isinstance(note.action_items, str) and note.action_items.startswith("[") else [note.action_items]
                except Exception:
                    act_list = [note.action_items]
            if act_list:
                elements.append(Paragraph("<b>Action Items &amp; Next Steps:</b>", body_text))
                elements.append(Spacer(1, 4))
                for act in act_list:
                    elements.append(Paragraph(f"[ ] {act}", bullet_item))
                elements.append(Spacer(1, 10))

            # Important Questions
            q_list = []
            if note.questions:
                try:
                    q_list = json.loads(note.questions) if isinstance(note.questions, str) and note.questions.startswith("[") else [note.questions]
                except Exception:
                    q_list = [note.questions]
            if q_list:
                elements.append(Paragraph("<b>Important Questions:</b>", body_text))
                elements.append(Spacer(1, 4))
                for q in q_list:
                    elements.append(Paragraph(f"? {q}", bullet_item))
                elements.append(Spacer(1, 10))

            elements.append(Spacer(1, 10))

        # 4. Full Audio Transcript
        elements.append(Paragraph("Full Audio Transcript", section_heading))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB"), spaceAfter=8))
        
        transcript_paras = transcript.transcript_text.split("\n")
        for p in transcript_paras:
            if p.strip():
                # Escape angle brackets if any
                clean_p = p.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                elements.append(Paragraph(clean_p, body_text))
                elements.append(Spacer(1, 6))

        # Build document
        doc.build(elements)
        return buffer.getvalue()


pdf_service = PDFService()
