# Chatbot API Testing Script (PowerShell)
# Run all tests against the deployed function

$functionUrl = "https://us-central1-hh-foundation.cloudfunctions.net/chatbotReply"
$timeout = 10

Write-Host "🤖 HH Foundation Chatbot API Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Function: $functionUrl"
Write-Host "Timestamp: $(Get-Date -Format 'o')"
Write-Host ""

$testCount = 0
$passCount = 0
$failCount = 0

# Helper function to run test
function Run-Test {
    param(
        [string]$TestName,
        [string]$Method,
        [string]$Data,
        [int]$ExpectedStatus
    )
    
    $script:testCount++
    Write-Host -NoNewline "Test $($script:testCount): $TestName ... "
    
    try {
        if ($Method -eq "OPTIONS") {
            $response = Invoke-WebRequest -Uri $functionUrl `
                -Method OPTIONS `
                -Headers @{ "Origin" = "http://localhost:3000" } `
                -TimeoutSec $timeout `
                -SkipHttpErrorCheck
        } else {
            $response = Invoke-WebRequest -Uri $functionUrl `
                -Method POST `
                -Headers @{ "Content-Type" = "application/json" } `
                -Body $Data `
                -TimeoutSec $timeout `
                -SkipHttpErrorCheck
        }
        
        $httpCode = $response.StatusCode
        $body = $response.Content
        
        if ($httpCode -eq $ExpectedStatus) {
            Write-Host "✓ PASS" -ForegroundColor Green -NoNewline
            Write-Host " (HTTP $httpCode)"
            $script:passCount++
            if ($body.Length -gt 0) {
                $preview = if ($body.Length -gt 80) { $body.Substring(0, 80) + "..." } else { $body }
                Write-Host "  Response: $preview"
            }
        } else {
            Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
            Write-Host " (Expected $ExpectedStatus, got $httpCode)"
            $script:failCount++
            Write-Host "  Response: $body"
        }
    } catch {
        Write-Host "✗ ERROR" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)"
        $script:failCount++
    }
    Write-Host ""
}

# Test 1: OPTIONS Preflight
Run-Test "OPTIONS Preflight" "OPTIONS" "" 200

# Test 2: Valid AI Question - Levels
Run-Test "Valid AI Question - Levels" "POST" '{"message":"How do I upgrade to Silver level?"}' 200

# Test 3: Valid AI Question - E-PINs
Run-Test "Valid AI Question - E-PINs" "POST" '{"message":"What is an E-PIN and how do I get one?"}' 200

# Test 4: Valid AI Question - Help Cycle
Run-Test "Valid AI Question - Help Cycle" "POST" '{"message":"How does the help cycle work?"}' 200

# Test 5: Valid AI Question - Payments
Run-Test "Valid AI Question - Payments" "POST" '{"message":"What are the payment requirements for level upgrades?"}' 200

# Test 6: Empty Message
Run-Test "Empty Message (Should 400)" "POST" '{"message":""}' 400

# Test 7: Missing Message Field
Run-Test "Missing Message Field" "POST" '{"history":[]}' 400

# Test 8: Very Long Message (Should Clamp)
$longMsg = "a" * 600
Run-Test "Long Message (600 chars)" "POST" ("{`"message`":`"" + $longMsg + "`"}") 200

# Test 9: Rapid Requests (Rate Limiting)
Write-Host -NoNewline "Test $($testCount + 1): Rate Limiting (11 rapid requests) ... "
$testCount++
$rateLimitFail = $false

for ($i = 1; $i -le 11; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $functionUrl `
            -Method POST `
            -Headers @{ "Content-Type" = "application/json" } `
            -Body '{"message":"test"}' `
            -TimeoutSec $timeout `
            -SkipHttpErrorCheck
        
        $httpCode = $response.StatusCode
        
        if ($i -eq 11 -and $httpCode -eq 429) {
            Write-Host "✓ PASS" -ForegroundColor Green -NoNewline
            Write-Host " (11th request rate-limited with 429)"
            $passCount++
        } elseif ($i -lt 11 -and $httpCode -eq 200) {
            # Expected
        } elseif ($i -eq 11) {
            Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
            Write-Host " (Expected 429 on 11th request, got $httpCode)"
            $failCount++
            $rateLimitFail = $true
        }
    } catch {
        if ($i -eq 11) {
            Write-Host "✗ ERROR" -ForegroundColor Red
            Write-Host "  $($_.Exception.Message)"
            $failCount++
        }
    }
}

if (-not $rateLimitFail) {
    Write-Host ""
}

# Summary
Write-Host "========================================"
Write-Host "Test Results:"
Write-Host -NoNewline "Total: $testCount | "
Write-Host -NoNewline "Passed: " -ForegroundColor Green
Write-Host -NoNewline $passCount -ForegroundColor Green
Write-Host -NoNewline " | Failed: " -ForegroundColor Red
Write-Host $failCount -ForegroundColor Red
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "✓ All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ Some tests failed" -ForegroundColor Red
    exit 1
}
