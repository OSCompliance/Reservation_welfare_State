import React, { useState, useEffect } from 'react';
import styles from '@/styles/governance.module.css';

interface IRBSubmission {
  id: string;
  project_id: string;
  submission_date: string;
  status: string;
  risk_level: string;
  approved_date?: string;
}

interface ConsentForm {
  id: string;
  language: string;
  status: string;
  created_at: string;
}

const GovernancePage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [irbSubmissions, setIrbSubmissions] = useState<IRBSubmission[]>([]);
  const [consentForms, setConsentForms] = useState<ConsentForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    fetchGovernanceData();
  }, []);

  const fetchGovernanceData = async () => {
    try {
      // Fetch IRB submissions
      const irbRes = await fetch('https://muslim-welfare-api.nazeersoft.workers.dev/api/irb/submissions');
      const irbData = await irbRes.json();
      setIrbSubmissions(irbData.data || []);

      // Fetch IRB stats
      const statsRes = await fetch('https://muslim-welfare-api.nazeersoft.workers.dev/api/irb/dashboard/stats');
      const statsData = await statsRes.json();
      setStats(statsData.data || {});

      // Fetch consent forms (from governance endpoint)
      const consentRes = await fetch('https://muslim-welfare-api.nazeersoft.workers.dev/api/governance/consent-forms');
      const consentData = await consentRes.json();
      setConsentForms(consentData.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return styles.statusApproved;
      case 'pending':
        return styles.statusPending;
      case 'conditional_approval':
        return styles.statusConditional;
      case 'rejected':
        return styles.statusRejected;
      default:
        return styles.statusDefault;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Governance & Compliance</h1>
          <p>Research ethics, IRB approvals, consent management</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'dashboard' ? styles.active : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'irb' ? styles.active : ''}`}
          onClick={() => setActiveTab('irb')}
        >
          ✅ IRB Submissions
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'consent' ? styles.active : ''}`}
          onClick={() => setActiveTab('consent')}
        >
          📝 Consent Forms
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading governance data...</div>
      ) : (
        <>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className={styles.dashboardSection}>
              <h2>Governance Dashboard</h2>

              {/* IRB Stats Cards */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{stats.submissions?.pending || 0}</div>
                  <div className={styles.statLabel}>Pending Reviews</div>
                  <div className={styles.statColor} style={{ background: '#ffc107' }}></div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statValue}>{stats.submissions?.approved || 0}</div>
                  <div className={styles.statLabel}>Approved</div>
                  <div className={styles.statColor} style={{ background: '#28a745' }}></div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statValue}>{stats.submissions?.conditional || 0}</div>
                  <div className={styles.statLabel}>Conditional</div>
                  <div className={styles.statColor} style={{ background: '#17a2b8' }}></div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statValue}>{stats.submissions?.rejected || 0}</div>
                  <div className={styles.statLabel}>Rejected</div>
                  <div className={styles.statColor} style={{ background: '#dc3545' }}></div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className={styles.metricsBox}>
                <h3>Performance Metrics</h3>
                <div className={styles.metricItem}>
                  <span>Average Review Time:</span>
                  <span className={styles.metricValue}>{stats.performance?.average_review_days || 0} days</span>
                </div>
                <div className={styles.metricItem}>
                  <span>Approval Rate:</span>
                  <span className={styles.metricValue}>{stats.performance?.approval_rate || '0%'}</span>
                </div>
              </div>

              {/* Compliance Checklist */}
              <div className={styles.checklistBox}>
                <h3>✓ Compliance Checklist</h3>
                <div className={styles.checklistItems}>
                  <label><input type="checkbox" defaultChecked /> Informed Consent Policy Active</label>
                  <label><input type="checkbox" defaultChecked /> IRB Review Policy Active</label>
                  <label><input type="checkbox" defaultChecked /> Data Security Policy Active</label>
                  <label><input type="checkbox" defaultChecked /> Community Return Policy Active</label>
                  <label><input type="checkbox" defaultChecked /> Open Data Policy Active</label>
                  <label><input type="checkbox" defaultChecked /> Researcher Equity Policy Active</label>
                </div>
              </div>
            </div>
          )}

          {/* IRB Submissions Tab */}
          {activeTab === 'irb' && (
            <div className={styles.irbSection}>
              <h2>IRB Submissions</h2>
              {irbSubmissions.length === 0 ? (
                <div className={styles.emptyState}>No submissions yet</div>
              ) : (
                <div className={styles.submissionsList}>
                  {irbSubmissions.slice(0, 10).map(submission => (
                    <div key={submission.id} className={styles.submissionCard}>
                      <div className={styles.submissionHeader}>
                        <span className={styles.date}>{submission.submission_date}</span>
                        <span className={`${styles.status} ${getStatusBadgeClass(submission.status)}`}>
                          {submission.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className={styles.submissionBody}>
                        <div className={styles.riskLevel}>
                          Risk Level: <strong>{submission.risk_level}</strong>
                        </div>
                        {submission.approved_date && (
                          <div className={styles.approvalDate}>
                            Approved: {submission.approved_date}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Consent Forms Tab */}
          {activeTab === 'consent' && (
            <div className={styles.consentSection}>
              <h2>Consent Forms by Language</h2>
              <div className={styles.languageGrid}>
                {['en', 'ta', 'hi', 'ur', 'te', 'ml'].map(lang => {
                  const langForms = consentForms.filter(f => f.language === lang);
                  const langName: Record<string, string> = {
                    en: 'English',
                    ta: 'Tamil',
                    hi: 'Hindi',
                    ur: 'Urdu',
                    te: 'Telugu',
                    ml: 'Malayalam'
                  };

                  return (
                    <div key={lang} className={styles.languageCard}>
                      <h3>{langName[lang]}</h3>
                      <div className={styles.formCount}>
                        {langForms.length} form{langForms.length !== 1 ? 's' : ''}
                      </div>
                      {langForms.length > 0 && (
                        <div className={styles.formsList}>
                          {langForms.map(form => (
                            <div key={form.id} className={styles.formItem}>
                              <span className={styles.status}>{form.status}</span>
                              <span className={styles.date}>{new Date(form.created_at).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GovernancePage;
