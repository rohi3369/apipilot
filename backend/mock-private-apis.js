// Mock private API endpoints for testing
const express = require('express');
const { privateApiAuth } = require('./private-api-auth');
const router = express.Router();

// Note: Rate limiting removed to avoid dependency issues
// You can add it back by: router.use(require('./private-api-auth').privateApiRateLimit);

// Mock Weather API
router.get('/weather/v1/current', privateApiAuth, (req, res) => {
  const { city } = req.query;
  res.json({
    location: city || 'New York',
    temperature: Math.floor(Math.random() * 30) + 50,
    humidity: Math.floor(Math.random() * 40) + 40,
    conditions: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
    timestamp: new Date().toISOString(),
    source: 'Mock Weather API'
  });
});

router.get('/weather/v1/forecast', privateApiAuth, (req, res) => {
  const { city, days = 5 } = req.query;
  const forecast = [];
  
  for (let i = 0; i < parseInt(days); i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    forecast.push({
      date: date.toISOString().split('T')[0],
      high: Math.floor(Math.random() * 20) + 70,
      low: Math.floor(Math.random() * 20) + 50,
      conditions: ['Sunny', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)]
    });
  }
  
  res.json({
    location: city || 'New York',
    forecast,
    source: 'Mock Weather API'
  });
});

// Mock Analytics API
router.post('/analytics/api/v1/events', privateApiAuth, (req, res) => {
  const { event, userId, data } = req.body;
  
  console.log(`Analytics Event: ${event} from user ${userId}`);
  
  res.json({
    success: true,
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    event,
    userId,
    timestamp: new Date().toISOString(),
    processed: true,
    source: 'Mock Analytics API'
  });
});

router.get('/analytics/api/v1/reports', privateApiAuth, (req, res) => {
  const { startDate, endDate, type } = req.query;
  
  res.json({
    reportId: `rpt_${Date.now()}`,
    type: type || 'summary',
    period: {
      start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end: endDate || new Date().toISOString()
    },
    data: {
      totalUsers: Math.floor(Math.random() * 1000) + 100,
      activeUsers: Math.floor(Math.random() * 500) + 50,
      totalEvents: Math.floor(Math.random() * 10000) + 1000,
      avgSessionDuration: Math.floor(Math.random() * 300) + 60
    },
    source: 'Mock Analytics API'
  });
});

// Mock CRM API
router.get('/crm/api/v2/contacts', privateApiAuth, (req, res) => {
  const { limit = 10, offset = 0, search } = req.query;
  
  const contacts = [];
  const count = Math.min(parseInt(limit), 50);
  
  for (let i = 0; i < count; i++) {
    const id = parseInt(offset) + i + 1;
    contacts.push({
      id: `contact_${id}`,
      name: `Contact ${id}`,
      email: `contact${id}@example.com`,
      phone: `+1-555-${String(id).padStart(4, '0')}`,
      company: `Company ${Math.floor(id / 5) + 1}`,
      status: ['Active', 'Inactive', 'Lead'][Math.floor(Math.random() * 3)],
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  if (search) {
    const filtered = contacts.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    );
    res.json({
      contacts: filtered,
      total: filtered.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      source: 'Mock CRM API'
    });
    return;
  }
  
  res.json({
    contacts,
    total: 150, // Mock total count
    limit: parseInt(limit),
    offset: parseInt(offset),
    source: 'Mock CRM API'
  });
});

router.post('/crm/api/v2/contacts', privateApiAuth, (req, res) => {
  const { name, email, phone, company } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({
      error: 'Name and email are required'
    });
  }
  
  const newContact = {
    id: `contact_${Date.now()}`,
    name,
    email,
    phone: phone || '',
    company: company || '',
    status: 'Lead',
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    contact: newContact,
    message: 'Contact created successfully',
    source: 'Mock CRM API'
  });
});

// Mock Payment Gateway API
router.post('/payment/v1/charges', privateApiAuth, (req, res) => {
  const { amount, currency, source, description } = req.body;
  
  if (!amount || !source) {
    return res.status(400).json({
      error: 'Amount and source are required'
    });
  }
  
  const charge = {
    id: `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    amount: parseInt(amount),
    currency: currency || 'usd',
    source,
    description: description || 'Test payment',
    status: ['succeeded', 'pending', 'failed'][Math.floor(Math.random() * 3)],
    created: Math.floor(Date.now() / 1000),
    balance_transaction: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  res.json({
    success: charge.status === 'succeeded',
    charge,
    source: 'Mock Payment Gateway'
  });
});

router.get('/payment/v1/charges/:id', privateApiAuth, (req, res) => {
  const { id } = req.params;
  
  // Mock charge data
  const charge = {
    id,
    amount: Math.floor(Math.random() * 10000) + 100,
    currency: 'usd',
    status: 'succeeded',
    created: Math.floor(Date.now() / 1000),
    description: 'Mock charge',
    source: 'Mock Payment Gateway'
  };
  
  res.json({
    charge,
    source: 'Mock Payment Gateway'
  });
});

router.post('/payment/v1/refunds', privateApiAuth, (req, res) => {
  const { chargeId, amount } = req.body;
  
  if (!chargeId) {
    return res.status(400).json({
      error: 'Charge ID is required'
    });
  }
  
  const refund = {
    id: `re_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    charge: chargeId,
    amount: amount ? parseInt(amount) : null, // null means full refund
    currency: 'usd',
    status: 'succeeded',
    created: Math.floor(Date.now() / 1000)
  };
  
  res.json({
    success: true,
    refund,
    message: 'Refund processed successfully',
    source: 'Mock Payment Gateway'
  });
});

// Health check for all mock APIs
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      weather: 'operational',
      analytics: 'operational', 
      crm: 'operational',
      payment: 'operational'
    },
    timestamp: new Date().toISOString(),
    source: 'Mock Private APIs'
  });
});

module.exports = router;
