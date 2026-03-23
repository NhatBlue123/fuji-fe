#!/bin/bash

# OTP Payment Flow Test - Windows PowerShell Version
# Test payment API flow using PowerShell
# 
# Usage: 
# $AuthToken = "your_jwt_token"
# $Amount = 1000000
# . .\payment-test.ps1
#
# Or pass as parameters:
# .\payment-test.ps1 -AuthToken "your_jwt_token" -Amount 1000000

param(
    [string]$AuthToken,
    [int]$Amount = 1000000,
    [string]$ApiUrl = "http://localhost:8181/api"
)

# Validate inputs
if (-not $AuthToken) {
    Write-Host "❌ AuthToken not provided!" -ForegroundColor Red
    Write-Host "Usage: .\payment-test.ps1 -AuthToken 'your_jwt_token' -Amount 1000000" -ForegroundColor Yellow
    exit 1
}

# Helper functions
function Print-Step {
    param([string]$Message)
    Write-Host "📍 $Message" -ForegroundColor Blue
}

function Print-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Yellow
}

# Setup headers
$headers = @{
    "Authorization" = "Bearer $AuthToken"
    "Content-Type"  = "application/json"
}

Write-Host ""
Write-Host "🚀 Starting OTP Payment Test Flow" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "API URL: $ApiUrl"
Write-Host "Amount: $Amount đ"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""

try {
    # STEP 1: Create Payment Order
    Print-Step "Creating payment order (Amount: $Amount đ)..."
    
    $createBody = @{
        amount = $Amount
    } | ConvertTo-Json
    
    $createResponse = Invoke-RestMethod -Uri "$ApiUrl/payments/create" `
        -Method Post `
        -Headers $headers `
        -Body $createBody
    
    $orderId = $createResponse.orderId
    $responseAmount = $createResponse.amount
    
    if (-not $orderId) {
        Print-Error "Failed to create payment!"
        Write-Host "Response: $createResponse" -ForegroundColor Red
        exit 1
    }
    
    Print-Success "Payment created!"
    Write-Host "  - Order ID: $orderId"
    Write-Host "  - Amount: $responseAmount đ"
    Write-Host ""
    
    # STEP 2: Get Test Signature
    Print-Step "Getting test signature (OrderID: $orderId)..."
    
    $signatureUri = "$ApiUrl/payments/test-signature?order_id=$orderId&amount=$Amount&status=SUCCESS"
    $signatureResponse = Invoke-RestMethod -Uri $signatureUri `
        -Method Get `
        -Headers $headers
    
    $signature = $signatureResponse.signature
    
    if (-not $signature) {
        Print-Error "Failed to get signature!"
        Write-Host "Response: $signatureResponse" -ForegroundColor Red
        exit 1
    }
    
    Print-Success "Signature obtained!"
    Write-Host "  - Signature: $($signature.Substring(0, 20))..."
    Write-Host ""
    
    # STEP 3: Send Payment Callback
    Print-Step "Sending payment callback..."
    
    $transactionId = "TXN_$(Get-Date -Format 'yyyyMMddHHmmssffff')"
    
    $callbackBody = @{
        order_id      = $orderId
        transaction_id = $transactionId
        amount         = $Amount
        status         = "SUCCESS"
        signature      = $signature
    } | ConvertTo-Json
    
    $callbackResponse = Invoke-RestMethod -Uri "$ApiUrl/payments/callback" `
        -Method Post `
        -Headers $headers `
        -Body $callbackBody
    
    Print-Success "Callback sent!"
    Write-Host "  - Status: $($callbackResponse.status)"
    Write-Host ""
    
    # Wait for backend processing
    Print-Info "Waiting for backend to process payment (1.5 seconds)..."
    Start-Sleep -Milliseconds 1500
    Write-Host ""
    
    # STEP 4: Check Wallet Balance
    Print-Step "Checking wallet balance..."
    
    $walletResponse = Invoke-RestMethod -Uri "$ApiUrl/wallet/me" `
        -Method Get `
        -Headers $headers
    
    $balance = $walletResponse.balance
    $flowers = [math]::Floor($balance / 1000)
    
    if (-not $balance) {
        Print-Error "Failed to get wallet!"
        Write-Host "Response: $walletResponse" -ForegroundColor Red
        exit 1
    }
    
    Print-Success "Wallet updated!"
    Write-Host "  - Balance: $($balance.ToString('N0')) đ"
    Write-Host "  - Flowers: $flowers 🌸"
    Write-Host ""
    
    # Final Summary
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 
    Write-Host "✅ OTP PAYMENT TEST FLOW COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host ""
    Write-Host "📊 Results Summary:"
    Write-Host "  - Order ID: $orderId"
    Write-Host "  - Transaction ID: $transactionId"
    Write-Host "  - Amount: $Amount đ"
    Write-Host "  - New Balance: $($balance.ToString('N0')) đ"
    Write-Host "  - Flowers Added: $flowers 🌸"
    Write-Host ""
    
    # Return results as object
    $results = @{
        orderId    = $orderId
        amount     = $Amount
        signature  = $signature
        balance    = $balance
        flowers    = $flowers
    }
    
    return $results
    
} catch {
    Print-Error "Test flow failed!"
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response.Content)" -ForegroundColor Red
    exit 1
}
