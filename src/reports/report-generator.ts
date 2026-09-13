// Report Generator - Creates analytics and household reports

import type { HouseholdReport, MemberReport, AnalyticsReport, ReportOptions, PDFContent } from './types';

export class ReportGenerator {
  /**
   * Generate household report
   */
  generateHouseholdReport(
    householdId: string,
    householdName: string,
    address: string,
    phone: string,
    totalMembers: number,
    muslimMembers: number,
    members: MemberReport[]
  ): HouseholdReport {
    return {
      household_id: householdId,
      household_name: householdName,
      address,
      phone,
      total_members: totalMembers,
      muslim_members: muslimMembers,
      generated_at: new Date().toISOString(),
      generated_by: 'muslim-welfare-api',
    };
  }

  /**
   * Generate analytics report from multiple households
   */
  generateAnalyticsReport(households: any[]): AnalyticsReport {
    let totalMembers = 0;
    let totalMuslimMembers = 0;
    const genderCount = { male: 0, female: 0, other: 0 };
    const ageGroups = { under_18: 0, between_18_60: 0, over_60: 0 };
    const educationMap: Record<string, number> = {};
    const occupationMap: Record<string, number> = {};
    let totalIncome = 0;
    let rationCardCount = 0;
    const incomes: number[] = [];

    households.forEach((household) => {
      totalMembers += household.total_members || 0;
      totalMuslimMembers += household.muslim_members || 0;

      if (household.members && Array.isArray(household.members)) {
        household.members.forEach((member: any) => {
          // Gender distribution
          if (member.gender) {
            const gender = member.gender.toLowerCase();
            if (gender === 'male') genderCount.male++;
            else if (gender === 'female') genderCount.female++;
            else genderCount.other++;
          }

          // Age distribution
          if (member.age) {
            if (member.age < 18) ageGroups.under_18++;
            else if (member.age <= 60) ageGroups.between_18_60++;
            else ageGroups.over_60++;
          }

          // Education
          if (member.education) {
            educationMap[member.education] = (educationMap[member.education] || 0) + 1;
          }

          // Occupation
          if (member.occupation) {
            occupationMap[member.occupation] = (occupationMap[member.occupation] || 0) + 1;
          }

          // Income
          if (member.income) {
            totalIncome += member.income;
            incomes.push(member.income);
          }

          // Ration cards
          if (member.ration_card) {
            rationCardCount++;
          }
        });
      }
    });

    // Calculate income statistics
    incomes.sort((a, b) => a - b);
    const median = incomes.length > 0
      ? incomes.length % 2 === 0
        ? (incomes[incomes.length / 2 - 1] + incomes[incomes.length / 2]) / 2
        : incomes[Math.floor(incomes.length / 2)]
      : 0;

    return {
      total_households: households.length,
      total_members: totalMembers,
      total_muslim_members: totalMuslimMembers,
      average_household_size: households.length > 0 ? totalMembers / households.length : 0,
      average_members_per_household: households.length > 0 ? totalMembers / households.length : 0,
      gender_distribution: genderCount,
      age_distribution: ageGroups,
      education_distribution: educationMap,
      occupation_distribution: occupationMap,
      income_statistics: {
        average: incomes.length > 0 ? totalIncome / incomes.length : 0,
        min: incomes.length > 0 ? incomes[0] : 0,
        max: incomes.length > 0 ? incomes[incomes.length - 1] : 0,
        median,
      },
      ration_card_holders: rationCardCount,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Generate PDF as HTML string (for client-side PDF generation)
   */
  generateHTMLReport(report: AnalyticsReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Muslim Welfare Analytics Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 20px; }
    .section { margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #bdc3c7; padding: 10px; text-align: left; }
    th { background-color: #3498db; color: white; }
    tr:nth-child(even) { background-color: #ecf0f1; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-value { font-size: 24px; font-weight: bold; color: #2980b9; }
    .metric-label { color: #7f8c8d; font-size: 12px; }
    .footer { margin-top: 50px; border-top: 1px solid #bdc3c7; padding-top: 10px; font-size: 12px; color: #7f8c8d; }
  </style>
</head>
<body>
  <h1>Muslim Welfare System - Analytics Report</h1>

  <div class="section">
    <h2>Summary Statistics</h2>
    <div class="metric">
      <div class="metric-value">${report.total_households}</div>
      <div class="metric-label">Total Households</div>
    </div>
    <div class="metric">
      <div class="metric-value">${report.total_members}</div>
      <div class="metric-label">Total Members</div>
    </div>
    <div class="metric">
      <div class="metric-value">${report.total_muslim_members}</div>
      <div class="metric-label">Muslim Members</div>
    </div>
    <div class="metric">
      <div class="metric-value">${report.average_household_size.toFixed(2)}</div>
      <div class="metric-label">Avg Household Size</div>
    </div>
  </div>

  <div class="section">
    <h2>Gender Distribution</h2>
    <table>
      <tr>
        <th>Gender</th>
        <th>Count</th>
        <th>Percentage</th>
      </tr>
      <tr>
        <td>Male</td>
        <td>${report.gender_distribution.male}</td>
        <td>${report.total_members > 0 ? ((report.gender_distribution.male / report.total_members) * 100).toFixed(2) : 0}%</td>
      </tr>
      <tr>
        <td>Female</td>
        <td>${report.gender_distribution.female}</td>
        <td>${report.total_members > 0 ? ((report.gender_distribution.female / report.total_members) * 100).toFixed(2) : 0}%</td>
      </tr>
      <tr>
        <td>Other</td>
        <td>${report.gender_distribution.other}</td>
        <td>${report.total_members > 0 ? ((report.gender_distribution.other / report.total_members) * 100).toFixed(2) : 0}%</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>Age Distribution</h2>
    <table>
      <tr>
        <th>Age Group</th>
        <th>Count</th>
        <th>Percentage</th>
      </tr>
      <tr>
        <td>Under 18</td>
        <td>${report.age_distribution.under_18}</td>
        <td>${report.total_members > 0 ? ((report.age_distribution.under_18 / report.total_members) * 100).toFixed(2) : 0}%</td>
      </tr>
      <tr>
        <td>18-60</td>
        <td>${report.age_distribution.between_18_60}</td>
        <td>${report.total_members > 0 ? ((report.age_distribution.between_18_60 / report.total_members) * 100).toFixed(2) : 0}%</td>
      </tr>
      <tr>
        <td>Over 60</td>
        <td>${report.age_distribution.over_60}</td>
        <td>${report.total_members > 0 ? ((report.age_distribution.over_60 / report.total_members) * 100).toFixed(2) : 0}%</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>Income Statistics</h2>
    <table>
      <tr>
        <th>Metric</th>
        <th>Amount (₹)</th>
      </tr>
      <tr>
        <td>Average Income</td>
        <td>${report.income_statistics.average.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Minimum Income</td>
        <td>${report.income_statistics.min.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Maximum Income</td>
        <td>${report.income_statistics.max.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Median Income</td>
        <td>${report.income_statistics.median.toFixed(2)}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>Other Statistics</h2>
    <div class="metric">
      <div class="metric-value">${report.ration_card_holders}</div>
      <div class="metric-label">Ration Card Holders</div>
    </div>
  </div>

  <div class="footer">
    <p>Report Generated: ${report.generated_at}</p>
    <p>Muslim Welfare AI System - Phase 4 Analytics</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate CSV report
   */
  generateCSVReport(report: AnalyticsReport): string {
    const lines: string[] = [];
    lines.push('Muslim Welfare System Analytics Report');
    lines.push(`Generated: ${report.generated_at}`);
    lines.push('');

    lines.push('SUMMARY STATISTICS');
    lines.push(`Total Households,${report.total_households}`);
    lines.push(`Total Members,${report.total_members}`);
    lines.push(`Total Muslim Members,${report.total_muslim_members}`);
    lines.push(`Average Household Size,${report.average_household_size.toFixed(2)}`);
    lines.push('');

    lines.push('GENDER DISTRIBUTION');
    lines.push('Gender,Count');
    lines.push(`Male,${report.gender_distribution.male}`);
    lines.push(`Female,${report.gender_distribution.female}`);
    lines.push(`Other,${report.gender_distribution.other}`);
    lines.push('');

    lines.push('AGE DISTRIBUTION');
    lines.push('Age Group,Count');
    lines.push(`Under 18,${report.age_distribution.under_18}`);
    lines.push(`18-60,${report.age_distribution.between_18_60}`);
    lines.push(`Over 60,${report.age_distribution.over_60}`);
    lines.push('');

    lines.push('INCOME STATISTICS');
    lines.push('Metric,Amount (₹)');
    lines.push(`Average Income,${report.income_statistics.average.toFixed(2)}`);
    lines.push(`Minimum Income,${report.income_statistics.min.toFixed(2)}`);
    lines.push(`Maximum Income,${report.income_statistics.max.toFixed(2)}`);
    lines.push(`Median Income,${report.income_statistics.median.toFixed(2)}`);
    lines.push('');

    lines.push('OTHER METRICS');
    lines.push(`Ration Card Holders,${report.ration_card_holders}`);

    return lines.join('\n');
  }
}

export function createReportGenerator(): ReportGenerator {
  return new ReportGenerator();
}
