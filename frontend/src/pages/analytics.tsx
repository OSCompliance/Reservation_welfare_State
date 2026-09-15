import React, { useState, useEffect } from 'react';
import styles from '@/styles/analytics.module.css';

interface AnalyticsData {
  total_households: number;
  avg_household_size: number;
  gender_distribution: Record<string, number>;
  age_distribution: Record<string, number>;
  income_distribution: Record<string, number>;
  education_distribution: Record<string, number>;
}

const AnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsData>({
    total_households: 1247,
    avg_household_size: 4.2,
    gender_distribution: { Male: 52, Female: 48 },
    age_distribution: { '18-25': 15, '26-35': 28, '36-45': 30, '46-55': 18, '56+': 9 },
    income_distribution: { '<50k': 35, '50-100k': 42, '100-150k': 18, '150k+': 5 },
    education_distribution: { 'Primary': 25, 'Secondary': 38, 'Higher': 28, 'None': 9 }
  });

  const [sampleSize, setSampleSize] = useState(600);
  const [marginOfError, setMarginOfError] = useState(4.0);

  useEffect(() => {
    // Calculate margin of error
    const moe = (1.96 * Math.sqrt(0.25 / sampleSize) * 100);
    setMarginOfError(parseFloat(moe.toFixed(1)));
  }, [sampleSize]);

  const ChartCanvas = ({ data, labels, title }: any) => (
    <div className={styles.chartContainer}>
      <h3>{title}</h3>
      <div className={styles.simpleChart}>
        <div className={styles.barChart}>
          {labels.map((label: string, idx: number) => {
            const value = data[idx];
            const maxValue = Math.max(...data);
            const percentage = (value / maxValue) * 100;
            return (
              <div key={label} className={styles.bar}>
                <div
                  className={styles.barFill}
                  style={{
                    height: `${percentage}%`,
                    background: `hsl(${idx * 60}, 70%, 50%)`
                  }}
                />
                <div className={styles.barLabel}>{label}</div>
                <div className={styles.barValue}>{value}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Analytics & Insights</h1>
        <p>Research data analysis and visualization</p>
      </div>

      {/* Key Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Total Households</div>
          <div className={styles.metricValue}>{data.total_households.toLocaleString()}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Avg Household Size</div>
          <div className={styles.metricValue}>{data.avg_household_size}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Sample Size</div>
          <div className={styles.metricValue}>{sampleSize}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Margin of Error</div>
          <div className={styles.metricValue}>±{marginOfError}%</div>
        </div>
      </div>

      {/* Sample Size Calculator */}
      <div className={styles.calculatorSection}>
        <h2>Sample Size Calculator</h2>
        <div className={styles.calculatorBox}>
          <div className={styles.sliderControl}>
            <label>Adjust Sample Size</label>
            <input
              type="range"
              min="200"
              max="2000"
              step="100"
              value={sampleSize}
              onChange={(e) => setSampleSize(parseInt(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.sliderValues}>
              <span>{sampleSize} respondents</span>
              <span>±{marginOfError}% error</span>
            </div>
          </div>
          <p className={styles.calculatorNote}>
            95% confidence level. Adjust the slider to see how sample size affects margin of error.
          </p>
        </div>
      </div>

      {/* Data Visualizations */}
      <div className={styles.chartsGrid}>
        <ChartCanvas
          data={[data.gender_distribution.Male, data.gender_distribution.Female]}
          labels={['Male', 'Female']}
          title="Gender Distribution"
        />
        <ChartCanvas
          data={Object.values(data.age_distribution)}
          labels={Object.keys(data.age_distribution)}
          title="Age Distribution"
        />
        <ChartCanvas
          data={Object.values(data.income_distribution)}
          labels={Object.keys(data.income_distribution)}
          title="Income Distribution"
        />
        <ChartCanvas
          data={Object.values(data.education_distribution)}
          labels={Object.keys(data.education_distribution)}
          title="Education Level"
        />
      </div>

      {/* Insights */}
      <div className={styles.insightsSection}>
        <h2>Key Insights</h2>
        <div className={styles.insightCards}>
          <div className={styles.insightCard}>
            <h4>Gender Parity</h4>
            <p>Near-equal gender distribution (52% male, 48% female) suggests balanced household sampling.</p>
          </div>
          <div className={styles.insightCard}>
            <h4>Peak Employment Age</h4>
            <p>36-45 age group represents 30% of sample, indicating peak economic participation.</p>
          </div>
          <div className={styles.insightCard}>
            <h4>Income Concentration</h4>
            <p>42% of households in 50-100k income bracket shows middle-income predominance.</p>
          </div>
          <div className={styles.insightCard}>
            <h4>Education Access</h4>
            <p>66% have completed secondary or higher education, indicating good educational access.</p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className={styles.exportSection}>
        <h2>Export Data</h2>
        <div className={styles.exportButtons}>
          <button className={styles.exportBtn}>📊 Export as CSV</button>
          <button className={styles.exportBtn}>📄 Export as PDF</button>
          <button className={styles.exportBtn}>📋 Export as JSON</button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
