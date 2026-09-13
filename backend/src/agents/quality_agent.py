"""Quality Agent - Real-time validation & anomaly detection"""
import logging

logger = logging.getLogger(__name__)


class QualityAgent:
    """Validate answers in real-time"""

    def __init__(self):
        pass

    def validate_household_data(self, household_data: dict) -> list:
        """Check for inconsistencies"""
        issues = []

        # Age checks
        if household_data.get("respondent_age", 0) < 18:
            issues.append("Respondent age is less than 18")

        # Household size checks
        household_size = household_data.get("household_size", 0)
        members_count = len(household_data.get("members", []))
        if members_count > 0 and abs(members_count - household_size) > 2:
            issues.append(f"Household size ({household_size}) doesn't match members listed ({members_count})")

        # Income checks
        if household_data.get("monthly_income", 0) < 0:
            issues.append("Monthly income cannot be negative")

        return issues

    def check_anomalies(self, answer: str, field: str, previous_answers: dict) -> bool:
        """Check if answer seems anomalous"""
        # Simple checks for common data entry errors
        if field == "age":
            try:
                age = int(answer)
                return 0 <= age <= 150
            except:
                return False

        if field == "income":
            try:
                income = int(answer)
                return income >= 0
            except:
                return False

        return True
