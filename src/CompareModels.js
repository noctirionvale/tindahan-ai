import { useState } from 'react';

function CompareModels() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/compare-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error('Error:', error);
      setResult('Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea 
        value={prompt} 
        onChange={(e) => setPrompt(e.target.value)} 
        placeholder="Enter your prompt..."
      />
      <button onClick={handleCompare} disabled={loading}>
        {loading ? 'Loading...' : 'Compare Models'}
      </button>
      {result && <p>{result}</p>}
    </div>
  );
}

export default CompareModels;