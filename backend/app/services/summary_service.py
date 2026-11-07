import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class SummaryService:
    def __init__(self):
        self.provider = settings.SUMMARY_PROVIDER.lower()
        self.api_key = settings.SUMMARY_API_KEY.strip()

    @property
    def is_external_configured(self) -> bool:
        """Check if an external LLM provider is configured."""
        return bool(self.api_key and self.provider in ("gemini", "openai"))

    def get_provider_status(self) -> Dict[str, Any]:
        """Return provider configuration info."""
        return {
            "provider": self.provider,
            "configured": self.is_external_configured,
            "fallback_available": True,
            "supports": [
                "short_summary",
                "detailed_summary",
                "key_points",
                "meeting_notes",
                "lecture_notes",
                "action_items",
                "questions",
                "keywords",
            ],
        }

    async def generate_smart_notes(self, transcript_text: str) -> Dict[str, Any]:
        """
        Generate all 8 smart note sections from the transcript.
        Tries configured external provider, or falls back to intelligent built-in extractor.
        """
        cleaned_text = transcript_text.strip()
        if not cleaned_text:
            return self._empty_notes()

        if self.is_external_configured:
            try:
                if self.provider == "gemini":
                    return await self._generate_with_gemini(cleaned_text)
                elif self.provider == "openai":
                    return await self._generate_with_openai(cleaned_text)
            except Exception as e:
                logger.warning(f"External AI summarizer failed ({e}), falling back to built-in extractor.")

        # Built-in structured heuristic NLP generator
        return self._generate_builtin_notes(cleaned_text)

    def _empty_notes(self) -> Dict[str, Any]:
        return {
            "summary": "No transcript text available to summarize.",
            "detailed_summary": "",
            "key_points": [],
            "action_items": [],
            "questions": [],
            "meeting_notes": "",
            "lecture_notes": "",
            "keywords": [],
            "provider": self.provider,
        }

    async def _generate_with_gemini(self, text: str) -> Dict[str, Any]:
        """Call Google Gemini API if configured."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
        prompt = (
            "You are an expert AI note-taker and intelligence engine. Analyze the following transcript "
            "and generate a JSON object with EXACTLY these keys:\n"
            "- summary: a concise 2-3 sentence overview\n"
            "- detailed_summary: a thorough multi-paragraph synthesis\n"
            "- key_points: list of 4-8 important bullet points\n"
            "- meeting_notes: markdown notes structured with Agenda, Discussion, and Outcomes\n"
            "- lecture_notes: structured study notes with Key Concepts and Explanations\n"
            "- action_items: list of tasks, assignments or next steps\n"
            "- questions: list of important questions raised or answered in the speech\n"
            "- keywords: list of 6-12 important topical terms\n\n"
            f"Transcript:\n{text}\n\n"
            "Return ONLY valid JSON."
        )

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"},
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_json = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(raw_json)
                parsed["provider"] = "gemini"
                return parsed
            else:
                raise Exception(f"Gemini API returned status {resp.status_code}: {resp.text}")

    async def _generate_with_openai(self, text: str) -> Dict[str, Any]:
        """Call OpenAI API if configured."""
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        prompt = (
            "Analyze this transcript and respond with a JSON object containing keys: "
            "summary, detailed_summary, key_points (array), meeting_notes, lecture_notes, "
            "action_items (array), questions (array), keywords (array).\n\n"
            f"Transcript: {text}"
        )
        payload = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"},
        }
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                parsed = json.loads(data["choices"][0]["message"]["content"])
                parsed["provider"] = "openai"
                return parsed
            else:
                raise Exception(f"OpenAI API returned status {resp.status_code}")

    def _generate_builtin_notes(self, text: str) -> Dict[str, Any]:
        """
        Intelligent local NLP heuristic engine when external provider is not configured.
        Parses sentences, identifies questions, extracts action verbs, generates structured outlines.
        """
        sentences = [s.strip() for s in re.split(r"(?<=[.!?।])\s+", text) if s.strip()]
        if not sentences:
            sentences = [text]

        # 1. Short summary: take first 2-3 most representative sentences
        summary = " ".join(sentences[:min(2, len(sentences))])

        # 2. Detailed summary
        if len(sentences) <= 3:
            detailed = text
        else:
            midpoint = len(sentences) // 2
            detailed = (
                f"The audio recording begins by addressing the initial context: \"{sentences[0]}\"\n\n"
                f"As the discussion progresses, key details are examined: \"{sentences[midpoint]}\"\n\n"
                f"Finally, the discourse concludes with: \"{sentences[-1]}\""
            )

        # 3. Key points
        key_points = []
        for s in sentences:
            if len(s.split()) >= 4 and len(key_points) < 6:
                key_points.append(s.rstrip(".!?।"))
        if not key_points:
            key_points = [text[:100]]

        # 4. Questions
        questions = [s for s in sentences if s.endswith("?") or any(w in s.lower() for w in ["what", "how", "why", "who", "when", "where", "kya", "kaise", "kyun"])]
        if not questions:
            questions = [
                "What is the primary objective communicated in this audio?",
                "What key decisions or insights were established during this segment?"
            ]

        # 5. Action items
        action_verbs = ["need to", "must", "will", "should", "follow up", "submit", "prepare", "send", "call", "review", "complete", "schedule", "implement", "update"]
        action_items = []
        for s in sentences:
            if any(v in s.lower() for v in action_verbs) and len(action_items) < 5:
                action_items.append(s.rstrip(".!?।"))
        if not action_items:
            action_items = [
                "Review the transcribed notes for core takeaways and milestones",
                "Share the summary and action items with all relevant stakeholders"
            ]

        # 6. Keywords
        words = re.findall(r"\b[A-Za-z\u0900-\u0D7F]{4,}\b", text)
        stop_words = {"this", "that", "with", "from", "have", "were", "been", "there", "about", "which", "would", "their"}
        freq: Dict[str, int] = {}
        for w in words:
            wl = w.lower()
            if wl not in stop_words:
                freq[w] = freq.get(w, 0) + 1
        sorted_keywords = sorted(freq.keys(), key=lambda x: freq[x], reverse=True)[:8]
        if not sorted_keywords:
            sorted_keywords = ["VoxNote", "Transcription", "Audio", "Notes"]

        # 7. Meeting Notes
        meeting_notes = (
            "### 📋 Meeting Overview\n"
            f"- **Topic/Context:** {summary}\n\n"
            "### 💬 Key Discussions\n"
            + "\n".join(f"- {kp}" for kp in key_points[:4])
            + "\n\n### 🎯 Outcomes & Decisions\n"
            + "\n".join(f"- {act}" for act in action_items[:3])
        )

        # 8. Lecture Notes
        lecture_notes = (
            "### 🎓 Core Subject Concepts\n"
            f"- **Introduction:** {summary}\n\n"
            "### 📚 Detailed Explanations\n"
            + "\n".join(f"1. **Concept:** {kp}" for kp in key_points[:4])
            + "\n\n### 💡 Study Review Questions\n"
            + "\n".join(f"- {q}" for q in questions[:3])
        )

        return {
            "summary": summary,
            "detailed_summary": detailed,
            "key_points": key_points,
            "action_items": action_items,
            "questions": questions,
            "meeting_notes": meeting_notes,
            "lecture_notes": lecture_notes,
            "keywords": sorted_keywords,
            "provider": "built-in (NLP Heuristics)",
        }


summary_service = SummaryService()
