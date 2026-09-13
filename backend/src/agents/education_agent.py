"""Education Agent - Sections C & D: Education history"""
import json
import logging
from typing import Dict, Any, Optional
from anthropic import Anthropic

logger = logging.getLogger(__name__)


class EducationAgent:
    """Handle Sections C-D: Education history (school, college, technical)"""

    def __init__(self, language: str):
        self.language = language
        self.client = Anthropic()
        self.model = "claude-opus-4-1-20250805"

    async def ask_question(
        self,
        member_id: str,
        question_index: int,
        respondent_context: Dict[str, Any],
        previous_answer: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate education history question"""

        education_questions = [
            "school_type",  # Government/Private/Madrasa
            "highest_qualification",  # 10th, 12th, College, etc.
            "field_of_study",  # Science, Commerce, Humanities, Engineering, etc.
            "graduation_year",  # Year
            "first_generation_graduate",  # Yes/No
            "used_quota_for_admission",  # Used 3.5% quota?
            "scholarship_received",  # Yes/No
            "reason_discontinued",  # If didn't complete
        ]

        question_key = education_questions[question_index % len(education_questions)]

        system_prompt = f"""You are asking about education history in {self.language}.

Member: {respondent_context.get('member_name', 'Unknown')}
Question: {question_key}

Ask naturally about their education. Examples:
- "What type of school did you go to?" (government, private, madrasa)
- "What is your highest qualification?" (10th, 12th, college degree)
- "What field did you study?" (science, commerce, engineering)
- "What year did you graduate?"
- "Are you the first in your family to get a college degree?"
- "Did you use any quota system for college admission?"

Response (JSON only):
{{
  "question": "Question in {self.language}",
  "input_type": "text|select|date",
  "options": ["option1", "option2"]
}}"""

        user_prompt = f"""Question Key: {question_key}
Context: {json.dumps(respondent_context)}
Previous Answer: {previous_answer or 'None'}

Ask the next education question."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=300,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}]
        )

        return self._parse_response(response.content[0].text)

    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """Parse response"""
        try:
            start_idx = response_text.find("{")
            end_idx = response_text.rfind("}") + 1
            if start_idx == -1:
                return {"question": response_text, "input_type": "text"}
            return json.loads(response_text[start_idx:end_idx])
        except:
            return {"question": response_text, "input_type": "text"}
