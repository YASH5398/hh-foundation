import React from 'react';
import { FiCreditCard, FiDollarSign, FiCopy } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

/**
 * PaymentMethodsDisplay Component
 * Shows receiver's available payment methods (UPI or Bank details)
 */
const PaymentMethodsDisplay = ({ receiver, paymentDetails }) => {
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const hasUPI = paymentDetails?.upi && (
    paymentDetails.upi.upiId ||
    paymentDetails.upi.googlePay ||
    paymentDetails.upi.phonePe
  );

  const hasBank = paymentDetails?.bank && (
    paymentDetails.bank.accountNumber ||
    paymentDetails.bank.accountName
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Receiver Payment Methods</h3>
        <p className="text-sm text-gray-600">Choose one of the following methods to send payment</p>
      </div>

      {/* UPI Methods */}
      {hasUPI && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FiDollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">UPI Payment</h4>
              <p className="text-xs text-gray-600 mt-1">Instant transfer via UPI</p>
            </div>
          </div>

          <div className="space-y-3 ml-13">
            {/* UPI ID */}
            {paymentDetails.upi.upiId && (
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-gray-600 mb-1">UPI ID</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono text-gray-800 flex-1 break-all">
                    {paymentDetails.upi.upiId}
                  </code>
                  <button
                    onClick={() => copyToClipboard(paymentDetails.upi.upiId, 'UPI ID')}
                    className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    title="Copy"
                  >
                    <FiCopy className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
              </div>
            )}

            {/* Google Pay */}
            {paymentDetails.upi.googlePay && (
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-gray-600 mb-1">Google Pay</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono text-gray-800 flex-1 break-all">
                    {paymentDetails.upi.googlePay}
                  </code>
                  <button
                    onClick={() => copyToClipboard(paymentDetails.upi.googlePay, 'Google Pay')}
                    className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    title="Copy"
                  >
                    <FiCopy className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
              </div>
            )}

            {/* PhonePe */}
            {paymentDetails.upi.phonePe && (
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-gray-600 mb-1">PhonePe</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono text-gray-800 flex-1 break-all">
                    {paymentDetails.upi.phonePe}
                  </code>
                  <button
                    onClick={() => copyToClipboard(paymentDetails.upi.phonePe, 'PhonePe')}
                    className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    title="Copy"
                  >
                    <FiCopy className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bank Details */}
      {hasBank && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <FiCreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Bank Transfer</h4>
              <p className="text-xs text-gray-600 mt-1">Direct bank account transfer</p>
            </div>
          </div>

          <div className="space-y-3 ml-13">
            {/* Account Holder Name */}
            {paymentDetails.bank.accountName && (
              <div className="bg-white rounded-lg p-3 border border-green-100">
                <p className="text-xs text-gray-600 mb-1">Account Holder Name</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800 flex-1">
                    {paymentDetails.bank.accountName}
                  </p>
                  <button
                    onClick={() => copyToClipboard(paymentDetails.bank.accountName, 'Account Name')}
                    className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    title="Copy"
                  >
                    <FiCopy className="w-4 h-4 text-green-600" />
                  </button>
                </div>
              </div>
            )}

            {/* Account Number */}
            {paymentDetails.bank.accountNumber && (
              <div className="bg-white rounded-lg p-3 border border-green-100">
                <p className="text-xs text-gray-600 mb-1">Account Number</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono text-gray-800 flex-1 break-all">
                    {paymentDetails.bank.accountNumber}
                  </code>
                  <button
                    onClick={() => copyToClipboard(paymentDetails.bank.accountNumber, 'Account Number')}
                    className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    title="Copy"
                  >
                    <FiCopy className="w-4 h-4 text-green-600" />
                  </button>
                </div>
              </div>
            )}

            {/* IFSC Code */}
            {paymentDetails.bank.ifsc && (
              <div className="bg-white rounded-lg p-3 border border-green-100">
                <p className="text-xs text-gray-600 mb-1">IFSC Code</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono text-gray-800 flex-1">
                    {paymentDetails.bank.ifsc}
                  </code>
                  <button
                    onClick={() => copyToClipboard(paymentDetails.bank.ifsc, 'IFSC Code')}
                    className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    title="Copy"
                  >
                    <FiCopy className="w-4 h-4 text-green-600" />
                  </button>
                </div>
              </div>
            )}

            {/* Bank Name */}
            {paymentDetails.bank.bankName && (
              <div className="bg-white rounded-lg p-3 border border-green-100">
                <p className="text-xs text-gray-600 mb-1">Bank Name</p>
                <p className="text-sm font-semibold text-gray-800">
                  {paymentDetails.bank.bankName}
                </p>
              </div>
            )}

            {/* Branch */}
            {paymentDetails.bank.branch && (
              <div className="bg-white rounded-lg p-3 border border-green-100">
                <p className="text-xs text-gray-600 mb-1">Branch</p>
                <p className="text-sm text-gray-800">
                  {paymentDetails.bank.branch}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No payment methods message */}
      {!hasUPI && !hasBank && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-sm text-yellow-800">
            ⚠️ Receiver has not added any payment methods yet. Please contact them to add payment details.
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-2">
        <p className="font-semibold">📝 Instructions:</p>
        <ol className="list-decimal list-inside space-y-1 text-xs ml-1">
          <li>Copy the payment details and transfer ₹300 to the receiver</li>
          <li>Take a screenshot of the successful transaction</li>
          <li>Upload the screenshot and enter the UTR/Transaction ID</li>
          <li>Submit to confirm the payment</li>
        </ol>
      </div>
    </div>
  );
};

export default PaymentMethodsDisplay;
