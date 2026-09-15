import React, { useState, useEffect } from 'react';
import styles from '@/styles/research-studies.module.css';

interface Study {
  id: string;
  title: string;
  description: string;
  project_type: string;
  budget_amount: number;
  status: 'planning' | 'active' | 'completed' | 'archived';
  lead_researcher_id?: string;
  created_at: string;
}

const ResearchStudiesPage = () => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_studies: 0,
    total_households: 0,
    districts_covered: 0,
    researchers: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Initialize DB
      await fetch('https://muslim-welfare-api.nazeersoft.workers.dev/api/init', { method: 'POST' });

      // Fetch projects
      const res = await fetch('https://muslim-welfare-api.nazeersoft.workers.dev/api/projects');
      const data = await res.json();
      setStudies(data.data || []);

      // Calculate mock stats
      setStats({
        total_studies: data.data?.length || 0,
        total_households: Math.floor(Math.random() * 2000) + 500,
        districts_covered: 6,
        researchers: 8
      });
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStudyTypeLabel = (type: string) => {
    const labels: Record<string, { label: string; icon: string }> = {
      'primary_survey': { label: 'Primary Survey', icon: '📊' },
      'secondary_data': { label: 'Secondary Data', icon: '📈' },
      'qualitative': { label: 'Qualitative', icon: '🎤' },
      'rti_based': { label: 'RTI-Based', icon: '📋' }
    };
    return labels[type] || { label: type, icon: '📄' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'planning': return 'warning';
      case 'completed': return 'info';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'active': 'Field active',
      'planning': 'Planning',
      'completed': 'In progress',
      'archived': 'Year 2'
    };
    return labels[status] || status;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Research Studies</h1>
          <p>Research data platform — Tamil Nadu pilot</p>
        </div>
        <span className={styles.badge}>Demo prototype</span>
      </div>

      {/* Statistics Dashboard */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Active studies</p>
          <p className={styles.statValue}>{stats.total_studies}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Households surveyed</p>
          <p className={styles.statValue}>{stats.total_households.toLocaleString()}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Districts covered</p>
          <p className={styles.statValue}>{stats.districts_covered}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Researchers</p>
          <p className={styles.statValue}>{stats.researchers}</p>
        </div>
      </div>

      {/* Studies List */}
      {loading ? (
        <div className={styles.loading}>Loading research studies...</div>
      ) : studies.length === 0 ? (
        <div className={styles.empty}>
          <p>No studies yet. Create a new research project to get started!</p>
        </div>
      ) : (
        <div className={styles.studiesList}>
          <h2>Active Research Projects</h2>
          {studies.map((study, idx) => {
            const typeInfo = getStudyTypeLabel(study.project_type);
            const statusColor = getStatusColor(study.status);
            return (
              <div key={study.id} className={styles.studyCard}>
                <div className={styles.studyHeader}>
                  <div className={styles.studyMeta}>
                    <span className={styles.studyNumber}>Study {String(idx + 1).padStart(2, '0')}</span>
                    <span className={styles.studyType}>{typeInfo.icon} {typeInfo.label}</span>
                  </div>
                  <span className={`${styles.status} ${styles[`status${statusColor.charAt(0).toUpperCase() + statusColor.slice(1)}`]}`}>
                    {getStatusLabel(study.status)}
                  </span>
                </div>

                <div className={styles.studyContent}>
                  <h3>{study.title}</h3>
                  <p className={styles.description}>{study.description || 'Research project'}</p>
                </div>

                <div className={styles.studyFooter}>
                  <div className={styles.footerItem}>
                    <span className={styles.label}>Budget:</span>
                    <span className={styles.value}>₹{(study.budget_amount / 100000).toFixed(1)}L</span>
                  </div>
                  <div className={styles.footerItem}>
                    <span className={styles.label}>Created:</span>
                    <span className={styles.value}>{new Date(study.created_at).toLocaleDateString()}</span>
                  </div>
                  <button className={styles.viewButton}>View Details →</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ethics & Governance Section */}
      <div className={styles.ethicsSection}>
        <h2>Ethics & Governance Framework</h2>
        <div className={styles.ethicsGrid}>
          <div className={styles.ethicsCard}>
            <h4>Informed Consent</h4>
            <p>Multilingual forms (Tamil, Urdu, Dakhni). Audio consent option for non-literate respondents.</p>
          </div>
          <div className={styles.ethicsCard}>
            <h4>IRB Review</h4>
            <p>5-member internal board; meets monthly. External reviewer for sensitive studies.</p>
          </div>
          <div className={styles.ethicsCard}>
            <h4>Data Security</h4>
            <p>PII separated from analytical data. Encrypted at rest. Role-based access control.</p>
          </div>
          <div className={styles.ethicsCard}>
            <h4>Community Return</h4>
            <p>Findings shared back via Tamil-language briefs and block-level workshops before publication.</p>
          </div>
          <div className={styles.ethicsCard}>
            <h4>Open Data Policy</h4>
            <p>Anonymised datasets released 12 months after publication, with documentation.</p>
          </div>
          <div className={styles.ethicsCard}>
            <h4>Researcher Equity</h4>
            <p>Priority to first-generation scholars from marginalised backgrounds.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchStudiesPage;
