#!/bin/bash
# Chatbot API Testing Script
# Run all tests against the deployed function

FUNCTION_URL="https://us-central1-hh-foundation.cloudfunctions.net/chatbotReply"
TIMEOUT=10

echo "🤖 HH Foundation Chatbot API Test Suite"
echo "========================================"
echo "Function: $FUNCTION_URL"
echo "Timestamp: $(date -Iseconds)"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_count=0
pass_count=0
fail_count=0

# Helper function to run test
run_test() {
  local test_name=$1
  local method=$2
  local data=$3
  local expected_status=$4
  
  test_count=$((test_count + 1))
  echo -n "Test $test_count: $test_name ... "
  
  if [ "$method" = "OPTIONS" ]; then
    response=$(curl -s -w "\n%{http_code}" -X OPTIONS "$FUNCTION_URL" \
      -H "Origin: http://localhost:3000" \
      --max-time $TIMEOUT)
  else
    response=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL" \
      -H "Content-Type: application/json" \
      -d "$data" \
      --max-time $TIMEOUT)
  fi
  
  http_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
    pass_count=$((pass_count + 1))
    if [ ! -z "$body" ]; then
      echo "  Response: $(echo "$body" | head -c 80)..."
    fi
  else
    echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $http_code)"
    fail_count=$((fail_count + 1))
    echo "  Response: $body"
  fi
  echo ""
}

# Test 1: OPTIONS Preflight
run_test "OPTIONS Preflight" "OPTIONS" "" "200"

# Test 2: Valid AI Question
run_test "Valid AI Question - Levels" "POST" '{"message":"How do I upgrade to Silver level?"}' "200"

# Test 3: Valid AI Question - E-PINs
run_test "Valid AI Question - E-PINs" "POST" '{"message":"What is an E-PIN and how do I get one?"}' "200"

# Test 4: Valid AI Question - Help Cycle
run_test "Valid AI Question - Help Cycle" "POST" '{"message":"How does the help cycle work?"}' "200"

# Test 5: Valid AI Question - Payments
run_test "Valid AI Question - Payments" "POST" '{"message":"What are the payment requirements for level upgrades?"}' "200"

# Test 6: Empty Message
run_test "Empty Message (Should 400)" "POST" '{"message":""}' "400"

# Test 7: Invalid JSON
run_test "Invalid JSON" "POST" '{invalid json}' "400"

# Test 8: Missing Message Field
run_test "Missing Message Field" "POST" '{"history":[]}' "400"

# Test 9: Very Long Message (Should Clamp)
long_msg=$(printf 'a%.0s' {1..600})
run_test "Long Message (600 chars)" "POST" "{\"message\":\"$long_msg\"}" "200"

# Test 10: Rapid Requests (Rate Limiting)
echo -n "Test $((test_count + 1)): Rate Limiting (11 rapid requests) ... "
test_count=$((test_count + 1))
rate_limit_fail=0
for i in {1..11}; do
  http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$FUNCTION_URL" \
    -H "Content-Type: application/json" \
    -d '{"message":"test"}' \
    --max-time $TIMEOUT)
  if [ $i -eq 11 ] && [ "$http_code" = "429" ]; then
    echo -e "${GREEN}✓ PASS${NC} (11th request rate-limited with 429)"
    pass_count=$((pass_count + 1))
  elif [ $i -lt 11 ] && [ "$http_code" = "200" ]; then
    : # Expected
  elif [ $i -eq 11 ]; then
    echo -e "${RED}✗ FAIL${NC} (Expected 429 on 11th request, got $http_code)"
    fail_count=$((fail_count + 1))
    rate_limit_fail=1
  fi
done
if [ $rate_limit_fail -eq 0 ]; then
  echo ""
fi

# Summary
echo "========================================"
echo "Test Results:"
echo -e "Total: $test_count | ${GREEN}Passed: $pass_count${NC} | ${RED}Failed: $fail_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
