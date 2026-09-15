import { useState, useEffect } from 'react';
import styles from '@/styles/survey.module.css';

interface Member {
  name: string;
  age: string;
  gender: string;
  occupation: string;
}

interface Lookups {
  districts: Array<{ id: string; name: string; region?: string }>;
  religions: Array<{ id: string; name: string }>;
  subCommunities: Array<{ id: string; name: string }>;
  reservationCategories: Array<{ id: string; name: string; abbreviation?: string }>;
  welfareSchemes: Array<{ id: string; name: string; scheme_code?: string }>;
  workTypes: Array<{ id: string; name: string; category?: string }>;
}

export default function SurveyEnhanced() {
  const [mode, setMode] = useState<'manual' | 'autofill'>('manual');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [lookups, setLookups] = useState<Lookups | null>(null);

  const [formData, setFormData] = useState({
    householdName: '',
    address: '',
    phone: '',
    district: '',
    religion: '',
    subCommunity: '',
    reservationCategory: '',
    members: [] as Member[],
    welfareSchemes: [] as string[],
    womenWorkersCount: 0,
    womenWorkTypes: [] as string[],
  });

  const [newMember, setNewMember] = useState({
    name: '',
    age: '',
    gender: 'Male',
    occupation: '',
  });

  // Load lookups on component mount
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/lookups/all`
        );
        const data = await res.json();
        if (data.success) {
          setLookups(data.data);
        }
      } catch (err) {
        console.error('Failed to load lookups:', err);
      }
    };
    loadLookups();
  }, []);

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

  const toggleWelfareScheme = (schemeId: string) => {
    setFormData({
      ...formData,
      welfareSchemes: formData.welfareSchemes.includes(schemeId)
        ? formData.welfareSchemes.filter(id => id !== schemeId)
        : [...formData.welfareSchemes, schemeId],
    });
  };

  const toggleWorkType = (workTypeId: string) => {
    setFormData({
      ...formData,
      womenWorkTypes: formData.womenWorkTypes.includes(workTypeId)
        ? formData.womenWorkTypes.filter(id => id !== workTypeId)
        : [...formData.womenWorkTypes, workTypeId],
    });
  };

  const handleAutoFill = async () => {
    if (!formData.householdName.trim()) {
      setError('Please enter a household name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agents/auto-fill`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: `Generate a Muslim household named ${formData.householdName} in Tamil Nadu with demographics including district, religion, sub-community, and reservation category. Include 4-5 family members.`,
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
          ...formData,
          householdName: formData.householdName,
          address: form.address || 'Chennai, Tamil Nadu',
          phone: form.phone || '+91 XXXXXXXXXX',
          district: form.district || 'Chennai',
          religion: 'Muslim',
          members: generatedMembers,
        });

        setResponse(data);
        setStep(2);
      } else {
        setError(data.error || 'Failed to auto-fill data');
      }
    } catch (err) {
      setError(`Error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.district || !formData.religion || !formData.reservationCategory) {
        setError('Please fill in all required demographic fields');
        setLoading(false);
        return;
      }

      if (formData.members.length === 0) {
        setError('Please add at least one family member');
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/survey/save-complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            householdName: formData.householdName,
            address: formData.address,
            phone: formData.phone,
            district: formData.district,
            religion: formData.religion,
            subCommunity: formData.subCommunity,
            reservationCategory: formData.reservationCategory,
            members: formData.members,
            welfareSchemes: formData.welfareSchemes,
            womenWorkersCount: formData.womenWorkersCount,
            womenWorkTypes: formData.womenWorkTypes,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setResponse(data);
        setTimeout(() => {
          setFormData({
            householdName: '',
            address: '',
            phone: '',
            district: '',
            religion: '',
            subCommunity: '',
            reservationCategory: '',
            members: [],
            welfareSchemes: [],
            womenWorkersCount: 0,
            womenWorkTypes: [],
          });
          setStep(1);
          setSuccess(false);
          setMode('manual');
        }, 3000);
      } else {
        setError(data.error || 'Failed to save survey');
      }
    } catch (err) {
      setError(`Error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  if (!lookups) {
    return <div className={styles.container}>Loading form data...</div>;
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>✅ Survey Saved Successfully!</h2>
          <p>Household: {formData.householdName}</p>
          <p>Members: {formData.members.length}</p>
          <p>District: {formData.district}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🏠 Enhanced Household Survey</h1>
        <p>Comprehensive data collection with demographics</p>
      </div>

      <div style={{ marginBottom: '30px', display: 'flex', gap: '12px' }}>
        <button
          style={{
            padding: '12px 24px',
            backgroundColor: mode === 'manual' ? '#dc3545' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
          onClick={() => { setMode('manual'); setStep(1); }}
        >
          ✍️ Manual Entry
        </button>
        <button
          style={{
            padding: '12px 24px',
            backgroundColor: mode === 'autofill' ? '#dc3545' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
          onClick={() => { setMode('autofill'); setStep(1); }}
        >
          🤖 AI Auto-Fill
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px', padding: '12px', backgroundColor: '#ffe6e6', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* STEP 1: Demographics */}
        {step === 1 && (
          <div>
            <h2>Step 1: Household Demographics</h2>

            <label>Household Name *</label>
            <input
              type="text"
              value={formData.householdName}
              onChange={(e) => setFormData({ ...formData, householdName: e.target.value })}
              placeholder="e.g., Ahmed Hassan Family"
              style={{ width: '100%', padding: '8px', marginBottom: '12px' }}
              required
            />

            <label>District *</label>
            <select
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              style={{ width: '100%', padding: '8px', marginBottom: '12px' }}
              required
            >
              <option value="">Select District</option>
              {lookups.districts.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <label>Religion *</label>
            <select
              value={formData.religion}
              onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
              style={{ width: '100%', padding: '8px', marginBottom: '12px' }}
              required
            >
              <option value="">Select Religion</option>
              {lookups.religions.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            {formData.religion === 'rel_001' && (
              <>
                <label>Sub-community (Muslim) ⭐ CRITICAL</label>
                <select
                  value={formData.subCommunity}
                  onChange={(e) => setFormData({ ...formData, subCommunity: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginBottom: '12px' }}
                >
                  <option value="">Select Sub-community</option>
                  {lookups.subCommunities.map(sc => (
                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                  ))}
                </select>
              </>
            )}

            <label>Reservation Category *</label>
            <select
              value={formData.reservationCategory}
              onChange={(e) => setFormData({ ...formData, reservationCategory: e.target.value })}
              style={{ width: '100%', padding: '8px', marginBottom: '12px' }}
              required
            >
              <option value="">Select Reservation Category</option>
              {lookups.reservationCategories.map(rc => (
                <option key={rc.id} value={rc.id}>{rc.abbreviation || rc.name}</option>
              ))}
            </select>

            <label>Address *</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full address"
              style={{ width: '100%', padding: '8px', marginBottom: '12px' }}
              required
            />

            <label>Phone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Phone number"
              style={{ width: '100%', padding: '8px', marginBottom: '12px' }}
              required
            />

            {mode === 'autofill' && (
              <button
                type="button"
                onClick={handleAutoFill}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '⏳ Generating...' : '✨ Auto-Fill with AI'}
              </button>
            )}

            {mode === 'manual' && (
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
              }}
              >
                Next →
              </button>
            )}
          </div>
        )}

        {/* STEP 2: Members */}
        {(step === 2 || mode === 'autofill') && (
          <div>
            <h2>Step 2: Family Members</h2>

            {formData.members.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3>Current Members ({formData.members.length}):</h3>
                {formData.members.map((m, i) => (
                  <div key={i} style={{ padding: '8px', backgroundColor: '#f5f5f5', marginBottom: '8px', borderRadius: '4px' }}>
                    <span>{m.name} ({m.age}, {m.gender}, {m.occupation})</span>
                    <button type="button" onClick={() => removeMember(i)} style={{ marginLeft: '12px', cursor: 'pointer' }}>Remove</button>
                  </div>
                ))}
              </div>
            )}

            {mode === 'manual' && (
              <>
                <label>Member Name</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="Name"
                  style={{ width: '100%', padding: '8px', marginBottom: '12px' }}
                />

                <label>Age</label>
                <input
                  type="number"
                  value={newMember.age}
                  onChange={(e) => setNewMember({ ...newMember, age: e.target.value })}
                  placeholder="Age"
                  style={{ width: '100%', padding: '8px', marginBottom: '12px' }}
                />

                <label>Gender</label>
                <select
                  value={newMember.gender}
                  onChange={(e) => setNewMember({ ...newMember, gender: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginBottom: '12px' }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>

                <label>Occupation</label>
                <input
                  type="text"
                  value={newMember.occupation}
                  onChange={(e) => setNewMember({ ...newMember, occupation: e.target.value })}
                  placeholder="Occupation"
                  style={{ width: '100%', padding: '8px', marginBottom: '12px' }}
                />

                <button
                  type="button"
                  onClick={addMember}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                  }}
                >
                  + Add Member
                </button>
              </>
            )}

            {mode === 'autofill' && (
              <button
                type="button"
                onClick={() => setStep(3)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginBottom: '12px',
                }}
              >
                Continue to Welfare Schemes →
              </button>
            )}

            {mode === 'manual' && formData.members.length > 0 && (
              <button
                type="button"
                onClick={() => setStep(3)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Continue to Welfare Schemes →
              </button>
            )}
          </div>
        )}

        {/* STEP 3: Welfare & Women Employment */}
        {step === 3 && (
          <div>
            <h2>Step 3: Welfare Schemes & Women Employment</h2>

            <h3>Welfare Schemes Household Has Applied For:</h3>
            {lookups.welfareSchemes.map(scheme => (
              <label key={scheme.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.welfareSchemes.includes(scheme.id)}
                  onChange={() => toggleWelfareScheme(scheme.id)}
                />
                {scheme.name} {scheme.scheme_code ? `(${scheme.scheme_code})` : ''}
              </label>
            ))}

            <h3 style={{ marginTop: '20px' }}>Women's Employment</h3>
            <label>Number of Adult Women Currently Working</label>
            <select
              value={formData.womenWorkersCount}
              onChange={(e) => setFormData({ ...formData, womenWorkersCount: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '8px', marginBottom: '12px' }}
            >
              <option value="0">None</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3 or more</option>
            </select>

            {formData.womenWorkersCount > 0 && (
              <>
                <h4>Type of Work:</h4>
                {lookups.workTypes.map(wt => (
                  <label key={wt.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="checkbox"
                      checked={formData.womenWorkTypes.includes(wt.id)}
                      onChange={() => toggleWorkType(wt.id)}
                    />
                    {wt.name} {wt.category ? `(${wt.category})` : ''}
                  </label>
                ))}
              </>
            )}

            <button
              type="submit"
              disabled={loading || formData.members.length === 0}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: loading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '20px',
              }}
            >
              {loading ? '⏳ Saving...' : '✅ Submit Survey'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
