import { useState } from 'react';

export default function Agents() {
  const [input, setInput] = useState('');
  const [agent, setAgent] = useState<'parse' | 'auto-fill'>('parse');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint =
        agent === 'parse' ? '/api/agents/parse' : '/api/agents/auto-fill';
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input, language: 'en' }),
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
    <div style={{ maxWidth: '900px', margin: '50px auto', padding: '20px' }}>
      <h1>🤖 Agent System Tester</h1>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '20px' }}>
          <input
            type="radio"
            value="parse"
            checked={agent === 'parse'}
            onChange={() => setAgent('parse')}
          />
          Parse Agent (Extract Data)
        </label>
        <label>
          <input
            type="radio"
            value="auto-fill"
            checked={agent === 'auto-fill'}
            onChange={() => setAgent('auto-fill')}
          />
          Auto-Fill Agent (Generate Forms)
        </label>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label>Input Text:</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., 5 family members, Ahmed 45, Fatima 42, 3 children in Chennai"
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '5px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              minHeight: '120px',
              fontFamily: 'monospace',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Processing...' : `Test ${agent} Agent`}
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
          <h3>Agent Response:</h3>
          {response.error ? (
            <div style={{ color: 'red' }}>Error: {response.error}</div>
          ) : (
            <>
              <div style={{ marginBottom: '10px' }}>
                <strong>Success:</strong> {response.success ? '✅ Yes' : '❌ No'}
              </div>
              {response.confidence && (
                <div style={{ marginBottom: '10px' }}>
                  <strong>Confidence:</strong> {response.confidence}%
                </div>
              )}
              {response.household_id && (
                <div style={{ marginBottom: '10px' }}>
                  <strong>Household ID:</strong> {response.household_id}
                </div>
              )}
              <pre
                style={{
                  overflow: 'auto',
                  backgroundColor: '#fff',
                  padding: '10px',
                  borderRadius: '4px',
                }}
              >
                {JSON.stringify(response, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: '40px',
          padding: '15px',
          backgroundColor: '#f9f9f9',
          borderRadius: '4px',
        }}
      >
        <h3>Test Examples:</h3>
        <p>
          <strong>Parse Example:</strong>
          <br />
          "Ahmed Hassan, 45 years old, teacher earning 50000. Fatima Hassan, 42,
          homemaker. 3 children ages 18, 15, 12 in Chennai"
        </p>
        <p>
          <strong>Auto-Fill Example:</strong>
          <br />
          "5 family members, Muslim household, Tamil Nadu, earning 100000 per
          month"
        </p>
      </div>
    </div>
  );
}
