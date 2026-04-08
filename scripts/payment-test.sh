#!/bin/bash

# OTP Payment Flow Test Script
# Test payment API flow using curl from terminal
#
# Usage: bash payment-test.sh [AMOUNT] [TOKEN]
# Example: bash payment-test.sh 1000000 "your_jwt_token_here"
#
# Or set environment variables:
# export API_URL="http://localhost:8181/api"
# export AUTH_TOKEN="your_jwt_token"
# export AMOUNT=1000000
# bash payment-test.sh

# Configuration
API_URL="${API_URL:-http://localhost:8181/api}"
AUTH_TOKEN="${AUTH_TOKEN:-$2}"
AMOUNT="${AMOUNT:-${1:-1000000}}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print colored output
print_step() {
    echo -e "${BLUE}📍 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Validate inputs
if [ -z "$AUTH_TOKEN" ]; then
    print_error "AUTH_TOKEN not provided!"
    echo "Usage: bash payment-test.sh 1000000 'your_jwt_token'"
    echo "Or set environment variables: export AUTH_TOKEN='your_jwt_token'"
    exit 1
fi

echo -e "\n${BLUE}🚀 Starting OTP Payment Test Flow${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "API URL: $API_URL"
echo "Amount: $AMOUNT đ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# STEP 1: Create Payment Order
print_step "Creating payment order (Amount: $AMOUNT đ)..."

CREATE_RESPONSE=$(curl -s -X POST "$API_URL/payments/create" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"amount\": $AMOUNT}")

# Extract orderId from response
ORDER_ID=$(echo "$CREATE_RESPONSE" | grep -o '"orderId":"[^"]*' | cut -d'"' -f4)
RESPONSE_AMOUNT=$(echo "$CREATE_RESPONSE" | grep -o '"amount":[0-9]*' | cut -d':' -f2)

if [ -z "$ORDER_ID" ]; then
    print_error "Failed to create payment!"
    echo "Response: $CREATE_RESPONSE"
    exit 1
fi

print_success "Payment created!"
echo "Response: $CREATE_RESPONSE"
echo "  - Order ID: $ORDER_ID"
echo "  - Amount: $RESPONSE_AMOUNT đ"
echo ""

# STEP 2: Get Test Signature
print_step "Getting test signature (OrderID: $ORDER_ID)..."

SIGNATURE_RESPONSE=$(curl -s -X GET \
  "$API_URL/payments/test-signature?order_id=$ORDER_ID&amount=$AMOUNT&status=SUCCESS" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json")

# Extract signature from response
SIGNATURE=$(echo "$SIGNATURE_RESPONSE" | grep -o '"signature":"[^"]*' | cut -d'"' -f4)

if [ -z "$SIGNATURE" ]; then
    print_error "Failed to get signature!"
    echo "Response: $SIGNATURE_RESPONSE"
    exit 1
fi

print_success "Signature obtained!"
echo "Response: $SIGNATURE_RESPONSE"
echo "  - Signature: ${SIGNATURE:0:20}..."
echo ""

# STEP 3: Send Payment Callback
print_step "Sending payment callback..."

TRANSACTION_ID="TXN_$(date +%s%N)"

CALLBACK_RESPONSE=$(curl -s -X POST "$API_URL/payments/callback" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"order_id\": \"$ORDER_ID\",
    \"transaction_id\": \"$TRANSACTION_ID\",
    \"amount\": $AMOUNT,
    \"status\": \"SUCCESS\",
    \"signature\": \"$SIGNATURE\"
  }")

print_success "Callback sent!"
echo "Response: $CALLBACK_RESPONSE"
echo ""

# Wait for backend processing
print_info "Waiting for backend to process payment (1.5 seconds)..."
sleep 1.5
echo ""

# STEP 4: Check Wallet Balance
print_step "Checking wallet balance..."

WALLET_RESPONSE=$(curl -s -X GET "$API_URL/wallet/me" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json")

BALANCE=$(echo "$WALLET_RESPONSE" | grep -o '"balance":[0-9]*' | cut -d':' -f2)
Coins=$((BALANCE / 1000))

if [ -z "$BALANCE" ]; then
    print_error "Failed to get wallet!"
    echo "Response: $WALLET_RESPONSE"
    exit 1
fi

print_success "Wallet updated!"
echo "Response: $WALLET_RESPONSE"
echo "  - Balance: $BALANCE đ"
echo "  - Coins: $Coins xu"
echo ""

# Final Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ OTP PAYMENT TEST FLOW COMPLETED SUCCESSFULLY!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Results Summary:"
echo "  - Order ID: $ORDER_ID"
echo "  - Transaction ID: $TRANSACTION_ID"
echo "  - Amount: $AMOUNT đ"
echo "  - Signature: ${SIGNATURE:0:20}..."
echo "  - New Balance: $BALANCE đ"
echo "  - Coins Added: $Coins xu"
echo ""

exit 0

