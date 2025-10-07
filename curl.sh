curl -X POST -H "Content-Type: application/json" -d '{
  "supplier": "60d5f2b9b6b3a72f4c8b4567",
  "product": "60d5f2b9b6b3a72f4c8b4568",
  "pendingQuantity_ne": true
}' 'http://localhost:3000/api/lats?page=1&limit=10'