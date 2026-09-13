"""Reservation Agent - Section E: 3.5% reservation awareness & usage"""
import json
import logging
from anthropic import Anthropic

logger = logging.getLogger(__name__)


class ReservationAgent:
    """Handle Section E: Awareness and usage of 3.5% Muslim reservation"""

    def __init__(self, language: str):
        self.language = language
        self.client = Anthropic()
        self.model = "claude-opus-4-1-20250805"

    async def ask_question(self, question_index: int, respondent_context: dict, previous_answer: str = None):
        """Ask about 3.5% reservation awareness"""

        questions = [
            "heard_of_35_percent",  # Have you heard of 3.5% Muslim quota?
            "used_for_education",   # Used for college admission?
            "used_for_government_job",  # Used for government job?
            "awareness_level",      # How well do you understand it?
            "barriers_faced",       # What stopped you from using it?
            "documents_required",   # Do you have required certificates?
        ]

        question_key = questions[question_index % len(questions)]

        system_prompt = f"""You are asking about 3.5% Muslim reservation in {self.language}.

Section E: Reservation Awareness
Question: {question_key}

Ask naturally:
- "Have you heard about the 3.5% internal reservation for Muslims?"
- "Did you use this reservation when applying to college?"
- "Did you try to use this quota for a government job?"
- "What do you think about this reservation policy?"
- "What problems did you face when trying to use the quota?"
- "Do you have the caste certificate or required documents?"

Response (JSON):
{{"question": "...", "input_type": "text|select", "options": []}}"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=300,
            system=system_prompt,
            messages=[{"role": "user", "content": f"Question: {question_key}\nContext: {json.dumps(respondent_context)}\nPrevious: {previous_answer}"}]
        )

        try:
            text = response.content[0].text
            start = text.find("{")
            end = text.rfind("}") + 1
            return json.loads(text[start:end]) if start != -1 else {"question": text, "input_type": "text"}
        except:
            return {"question": response.content[0].text, "input_type": "text"}
