#!/bin/sh
set -e
BASE="http://localhost:35764/api"

echo "=== Health ==="
curl -s "$BASE/health"
echo ""

echo ""
echo "=== Register ==="
RESP=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@1place2post.io","password":"testpass123","name":"Smoke Test"}')
echo "$RESP"
TOKEN=$(echo "$RESP" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "ERROR: No token received — register may have failed or user exists"
  # Try login instead
  RESP=$(curl -s -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"smoke@1place2post.io","password":"testpass123"}')
  echo "Login response: $RESP"
  TOKEN=$(echo "$RESP" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
fi

echo ""
echo "=== Token: ${TOKEN:0:40}... ==="

echo ""
echo "=== Create Post ==="
POST=$(curl -s -X POST "$BASE/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"caption":"Hello from 1Place2Post!","hashtags":["#launch","#socialmedia"],"scheduledAt":"2026-03-01T10:00:00Z"}')
echo "$POST"
POST_ID=$(echo "$POST" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo ""
echo "=== List Posts ==="
curl -s "$BASE/posts" -H "Authorization: Bearer $TOKEN"

echo ""
echo "=== Get Post $POST_ID ==="
curl -s "$BASE/posts/$POST_ID" -H "Authorization: Bearer $TOKEN"

echo ""
echo "=== Update Post ==="
curl -s -X PATCH "$BASE/posts/$POST_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"DRAFT"}'

echo ""
echo "✅ All endpoint tests complete"
