"""Household Agent - Sections A & B: Basic household & member roster"""
import logging
from typing import Dict, Any, Optional
from uuid import UUID
from anthropic import Anthropic

logger = logging.getLogger(__name__)


class HouseholdAgent:
    """Handle Sections A-B: Household information and member roster"""

    def __init__(self, language: str):
        self.language = language
        self.client = Anthropic()
        self.model = "claude-opus-4-1-20250805"
        self.section = "A-B"

        # Track which section we're in
        self.section_a_questions = [
            "household_head_name",
            "respondent_age",
            "respondent_gender",
            "household_size",
            "house_type",
            "monthly_income",
            "primary_occupation",
        ]

        self.section_b_questions = [
            "member_name",
            "member_age",
            "member_gender",
            "member_relationship",
            "member_education",
            "member_employment",
        ]

    async def ask_question(
        self,
        current_question_index: int,
        respondent_context: Dict[str, Any],
        previous_answer: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate next question for Section A-B"""

        # Determine which section and question
        if current_question_index < len(self.section_a_questions):
            section = "A"
            question_key = self.section_a_questions[current_question_index]
        else:
            section = "B"
            member_index = current_question_index - len(self.section_a_questions)
            question_key = self.section_b_questions[member_index % len(self.section_b_questions)]

        system_prompt = self._build_system_prompt(section, question_key)
        user_prompt = self._build_user_prompt(
            section, question_key, respondent_context, previous_answer
        )

        response = self.client.messages.create(
            model=self.model,
            max_tokens=400,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}]
        )

        response_text = response.content[0].text
        question_data = self._parse_response(response_text)

        return {
            "section": section,
            "question_key": question_key,
            "question": question_data.get("question", ""),
            "input_type": question_data.get("input_type", "text"),
            "options": question_data.get("options", []),
            "validation_rules": question_data.get("validation_rules", {}),
            "follow_up": question_data.get("follow_up"),
        }

    def _build_system_prompt(self, section: str, question_key: str) -> str:
        """Build system prompt for household questions"""
        language_map = {
            "ta": "Tamil",
            "hi": "Hindi",
            "ur": "Urdu",
            "en": "English",
            "te": "Telugu",
            "ml": "Malayalam",
        }
        language_name = language_map.get(self.language, "English")

        if section == "A":
            return f"""You are a compassionate household survey assistant speaking {language_name}.

Section A: Basic Household Information
Question Key: {question_key}

Ask ONE simple question about the household. Be conversational and respectful.
Examples:
- "What is the name of the person I'm speaking with?"
- "How old are you?"
- "How many people live in this household?"
- "What type of house do you live in?" (concrete, tiled, mud)

Response format (JSON only):
{{
  "question": "Question in {language_name}",
  "input_type": "text|number|select",
  "options": ["option1", "option2"],
  "validation_rules": {{"min": 0, "max": 150}},
  "follow_up": "Follow-up if answer is unexpected"
}}"""
        else:  # Section B
            return f"""You are asking about a family member for the {language_name} survey.

Section B: Family Member Details
Question Key: {question_key}

Ask about ONE member. Be respectful and conversational.
Examples:
- "What is this person's relationship to you?" (spouse, child, parent, etc.)
- "How old are they?"
- "What is their education level?" (no school, primary, secondary, college)
- "What do they do for work?" (government job, private, business, homemaker, student)

Response format (JSON only):
{{
  "question": "Question in {language_name}",
  "input_type": "text|number|select",
  "options": ["option1", "option2"],
  "validation_rules": {{"min": 0, "max": 120}},
  "follow_up": "Clarification if needed"
}}"""

    def _build_user_prompt(
        self,
        section: str,
        question_key: str,
        respondent_context: Dict[str, Any],
        previous_answer: Optional[str],
    ) -> str:
        """Build user prompt for household agent"""
        prompt = f"Section: {section}\nQuestion: {question_key}\n"

        if respondent_context:
            prompt += "\nContext:\n"
            for key, value in respondent_context.items():
                prompt += f"- {key}: {value}\n"

        if previous_answer:
            prompt += f"\nPrevious answer: {previous_answer}\n"
            prompt += "Validate this and ask the next logical question.\n"
        else:
            prompt += "\nAsk the first question for this section.\n"

        prompt += "\nRespond with JSON only."
        return prompt

    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """Parse agent response"""
        import json
        try:
            start_idx = response_text.find("{")
            end_idx = response_text.rfind("}") + 1
            if start_idx == -1:
                return {"question": response_text, "input_type": "text"}
            json_str = response_text[start_idx:end_idx]
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            logger.error(f"Parse error: {e}")
            return {"question": response_text, "input_type": "text"}


# Validation helpers
def validate_age(value: str) -> bool:
    try:
        age = int(value)
        return 0 <= age <= 150
    except:
        return False


def validate_household_size(value: str) -> bool:
    try:
        size = int(value)
        return 1 <= size <= 20
    except:
        return False


def validate_income(value: str) -> bool:
    try:
        income = int(value)
        return income >= 0
    except:
        return False
