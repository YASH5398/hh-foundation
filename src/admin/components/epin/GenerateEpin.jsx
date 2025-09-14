import React, { useState } from "react";
import { generateEpins } from '../../../services/epin/epinService';
import { toast } from "react-hot-toast";

const GenerateEpin = () => {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedEpins, setGeneratedEpins] = useState([]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (quantity < 1 || quantity > 100) {
      toast.error("Please enter a quantity between 1 and 100.");
      return;
    }
    setLoading(true);
    setGeneratedEpins([]);
    try {
      const result = await generateEpins(quantity);
      if (result.success) {
        setGeneratedEpins(result.generated);
        toast.success(result.message);
      } else {
        toast.error(result.message || "Failed to generate E-PINs");
      }
    } catch (err) {
      toast.error("Failed to generate E-PINs");
    } finally {
      setLoading(false);
      setQuantity(1);
    }
  };

  return (
    <form
      onSubmit={handleGenerate}
      className="space-y-6 max-w-md w-full mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg flex flex-col border border-gray-200 dark:border-gray-700"
    >
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 text-center mb-2">Bulk Generate E-PINs</h2>
      <label className="block text-gray-700 dark:text-gray-200 font-medium">Quantity (max 100)</label>
      <input
        type="number"
        placeholder="Enter quantity (1-100)"
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, Math.min(100, Number(e.target.value))))}
        min={1}
        max={100}
        required
        className="border border-gray-300 dark:border-gray-600 p-3 w-full rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-lg w-full shadow transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Generating..." : "Generate E-PINs"}
      </button>
      {generatedEpins.length > 0 && (
        <div className="mt-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Generated E-PINs:</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {generatedEpins.map((epin, idx) => (
              <li key={idx} className="text-blue-700 dark:text-blue-300 font-mono break-all">{epin}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
};

export default GenerateEpin; 