import React, { useState, useEffect } from 'react';
import styles from '@/styles/projects.module.css';

interface Project {
  id: string;
  title: string;
  description?: string;
  budget_amount: number;
  status: string;
  created_at: string;
}

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget_amount: 0,
    status: 'planning'
  });

  useEffect(() => {
    const initDb = async () => {
      try {
        await fetch('https://muslim-welfare-api.nazeersoft.workers.dev/api/init', {
          method: 'POST',
        });
        fetchProjects();
      } catch (err) {
        console.error('Init error:', err);
        fetchProjects();
      }
    };
    initDb();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('https://muslim-welfare-api.nazeersoft.workers.dev/api/projects');
      const data = await res.json();
      setProjects(data.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('https://muslim-welfare-api.nazeersoft.workers.dev/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setFormData({ title: '', description: '', budget_amount: 0, status: 'planning' });
        setShowForm(false);
        fetchProjects();
      }
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Research Projects</h1>
          <p>Manage welfare research initiatives</p>
        </div>
        <button
          className={styles.createButton}
          onClick={() => setShowForm(!showForm)}
        >
          + New Project
        </button>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h2>Create New Project</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Project Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <input
              type="number"
              placeholder="Budget Amount (₹)"
              value={formData.budget_amount}
              onChange={(e) => setFormData({ ...formData, budget_amount: parseFloat(e.target.value) })}
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <div className={styles.formButtons}>
              <button type="submit" className={styles.submitButton}>Create</button>
              <button type="button" className={styles.cancelButton} onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className={styles.empty}>
          <p>No projects yet. Create one to get started!</p>
        </div>
      ) : (
        <div className={styles.projectsGrid}>
          {projects.map((project) => (
            <div key={project.id} className={styles.projectCard}>
              <div className={styles.projectHeader}>
                <h3>{project.title}</h3>
                <span className={`${styles.status} ${styles[project.status]}`}>
                  {project.status}
                </span>
              </div>
              <p className={styles.description}>{project.description}</p>
              <div className={styles.meta}>
                <span>Budget: ₹{project.budget_amount.toLocaleString()}</span>
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
              </div>
              <button className={styles.viewButton}>View Details →</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
