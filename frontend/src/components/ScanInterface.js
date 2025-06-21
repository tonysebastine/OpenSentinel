import React, { useState } from 'react';
import axios from 'axios';

const ScanInterface = () => {
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState('comprehensive');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/scan', {
        target,
        scan_type: scanType,
      });
      setResults(response.data);
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Start New Scan</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Target URL or IP
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="example.com or 192.168.1.1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Scan Type
            </label>
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="comprehensive">Comprehensive Scan</option>
              <option value="quick">Quick Scan</option>
              <option value="vulnerability">Vulnerability Scan</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Scanning...' : 'Start Scan'}
          </button>
        </form>

        {results && (
          <div className="mt-6">
            <h3 className="text-lg font-medium">Scan Results</h3>
            <pre className="mt-2 p-4 bg-gray-50 rounded-md overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanInterface;
