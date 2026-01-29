import React from 'react';
import ReceiveHelpRefactored from "./ReceiveHelpRefactored";

// Debug: Verify component type and loading
console.log('🔧 ReceiveHelp wrapper component loaded');
console.log('🔧 ReceiveHelpRefactored type:', typeof ReceiveHelpRefactored);
console.log('🔧 ReceiveHelpRefactored value:', ReceiveHelpRefactored);

export default function ReceiveHelp() {
  console.log('🔧 ReceiveHelp wrapper component rendered');
  return <ReceiveHelpRefactored />;
}