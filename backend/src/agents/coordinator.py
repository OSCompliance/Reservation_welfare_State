"""Coordinator Agent - Manages survey flow and section routing"""
import logging
from typing import Dict, Any, Optional
from uuid import UUID
from anthropic import Anthropic
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Survey sections and their questions
SURVEY_SECTIONS = {
    "A": {
        "title": "Household Information",
        "questions_count": 8,
        "key_fields": ["household_size", "respondent_name", "respondent_age"]
    },
    "B": {
        "title": "Family Members",
        "questions_count": 15,
        "key_fields": ["members"]
    },
    "C": {
        "title": "Education (Current Generation)",
        "questions_count": 12,
        "key_fields": ["education_level", "graduation_year"]
    },
    "D": {
        "title": "Technical Education",
        "questions_count": 5,
        "key_fields": ["technical_degree"]
    },
    "E": {
        "title": "Reservation Awareness",
        "questions_count": 8,
        "key_fields": ["used_3_5_quota", "barriers"]
    },
    "F": {
        "title": "Government Employment",
        "questions_count": 12,
        "key_fields": ["govt_employment", "department"]
    },
    "G": {
        "title": "Women's Education",
        "questions_count": 10,
        "key_fields": ["women_education"]
    },
    "H": {
        "title": "Women's Employment",
        "questions_count": 8,
        "key_fields": ["women_employment"]
    },
    "I": {
        "title": "Perceived Impact",
        "questions_count": 10,
        "key_fields": ["perceived_benefit"]
    },
    "V": {
        "title": "Verification",
        "questions_count": 6,
        "key_fields": ["documents"]
    },
}


class CoordinatorAgent:
    """Orchestrates the multilingual household survey"""

    def __init__(self, language: str, db: Session):
        self.language = language
        self.db = db
        self.client = Anthropic()
        self.model = "claude-opus-4-1-20250805"

    async def ask_next_question(
        self,
        household_id: UUID,
        current_section: str,
        previous_answer: Optional[str] = None,
        respondent_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Generate the next question in the survey

        Args:
            household_id: UUID of the household
            current_section: Current section (A, B, C, etc.)
            previous_answer: The previous answer to validate
            respondent_context: Context about respondent (name, age, etc.)

        Returns:
            Dictionary with next question, input_type, options, skip_logic
        """

        # Build system prompt
        system_prompt = self._build_system_prompt(current_section)

        # Build user prompt
        user_prompt = self._build_user_prompt(
            current_section,
            previous_answer,
            respondent_context
        )

        # Call Claude
        response = self.client.messages.create(
            model=self.model,
            max_tokens=500,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_prompt}
            ]
        )

        # Parse response
        response_text = response.content[0].text
        question_data = self._parse_response(response_text)

        return {
            "execution_id": str(household_id),
            "section": current_section,
            "language": self.language,
            "question": question_data.get("question", ""),
            "input_type": question_data.get("input_type", "text"),
            "options": question_data.get("options", []),
            "skip_logic": question_data.get("skip_logic", {}),
            "follow_up": question_data.get("follow_up"),
            "progress": self._calculate_progress(current_section),
        }

    def _build_system_prompt(self, section: str) -> str:
        """Build system prompt for Claude"""
        language_native = {
            "ta": "Tamil",
            "hi": "Hindi",
            "ur": "Urdu",
            "en": "English",
            "te": "Telugu",
            "ml": "Malayalam",
        }.get(self.language, "English")

        section_info = SURVEY_SECTIONS.get(section, {})

        return f"""You are a compassionate household survey assistant for a Muslim welfare research study in India.

Language: {language_native} ({self.language})
Section: {section} - {section_info.get('title', 'Unknown')}

Your role:
1. Ask ONE clear, respectful question in {language_native}
2. Speak conversationally, not formally
3. Use simple language (12th grade level max)
4. Be culturally sensitive
5. Validate answers against household data
6. Auto-skip irrelevant questions

Response format (JSON):
{{
  "question": "Question in {language_native}",
  "input_type": "text|voice|select|number|photo",
  "options": ["option1", "option2"],
  "skip_logic": {{"if": "field=value", "skip_next": ["Q1", "Q2"]}},
  "follow_up": "Follow-up question if needed"
}}

IMPORTANT:
- Only output valid JSON
- Question should be 1-2 sentences max
- No explanation, just the JSON object"""

    def _build_user_prompt(
        self,
        section: str,
        previous_answer: Optional[str],
        respondent_context: Optional[Dict[str, Any]]
    ) -> str:
        """Build user prompt for Claude"""
        prompt = f"Survey Section: {section}\n"

        if respondent_context:
            prompt += f"\nRespondent Context:\n"
            for key, value in respondent_context.items():
                prompt += f"- {key}: {value}\n"

        if previous_answer:
            prompt += f"\nPrevious Answer: {previous_answer}\n"
            prompt += "Please validate this answer and ask the next logical question.\n"
        else:
            prompt += "\nPlease ask the first question for this section.\n"

        prompt += "\nRespond with JSON only (no other text)."

        return prompt

    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Claude's response"""
        import json

        try:
            # Extract JSON from response
            start_idx = response_text.find("{")
            end_idx = response_text.rfind("}") + 1

            if start_idx == -1 or end_idx == 0:
                return {
                    "question": response_text,
                    "input_type": "text",
                    "options": [],
                }

            json_str = response_text[start_idx:end_idx]
            data = json.loads(json_str)

            return {
                "question": data.get("question", ""),
                "input_type": data.get("input_type", "text"),
                "options": data.get("options", []),
                "skip_logic": data.get("skip_logic", {}),
                "follow_up": data.get("follow_up"),
            }
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse agent response: {e}")
            return {
                "question": response_text,
                "input_type": "text",
                "options": [],
            }

    def _calculate_progress(self, current_section: str) -> int:
        """Calculate survey progress percentage"""
        section_order = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "V"]
        if current_section in section_order:
            index = section_order.index(current_section)
            return int((index / len(section_order)) * 100)
        return 0
