import { useState } from 'react';
import styles from '@/styles/survey.module.css';

interface Member {
  name: string;
  age: string;
  gender: string;
  occupation: string;
}

export default function Survey() {
  const [mode, setMode] = useState<'manual' | 'autofill'>('manual');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [aiError, setAiError] = useState('');

  const [formData, setFormData] = useState({
    householdName: '',
    address: '',
    phone: '',
    members: [] as Member[],
  });

  const [newMember, setNewMember] = useState({
    name: '',
    age: '',
    gender: 'Male',
    occupation: '',
  });

  const addMember = () => {
    if (newMember.name.trim()) {
      setFormData({
        ...formData,
        members: [...formData.members, newMember],
      });
      setNewMember({ name: '', age: '', gender: 'Male', occupation: '' });
    }
  };

  const removeMember = (index: number) => {
    setFormData({
      ...formData,
      members: formData.members.filter((_, i) => i !== index),
    });
  };

  // Auto-Fill with AI Agent
  const handleAutoFill = async () => {
    if (!formData.householdName.trim()) {
      setAiError('Please enter a household name');
      return;
    }

    setLoading(true);
    setAiError('');

    try {
      // Call auto-fill agent
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agents/auto-fill`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: `Household name: ${formData.householdName}. Generate a realistic Muslim household with 4-5 family members in Tamil Nadu with typical occupations and incomes.`,
            language: 'en',
          }),
        }
      );

      const data = await res.json();

      if (data.success && data.auto_filled_form) {
        const form = data.auto_filled_form;
        const generatedMembers: Member[] = form.members?.map((m: any) => ({
          name: m.name || '',
          age: m.age?.toString() || '',
          gender: m.gender || 'Male',
          occupation: m.occupation || '',
        })) || [];

        setFormData({
          householdName: formData.householdName,
          address: form.address || 'Chennai, Tamil Nadu',
          phone: form.phone || '+91 XXXXXXXXXX',
          members: generatedMembers,
        });

        setResponse(data);
        setStep(3); // Go to review
      } else {
        setAiError(data.error || 'Failed to auto-fill data');
      }
    } catch (error) {
      setAiError(`Error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Parse with agent
      const parseRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agents/parse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: `Household: ${formData.householdName}, Address: ${formData.address}, Phone: ${formData.phone}, Members: ${formData.members.map(m => `${m.name} (${m.age})`).join(', ')}`,
            language: 'en',
          }),
        }
      );
      const parseData = await parseRes.json();
      setResponse(parseData);

      // Step 2: Save to database
      if (parseData.success) {
        const saveRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/household/save-parsed`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              householdName: formData.householdName,
              address: formData.address,
              phone: formData.phone,
              members: formData.members,
            }),
          }
        );
        const saveData = await saveRes.json();
        if (saveData.success) {
          setSuccess(true);
          setResponse(saveData);
          setTimeout(() => {
            setFormData({ householdName: '', address: '', phone: '', members: [] });
            setStep(1);
            setSuccess(false);
            setMode('manual');
          }, 3000);
        }
      }
    } catch (error) {
      setResponse({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const progress = mode === 'autofill' ? 100 : (step / 3) * 100;
  const isStep1Valid = formData.householdName.trim() && formData.address.trim();
  const isStep2Valid = formData.members.length > 0;
  const canSubmit = isStep1Valid && isStep2Valid;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>🏠 Household Survey</h1>
        <p>Help us understand the Muslim welfare needs in Tamil Nadu</p>
      </div>

      {/* Mode Selector */}
      <div className={styles.modeSelector}>
        <div className={styles.modeButtons}>
          <button
            className={`${styles.modeButton} ${mode === 'manual' ? styles.modeActive : ''}`}
            onClick={() => {
              setMode('manual');
              setStep(1);
              setFormData({ householdName: '', address: '', phone: '', members: [] });
              setResponse(null);
            }}
          >
            ✍️ Manual Entry
          </button>
          <button
            className={`${styles.modeButton} ${mode === 'autofill' ? styles.modeActive : ''}`}
            onClick={() => {
              setMode('autofill');
              setFormData({ householdName: '', address: '', phone: '', members: [] });
              setResponse(null);
              setAiError('');
            }}
          >
            🤖 AI Auto-Fill
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {mode === 'manual' && (
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className={styles.stepIndicator}>
            <div className={step >= 1 ? styles.stepActive : styles.stepInactive}>1</div>
            <div className={step >= 2 ? styles.stepActive : styles.stepInactive}>2</div>
            <div className={step >= 3 ? styles.stepActive : styles.stepInactive}>3</div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className={styles.successMessage}>
          <div className={styles.successIcon}>✅</div>
          <h3>Household Saved Successfully!</h3>
          <p>ID: {response.householdId}</p>
          <p>{response.membersCount} members registered</p>
        </div>
      )}

      {/* Main Form */}
      {!success && (
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* MANUAL MODE */}
          {mode === 'manual' && (
            <>
              {/* Step 1: Household Info */}
              {step === 1 && (
                <div className={styles.formStep}>
                  <div className={styles.stepHeader}>
                    <h2>Step 1: Household Information</h2>
                    <p>Enter basic household details</p>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Household Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Ahmed Hassan Family"
                      value={formData.householdName}
                      onChange={(e) =>
                        setFormData({ ...formData, householdName: e.target.value })
                      }
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Address *</label>
                    <textarea
                      placeholder="e.g., 123 Main Street, Chennai, Tamil Nadu"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className={styles.textarea}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g., +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.buttonGroup}>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!isStep1Valid}
                      className={`${styles.button} ${styles.primary}`}
                    >
                      Next: Add Family Members →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Add Family Members */}
              {step === 2 && (
                <div className={styles.formStep}>
                  <div className={styles.stepHeader}>
                    <h2>Step 2: Family Members</h2>
                    <p>Add each household member</p>
                  </div>

                  <div className={styles.memberForm}>
                    <div className={styles.memberInputRow}>
                      <div className={styles.formGroup}>
                        <label>Name *</label>
                        <input
                          type="text"
                          placeholder="Full name"
                          value={newMember.name}
                          onChange={(e) =>
                            setNewMember({ ...newMember, name: e.target.value })
                          }
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Age</label>
                        <input
                          type="number"
                          placeholder="Age"
                          value={newMember.age}
                          onChange={(e) =>
                            setNewMember({ ...newMember, age: e.target.value })
                          }
                          className={styles.input}
                          min="0"
                          max="120"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Gender</label>
                        <select
                          value={newMember.gender}
                          onChange={(e) =>
                            setNewMember({ ...newMember, gender: e.target.value })
                          }
                          className={styles.input}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label>Occupation</label>
                        <input
                          type="text"
                          placeholder="Occupation"
                          value={newMember.occupation}
                          onChange={(e) =>
                            setNewMember({ ...newMember, occupation: e.target.value })
                          }
                          className={styles.input}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={addMember}
                        className={`${styles.button} ${styles.secondary}`}
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Members List */}
                  <div className={styles.membersList}>
                    <h3>Added Members ({formData.members.length})</h3>
                    {formData.members.length === 0 ? (
                      <p className={styles.emptyState}>No members added yet</p>
                    ) : (
                      <div className={styles.membersGrid}>
                        {formData.members.map((member, index) => (
                          <div key={index} className={styles.memberCard}>
                            <div className={styles.memberInfo}>
                              <h4>{member.name}</h4>
                              <p>{member.age ? `${member.age} years` : 'Age not specified'}</p>
                              <p>{member.gender}</p>
                              {member.occupation && <p>{member.occupation}</p>}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMember(index)}
                              className={styles.removeButton}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={styles.buttonGroup}>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className={`${styles.button} ${styles.outline}`}
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      disabled={!isStep2Valid}
                      className={`${styles.button} ${styles.primary}`}
                    >
                      Review & Submit →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Submit */}
              {step === 3 && (
                <div className={styles.formStep}>
                  <div className={styles.stepHeader}>
                    <h2>Step 3: Review & Submit</h2>
                    <p>Confirm your household information</p>
                  </div>

                  <div className={styles.reviewSection}>
                    <div className={styles.reviewCard}>
                      <h3>Household Details</h3>
                      <div className={styles.reviewGrid}>
                        <div>
                          <label>Household Name</label>
                          <p>{formData.householdName}</p>
                        </div>
                        <div>
                          <label>Address</label>
                          <p>{formData.address}</p>
                        </div>
                        <div>
                          <label>Phone</label>
                          <p>{formData.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <label>Family Size</label>
                          <p>{formData.members.length} members</p>
                        </div>
                      </div>
                    </div>

                    <div className={styles.reviewCard}>
                      <h3>Family Members</h3>
                      <div className={styles.membersGrid}>
                        {formData.members.map((member, index) => (
                          <div key={index} className={styles.reviewMemberCard}>
                            <strong>{member.name}</strong>
                            <p>{member.age ? `${member.age} years old` : ''}</p>
                            <p>{member.gender}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={styles.buttonGroup}>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className={`${styles.button} ${styles.outline}`}
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !canSubmit}
                      className={`${styles.button} ${styles.primary} ${loading ? styles.loading : ''}`}
                    >
                      {loading ? 'Submitting...' : 'Submit Survey ✓'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* AUTO-FILL MODE */}
          {mode === 'autofill' && (
            <div className={styles.formStep}>
              <div className={styles.stepHeader}>
                <h2>🤖 AI Auto-Fill Mode</h2>
                <p>Enter household name and let AI generate the rest</p>
              </div>

              {aiError && (
                <div className={styles.errorMessage}>
                  <strong>⚠️ Error:</strong> {aiError}
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Household Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Ahmed Hassan Family"
                  value={formData.householdName}
                  onChange={(e) =>
                    setFormData({ ...formData, householdName: e.target.value })
                  }
                  className={styles.input}
                />
              </div>

              <div className={styles.aiInfo}>
                <h3>✨ What AI Will Generate:</h3>
                <ul>
                  <li>🏘️ Realistic address in Tamil Nadu</li>
                  <li>📞 Sample phone number</li>
                  <li>👨‍👩‍👧‍👦 4-5 family members with realistic names</li>
                  <li>📊 Age, gender, and occupation data</li>
                  <li>💼 Typical income information</li>
                </ul>
              </div>

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={loading || !formData.householdName.trim()}
                  className={`${styles.button} ${styles.primary}`}
                  style={{ minWidth: '250px' }}
                >
                  {loading ? '🤖 Generating...' : '✨ Auto-Fill with AI'}
                </button>
              </div>

              {/* Auto-filled data preview */}
              {formData.members.length > 0 && (
                <div className={styles.reviewSection}>
                  <div className={styles.reviewCard}>
                    <h3>✅ Generated Data Preview</h3>
                    <div className={styles.reviewGrid}>
                      <div>
                        <label>Household Name</label>
                        <p>{formData.householdName}</p>
                      </div>
                      <div>
                        <label>Address</label>
                        <p>{formData.address}</p>
                      </div>
                      <div>
                        <label>Phone</label>
                        <p>{formData.phone}</p>
                      </div>
                      <div>
                        <label>Family Size</label>
                        <p>{formData.members.length} members</p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.reviewCard}>
                    <h3>Family Members (AI Generated)</h3>
                    <div className={styles.membersGrid}>
                      {formData.members.map((member, index) => (
                        <div key={index} className={styles.reviewMemberCard}>
                          <strong>{member.name}</strong>
                          <p>{member.age ? `${member.age} years old` : ''}</p>
                          <p>{member.gender}</p>
                          {member.occupation && <p>📊 {member.occupation}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit after auto-fill */}
              {formData.members.length > 0 && (
                <div className={styles.buttonGroup}>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ householdName: '', address: '', phone: '', members: [] });
                      setAiError('');
                    }}
                    className={`${styles.button} ${styles.outline}`}
                  >
                    Clear & Try Again
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`${styles.button} ${styles.primary}`}
                  >
                    {loading ? 'Submitting...' : 'Save This Household ✓'}
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      )}

      {/* Response Display */}
      {response && !success && (
        <div className={styles.responseSection}>
          <h3>📊 Response:</h3>
          <pre className={styles.responseCode}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
