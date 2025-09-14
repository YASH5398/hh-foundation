import React, { useState } from 'react';
import { generateEpins } from '../services/epin/epinService';
import { toast } from 'react-hot-toast';

const GenerateEpin = () => {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedEpins, setGeneratedEpins] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedEpins([]);

    const result = await generateEpins(quantity);

    if (result.success) {
      toast.success(result.message);
      setGeneratedEpins(result.generated);
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Generate E-PINs</h1>

      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Number of E-PINs to Generate</label>
            <input
              type="number"
              id="quantity"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate E-PINs'}
          </button>
        </form>

        {generatedEpins.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h2 className="text-lg font-semibold mb-2">Generated E-PINs:</h2>
            <ul className="list-disc list-inside space-y-1">
              {generatedEpins.map((epin, index) => (
                <li key={index} className="font-mono text-sm text-gray-800">{epin}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateEpin;