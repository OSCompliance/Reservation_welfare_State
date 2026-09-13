"""Analysis Agent - Generate recommendations & policy insights"""
import json
from anthropic import Anthropic


class AnalysisAgent:
    def __init__(self):
        self.client = Anthropic()
        self.model = "claude-opus-4-1-20250805"

    async def generate_recommendations(self, household_data: dict) -> dict:
        """Generate policy recommendations for a household"""
        system_prompt = """You are a policy analyst for the 3.5% Muslim reservation study.
        
Based on household data, suggest:
1. Which welfare schemes they're eligible for
2. Which government programs could help
3. Barriers they face in accessing these benefits
4. Policy recommendations to address barriers

Response (JSON): {"recommendations": [...], "barriers": [...], "policy_suggestions": [...]}"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=500,
            system=system_prompt,
            messages=[{"role": "user", "content": f"Household: {json.dumps(household_data)}"}]
        )

        try:
            text = response.content[0].text
            start = text.find("{")
            end = text.rfind("}") + 1
            return json.loads(text[start:end]) if start != -1 else {}
        except:
            return {}
