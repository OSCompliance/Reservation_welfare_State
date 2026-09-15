import { useState } from 'react';

export default function Survey() {
  const [householdData, setHouseholdData] = useState({
    name: '',
    address: '',
    phone: '',
    members: '',
  });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agents/parse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: `Household: ${householdData.name}, Address: ${householdData.address}, Phone: ${householdData.phone}, Members: ${householdData.members}`,
            language: 'en',
          }),
        }
      );
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
      <h1>📋 Household Survey</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label>Household Name:</label>
          <input
            type="text"
            value={householdData.name}
            onChange={(e) =>
              setHouseholdData({ ...householdData, name: e.target.value })
            }
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '5px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Address:</label>
          <input
            type="text"
            value={householdData.address}
            onChange={(e) =>
              setHouseholdData({ ...householdData, address: e.target.value })
            }
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '5px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Phone:</label>
          <input
            type="text"
            value={householdData.phone}
            onChange={(e) =>
              setHouseholdData({ ...householdData, phone: e.target.value })
            }
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '5px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Family Members:</label>
          <textarea
            value={householdData.members}
            onChange={(e) =>
              setHouseholdData({ ...householdData, members: e.target.value })
            }
            placeholder="e.g., Ahmed 45, Fatima 42, 3 children"
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '5px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              minHeight: '100px',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Processing...' : 'Submit Survey'}
        </button>
      </form>

      {response && (
        <div
          style={{
            padding: '15px',
            backgroundColor: '#ecf0f1',
            borderRadius: '4px',
            marginTop: '20px',
          }}
        >
          <h3>Response:</h3>
          <pre style={{ overflow: 'auto' }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
