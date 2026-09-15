import { useState, useEffect } from 'react';
import styles from '@/styles/reports.module.css';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'summary' | 'analytics' | 'demographics'>('summary');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState('');
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint =
        activeTab === 'summary'
          ? '/api/reports/summary'
          : '/api/reports/analytics';
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}?format=json`
      );
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(String(err));
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    setGeneratingPDF(true);
    try {
      // Generate HTML content
      const htmlContent = generateHTMLReport();

      // Use html2pdf library
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      document.head.appendChild(script);

      script.onload = () => {
        const element = document.createElement('div');
        element.innerHTML = htmlContent;

        const opt = {
          margin: 10,
          filename: `welfare-report-${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
        };

        // @ts-ignore
        html2pdf().set(opt).from(element).save();
        setGeneratingPDF(false);
      };
    } catch (err) {
      console.error('PDF generation error:', err);
      setGeneratingPDF(false);
    }
  };

  const generateHTMLReport = () => {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff;">
        <h1 style="text-align: center; margin-bottom: 10px;">🕌 Muslim Welfare AI System</h1>
        <p style="text-align: center; color: #e0e0e0; margin-bottom: 40px;">Household Survey Analytics Report</p>

        <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 12px; margin-bottom: 30px; backdrop-filter: blur(10px);">
          <h2 style="margin-bottom: 20px;">📊 Summary Statistics</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 8px;">
              <p style="margin: 0; font-size: 12px; opacity: 0.8;">Total Households</p>
              <h3 style="margin: 10px 0 0 0; font-size: 32px;">${response?.summary?.total_households || 0}</h3>
            </div>
            <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 8px;">
              <p style="margin: 0; font-size: 12px; opacity: 0.8;">Total Members</p>
              <h3 style="margin: 10px 0 0 0; font-size: 32px;">${response?.summary?.total_members || 0}</h3>
            </div>
            <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 8px;">
              <p style="margin: 0; font-size: 12px; opacity: 0.8;">Muslim Members</p>
              <h3 style="margin: 10px 0 0 0; font-size: 32px;">${response?.summary?.total_muslim_members || 0}</h3>
            </div>
            <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 8px;">
              <p style="margin: 0; font-size: 12px; opacity: 0.8;">Avg Household Size</p>
              <h3 style="margin: 10px 0 0 0; font-size: 32px;">${response?.summary?.avg_household_size?.toFixed(2) || '0.00'}</h3>
            </div>
          </div>
        </div>

        <div style="text-align: center; color: #e0e0e0; font-size: 12px;">
          Generated on ${new Date().toLocaleString()}
        </div>
      </div>
    `;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>📊 Analytics Dashboard</h1>
          <p>Muslim Welfare AI System - Real-time Data Insights</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tabButton} ${activeTab === 'summary' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <span className={styles.tabIcon}>📈</span>
          Summary
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'analytics' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <span className={styles.tabIcon}>📊</span>
          Analytics
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'demographics' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('demographics')}
        >
          <span className={styles.tabIcon}>👥</span>
          Demographics
        </button>
      </div>

      {/* Action Bar */}
      <div className={styles.actionBar}>
        <button
          className={`${styles.button} ${styles.primaryButton} ${generatingPDF ? styles.loading : ''}`}
          onClick={generatePDF}
          disabled={generatingPDF || !response}
        >
          {generatingPDF ? '⏳ Generating PDF...' : '📄 Export as PDF'}
        </button>
        <button className={styles.button} onClick={fetchReport} disabled={loading}>
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorBox}>
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className={styles.loadingBox}>
          <div className={styles.spinner}></div>
          <p>Loading analytics data...</p>
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && response && !loading && (
        <div className={styles.tabContent}>
          <div className={styles.cardsGrid}>
            <div className={`${styles.card} ${styles.cardPrimary}`}>
              <div className={styles.cardIcon}>🏠</div>
              <div className={styles.cardContent}>
                <p className={styles.cardLabel}>Total Households</p>
                <h2 className={styles.cardValue}>{response.summary?.total_households || 0}</h2>
              </div>
            </div>

            <div className={`${styles.card} ${styles.cardSecondary}`}>
              <div className={styles.cardIcon}>👥</div>
              <div className={styles.cardContent}>
                <p className={styles.cardLabel}>Total Members</p>
                <h2 className={styles.cardValue}>{response.summary?.total_members || 0}</h2>
              </div>
            </div>

            <div className={`${styles.card} ${styles.cardTertiary}`}>
              <div className={styles.cardIcon}>🕌</div>
              <div className={styles.cardContent}>
                <p className={styles.cardLabel}>Muslim Members</p>
                <h2 className={styles.cardValue}>{response.summary?.total_muslim_members || 0}</h2>
              </div>
            </div>

            <div className={`${styles.card} ${styles.cardQuaternary}`}>
              <div className={styles.cardIcon}>📊</div>
              <div className={styles.cardContent}>
                <p className={styles.cardLabel}>Avg Household Size</p>
                <h2 className={styles.cardValue}>{response.summary?.avg_household_size?.toFixed(2) || '0.00'}</h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && response && !loading && (
        <div className={styles.tabContent}>
          <div className={styles.analyticsGrid}>
            <div className={styles.chartCard}>
              <h3>📍 Geographic Distribution</h3>
              <div className={styles.placeholder}>
                <p>Location-based household distribution data</p>
              </div>
            </div>

            <div className={styles.chartCard}>
              <h3>💰 Income Distribution</h3>
              <div className={styles.statsSection}>
                <div className={styles.statItem}>
                  <label>Average Income</label>
                  <p className={styles.statValue}>
                    ₹{response.income_statistics?.average?.toFixed(0) || '0'}
                  </p>
                </div>
                <div className={styles.statItem}>
                  <label>Minimum Income</label>
                  <p className={styles.statValue}>
                    ₹{response.income_statistics?.min?.toFixed(0) || '0'}
                  </p>
                </div>
                <div className={styles.statItem}>
                  <label>Maximum Income</label>
                  <p className={styles.statValue}>
                    ₹{response.income_statistics?.max?.toFixed(0) || '0'}
                  </p>
                </div>
                <div className={styles.statItem}>
                  <label>Median Income</label>
                  <p className={styles.statValue}>
                    ₹{response.income_statistics?.median?.toFixed(0) || '0'}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.chartCard}>
              <h3>🎓 Education Level</h3>
              <div className={styles.placeholder}>
                <p>Educational attainment statistics</p>
              </div>
            </div>

            <div className={styles.chartCard}>
              <h3>💼 Employment Status</h3>
              <div className={styles.placeholder}>
                <p>Employment and occupation data</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demographics Tab */}
      {activeTab === 'demographics' && response && !loading && (
        <div className={styles.tabContent}>
          <div className={styles.demographicsGrid}>
            <div className={styles.demoCard}>
              <h3>👨 Gender Distribution</h3>
              <div className={styles.distributionList}>
                {response.gender_distribution ? (
                  Object.entries(response.gender_distribution).map(([key, value]: [string, any]) => (
                    <div key={key} className={styles.distributionItem}>
                      <span className={styles.label}>{key}</span>
                      <div className={styles.barContainer}>
                        <div
                          className={styles.bar}
                          style={{ width: `${(value / (response.total_members || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <span className={styles.value}>{value}</span>
                    </div>
                  ))
                ) : (
                  <p className={styles.noData}>No gender data available</p>
                )}
              </div>
            </div>

            <div className={styles.demoCard}>
              <h3>📅 Age Distribution</h3>
              <div className={styles.distributionList}>
                {response.age_distribution ? (
                  Object.entries(response.age_distribution).map(([key, value]: [string, any]) => (
                    <div key={key} className={styles.distributionItem}>
                      <span className={styles.label}>{key}</span>
                      <div className={styles.barContainer}>
                        <div
                          className={styles.bar}
                          style={{ width: `${(value / (response.total_members || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <span className={styles.value}>{value}</span>
                    </div>
                  ))
                ) : (
                  <p className={styles.noData}>No age data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Ration Card Stats */}
          <div className={styles.ratioCard}>
            <h3>🎟️ Ration Card Holders</h3>
            <div className={styles.ratioStats}>
              <div className={styles.ratioItem}>
                <div className={styles.ratioValue}>{response.ration_card_holders || 0}</div>
                <div className={styles.ratioLabel}>Total Holders</div>
              </div>
              {response.total_members > 0 && (
                <div className={styles.ratioItem}>
                  <div className={styles.ratioValue}>
                    {((response.ration_card_holders || 0) / (response.total_members || 1) * 100).toFixed(1)}%
                  </div>
                  <div className={styles.ratioLabel}>Coverage Rate</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Raw Data Section */}
      <div className={styles.rawDataSection}>
        <details>
          <summary>📄 View Raw JSON Data</summary>
          <pre className={styles.jsonDisplay}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
