import React, { useState } from 'react';
import { runSendHelpEligibilityTest, runTestAndLog } from '../../tests/sendHelpEligibilityTest';

/**
 * TEMPORARY TEST RUNNER COMPONENT
 * Add this to DashboardHome temporarily to run the Send Help eligibility test
 */
const SendHelpTestRunner = () => {
  const [testResult, setTestResult] = useState(null);
  const [running, setRunning] = useState(false);

  const runTest = async () => {
    setRunning(true);
    setTestResult(null);

    try {
      console.log('🧪 Running Send Help Eligibility Test...');
      const result = await runSendHelpEligibilityTest();
      setTestResult(result);
      console.log('✅ Test completed:', result);
    } catch (error) {
      console.error('❌ Test failed:', error);
      setTestResult({ success: false, error: error.message });
    } finally {
      setRunning(false);
    }
  };

  const runTestAndLogConsole = () => {
    console.log('🧪 Running test with detailed logging...');
    runTestAndLog();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-red-200">
      <h3 className="text-xl font-bold text-red-600 mb-4">
        🚨 TEMPORARY TEST RUNNER - Send Help Eligibility Test
      </h3>

      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">Test Purpose:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Login with inactive user</li>
            <li>• Query users collection for activated receivers</li>
            <li>• Check Firestore permissions and data structure</li>
            <li>• Identify root cause of "No eligible receivers" error</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={runTest}
            disabled={running}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold flex items-center gap-2"
          >
            {running ? 'Running...' : 'Run Test'}
          </button>

          <button
            onClick={runTestAndLogConsole}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
          >
            Run Test (Console Logs)
          </button>
        </div>

        {testResult && (
          <div className={`border rounded-lg p-4 ${
            testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <h4 className={`font-semibold mb-2 ${
              testResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {testResult.success ? '✅ Test Passed' : '❌ Test Failed'}
            </h4>

            {testResult.success ? (
              <div className="space-y-2 text-sm text-green-700">
                <p><strong>Total Receivers Found:</strong> {testResult.totalReceivers}</p>
                <p><strong>Eligible Receivers:</strong> {testResult.eligibleReceivers}</p>
                <p><strong>Ineligible Receivers:</strong> {testResult.ineligibleReceivers}</p>
                {testResult.topReceiver && (
                  <p><strong>Top Receiver:</strong> {testResult.topReceiver.userId} (Level: {testResult.topReceiver.level})</p>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-sm text-red-700">
                <p><strong>Error:</strong> {testResult.error}</p>
                {testResult.totalReceivers !== undefined && (
                  <p><strong>Receivers Found:</strong> {testResult.totalReceivers}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <strong>Instructions:</strong> Update TEST_CONFIG in sendHelpEligibilityTest.js with real inactive user credentials before running. Check browser console for detailed logs.
        </div>
      </div>
    </div>
  );
};

export default SendHelpTestRunner;
