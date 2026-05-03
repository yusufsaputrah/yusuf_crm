require('dotenv').config();
const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 2, fullName: 'Sales Budi', email: 'budi@smart.com', role: 'sales' }, process.env.JWT_SECRET || 'super_secret_jwt_key_12345');
fetch('http://localhost:5001/api/customers', {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2)));
