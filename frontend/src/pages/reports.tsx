import { useState, useEffect } from 'react';

export default function Reports() {
  const [reportType, setReportType] = useState<'summary' | 'analytics'>(
    'summary'
  );
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const endpoint =
        reportType === 'summary'
          ? '/api/reports/summary'
          : '/api/reports/analytics';
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}?format=json`
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
    <div style={{ maxWidth: '1000px', margin: '50px auto', padding: '20px' }}>
      <h1>📊 Reports & Analytics</h1>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setReportType('summary')}
          style={{
            padding: '10px 15px',
            marginRight: '10px',
            backgroundColor: reportType === 'summary' ? '#3498db' : '#bdc3c7',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Summary Statistics
        </button>
        <button
          onClick={() => setReportType('analytics')}
          style={{
            padding: '10px 15px',
            backgroundColor:
              reportType === 'analytics' ? '#3498db' : '#bdc3c7',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Full Analytics
        </button>
      </div>

      {loading && <p>Loading report...</p>}

      {response && !response.error && (
        <div style={{ marginTop: '20px' }}>
          {reportType === 'summary' && response.summary && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
              }}
            >
              <Card
                title="Total Households"
                value={response.summary.total_households}
              />
              <Card
                title="Total Members"
                value={response.summary.total_members}
              />
              <Card
                title="Muslim Members"
                value={response.summary.total_muslim_members}
              />
              <Card
                title="Avg Household Size"
                value={response.summary.avg_household_size?.toFixed(2)}
              />
            </div>
          )}

          {reportType === 'analytics' && response.total_households !== undefined && (
            <div>
              <h2>Demographics Overview</h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '20px',
                  marginTop: '20px',
                }}
              >
                <Section
                  title="Gender Distribution"
                  data={response.gender_distribution}
                />
                <Section
                  title="Age Distribution"
                  data={response.age_distribution}
                />
                <Section
                  title="Income Statistics"
                  data={{
                    Average: response.income_statistics.average?.toFixed(0),
                    Minimum: response.income_statistics.min?.toFixed(0),
                    Maximum: response.income_statistics.max?.toFixed(0),
                    Median: response.income_statistics.median?.toFixed(0),
                  }}
                />
              </div>

              <div style={{ marginTop: '30px' }}>
                <h3>Overall Summary</h3>
                <p>
                  <strong>Total Households:</strong> {response.total_households}
                </p>
                <p>
                  <strong>Total Members:</strong> {response.total_members}
                </p>
                <p>
                  <strong>Muslim Members:</strong>{' '}
                  {response.total_muslim_members}
                </p>
                <p>
                  <strong>Ration Card Holders:</strong>{' '}
                  {response.ration_card_holders}
                </p>
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: '30px',
              padding: '10px',
              backgroundColor: '#f9f9f9',
              borderRadius: '4px',
            }}
          >
            <h3>Raw Data:</h3>
            <pre
              style={{
                overflow: 'auto',
                maxHeight: '400px',
                backgroundColor: '#fff',
                padding: '10px',
              }}
            >
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {response?.error && (
        <div style={{ color: 'red', marginTop: '20px' }}>
          Error: {response.error}
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        padding: '15px',
        backgroundColor: '#3498db',
        color: 'white',
        borderRadius: '8px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{value}</div>
      <div style={{ fontSize: '12px', marginTop: '5px' }}>{title}</div>
    </div>
  );
}

function Section({
  title,
  data,
}: {
  title: string;
  data: Record<string, any>;
}) {
  return (
    <div
      style={{
        padding: '15px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: '1px solid #ddd',
      }}
    >
      <h4>{title}</h4>
      <ul style={{ paddingLeft: '20px' }}>
        {Object.entries(data).map(([key, value]) => (
          <li key={key}>
            <strong>{key}:</strong> {value}
          </li>
        ))}
      </ul>
    </div>
  );
}
