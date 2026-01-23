/**
 * Validation script for enhanced debugging system
 * Checks that all enhancements are properly implemented
 */

const fs = require('fs');
const path = require('path');

// Read the functions/index.js file to validate enhancements
const functionsPath = path.join(__dirname, 'functions', 'index.js');
const adminServicePath = path.join(__dirname, 'src', 'services', 'adminService.js');
const forceReceiverPath = path.join(__dirname, 'src', 'admin', 'components', 'ForceReceiverAssignment.jsx');

const validateEnhancements = () => {
  console.log('🔍 Validating Enhanced Debugging System Implementation\n');
  
  let allValid = true;
  
  // 1. Validate Cloud Function enhancements
  console.log('1. Checking Cloud Function enhancements...');
  
  if (fs.existsSync(functionsPath)) {
    const functionsContent = fs.readFileSync(functionsPath, 'utf8');
    
    const checks = [
      {
        name: 'Enhanced startHelpAssignment with skip diagnostics',
        pattern: /skipDiagnostics.*=.*\[\]/,
        found: functionsContent.includes('skipDiagnostics')
      },
      {
        name: 'Layer A and Layer B eligibility checks',
        pattern: /LAYER A.*BASIC ELIGIBILITY/,
        found: functionsContent.includes('LAYER A: BASIC ELIGIBILITY')
      },
      {
        name: 'forceReceiveOverride flag support',
        pattern: /forceReceiveOverride/,
        found: functionsContent.includes('forceReceiveOverride')
      },
      {
        name: 'Enhanced error reporting with details',
        pattern: /skipDiagnostics.*totalCandidates/,
        found: functionsContent.includes('skipDiagnostics') && functionsContent.includes('totalCandidates')
      },
      {
        name: 'Detailed candidate evaluation logging',
        pattern: /evaluating\.candidate/,
        found: functionsContent.includes('evaluating.candidate')
      }
    ];
    
    checks.forEach(check => {
      if (check.found) {
        console.log(`   ✅ ${check.name}`);
      } else {
        console.log(`   ❌ ${check.name}`);
        allValid = false;
      }
    });
  } else {
    console.log('   ❌ functions/index.js not found');
    allValid = false;
  }
  
  // 2. Validate Admin Service enhancements
  console.log('\n2. Checking Admin Service enhancements...');
  
  if (fs.existsSync(adminServicePath)) {
    const adminContent = fs.readFileSync(adminServicePath, 'utf8');
    
    const adminChecks = [
      {
        name: 'checkUserEligibility function',
        found: adminContent.includes('export const checkUserEligibility')
      },
      {
        name: 'forceReceiveOverride in forceReceiverAssignment',
        found: adminContent.includes('forceReceiveOverride: true')
      },
      {
        name: 'Layer A and Layer B eligibility analysis',
        found: adminContent.includes('basicEligibility') && adminContent.includes('mlmStatus')
      },
      {
        name: 'Receive slot status checking',
        found: adminContent.includes('slotStatus') && adminContent.includes('receiveLimit')
      },
      {
        name: 'Recommendations generation',
        found: adminContent.includes('recommendations') && adminContent.includes('Force Receiver Assignment')
      }
    ];
    
    adminChecks.forEach(check => {
      if (check.found) {
        console.log(`   ✅ ${check.name}`);
      } else {
        console.log(`   ❌ ${check.name}`);
        allValid = false;
      }
    });
  } else {
    console.log('   ❌ src/services/adminService.js not found');
    allValid = false;
  }
  
  // 3. Validate Admin UI enhancements
  console.log('\n3. Checking Admin UI enhancements...');
  
  if (fs.existsSync(forceReceiverPath)) {
    const uiContent = fs.readFileSync(forceReceiverPath, 'utf8');
    
    const uiChecks = [
      {
        name: 'Eligibility checker button',
        found: uiContent.includes('handleCheckEligibility') && uiContent.includes('Check')
      },
      {
        name: 'Eligibility analysis display',
        found: uiContent.includes('Eligibility Analysis') && uiContent.includes('eligibilityData')
      },
      {
        name: 'Layer A and Layer B display',
        found: uiContent.includes('Layer A: Basic Eligibility') && uiContent.includes('Layer B: MLM Enforcement')
      },
      {
        name: 'Receive slot status display',
        found: uiContent.includes('Receive Slot Status') && uiContent.includes('utilizationPercent')
      },
      {
        name: 'Recommendations display',
        found: uiContent.includes('Recommendations') && uiContent.includes('recommendations.map')
      }
    ];
    
    uiChecks.forEach(check => {
      if (check.found) {
        console.log(`   ✅ ${check.name}`);
      } else {
        console.log(`   ❌ ${check.name}`);
        allValid = false;
      }
    });
  } else {
    console.log('   ❌ src/admin/components/ForceReceiverAssignment.jsx not found');
    allValid = false;
  }
  
  // 4. Check for MLM core integration
  console.log('\n4. Checking MLM core integration...');
  
  const mlmCoreChecks = [
    {
      name: 'MLM core import in functions',
      found: fs.existsSync(functionsPath) && fs.readFileSync(functionsPath, 'utf8').includes('./shared/mlmCore')
    },
    {
      name: 'Level receive limits defined',
      found: fs.existsSync(functionsPath) && fs.readFileSync(functionsPath, 'utf8').includes('LEVEL_RECEIVE_LIMITS')
    },
    {
      name: 'getReceiveLimitForLevel function',
      found: fs.existsSync(functionsPath) && fs.readFileSync(functionsPath, 'utf8').includes('getReceiveLimitForLevel')
    }
  ];
  
  mlmCoreChecks.forEach(check => {
    if (check.found) {
      console.log(`   ✅ ${check.name}`);
    } else {
      console.log(`   ❌ ${check.name}`);
      allValid = false;
    }
  });
  
  // Summary
  console.log('\n' + '='.repeat(50));
  if (allValid) {
    console.log('🎉 All enhanced debugging features are properly implemented!');
    console.log('\n📋 Summary of enhancements:');
    console.log('   • Enhanced Cloud Function with detailed skip diagnostics');
    console.log('   • Layer A (Basic) and Layer B (MLM) eligibility separation');
    console.log('   • forceReceiveOverride flag for one-time MLM bypass');
    console.log('   • Enhanced admin UI with eligibility checker');
    console.log('   • Detailed error reporting with skip reasons');
    console.log('   • Comprehensive logging for debugging');
    
    console.log('\n🚀 Ready for testing and validation!');
    return true;
  } else {
    console.log('❌ Some enhancements are missing or incomplete.');
    console.log('   Please review the implementation and ensure all features are properly added.');
    return false;
  }
};

// Run validation
if (require.main === module) {
  const isValid = validateEnhancements();
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateEnhancements };