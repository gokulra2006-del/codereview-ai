const axios = require('axios');
axios.post('http://localhost:5000/api/run', { code: 'print(123)', languageId: 71 })
  .then(res => console.log('Run success:', res.data))
  .catch(err => console.error('Run error:', err.response?.data || err.message));

axios.post('http://localhost:5000/api/review', { code: 'print(123)', language: 'python' })
  .then(res => console.log('Review success:', res.data))
  .catch(err => console.error('Review error:', err.response?.data || err.message));
