"""Employment Agent - Sections F & H: Government & private employment"""
import json
from anthropic import Anthropic


class EmploymentAgent:
    def __init__(self, language: str):
        self.language = language
        self.client = Anthropic()
        self.model = "claude-opus-4-1-20250805"

    async def ask_question(self, question_index: int, respondent_context: dict, previous_answer: str = None):
        """Ask about employment (government & private)"""
        questions = [
            "current_employment_status",  # Employed/Unemployed/Self-employed?
            "employment_type",  # Government/Private/Self-employed?
            "job_title",  # What is your job title?
            "department",  # Which department/company?
            "monthly_salary",  # How much do you earn?
            "years_in_job",  # How long in this job?
            "used_reservation_for_job",  # Used 3.5% quota for job?
        ]

        question_key = questions[question_index % len(questions)]
        system_prompt = f"""Ask about employment in {self.language}.
        
Questions:
- Current employment status?
- What type of job (government/private/business)?
- Job title?
- Department/Organization?
- Monthly salary/income?
- How long in this job?
- Did you use 3.5% quota for this job?

Response (JSON): {{"question": "...", "input_type": "text|number|select"}}"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=300,
            system=system_prompt,
            messages=[{"role": "user", "content": f"Question: {question_key}"}]
        )

        try:
            text = response.content[0].text
            start = text.find("{")
            end = text.rfind("}") + 1
            return json.loads(text[start:end]) if start != -1 else {"question": text}
        except:
            return {"question": response.content[0].text, "input_type": "text"}
