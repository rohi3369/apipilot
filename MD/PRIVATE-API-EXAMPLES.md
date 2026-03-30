# Private API Examples & Testing Guide

This guide provides examples of private APIs and how to test them using ApiPilot.

## 🚀 Quick Start

1. **Start the backend server**
   ```bash

   cd backend
   node server-fixed.js
   ```

2. **Start the frontend**
   ```bash
   cd frontend
   npm start
   ```

3. **Login as admin** (username: `admin`, password: `admin123`)

4. **Configure private APIs** using the "Private APIs" tab

## 📋 Available Mock Private APIs

The application includes mock private APIs at `http://localhost:5000/mock/` that simulate real private API services.

### 1. Weather API
- **Base URL**: `http://localhost:5000/mock`
- **Authentication**: API Key
- **Test API Key**: `weather-api-key-12345`

#### Endpoints:
```http
GET /weather/v1/current?city=New York
GET /weather/v1/forecast?city=London&days=5
```

#### Example Request:
```javascript
// In ApiPilot, configure:
// Domain: http://localhost:5000/mock
// API Key: weather-api-key-12345
// Token Type: API Key

// Then test:
GET http://localhost:5000/mock/weather/v1/current?city=New York
Headers: X-API-Key: weather-api-key-12345
```

### 2. Analytics API
- **Base URL**: `http://localhost:5000/mock`
- **Authentication**: Bearer Token
- **Test Token**: `analytics-bearer-token-abcdef`

#### Endpoints:
```http
POST /analytics/api/v1/events
GET /analytics/api/v1/reports
```

#### Example Request:
```javascript
// Configure:
// Domain: http://localhost:5000/mock
// API Key: analytics-bearer-token-abcdef
// Token Type: Bearer

// Test:
POST http://localhost:5000/mock/analytics/api/v1/events
Headers: Authorization: Bearer analytics-bearer-token-abcdef
Body: {
  "event": "user_login",
  "userId": "12345",
  "data": {
    "browser": "Chrome",
    "os": "Windows"
  }
}
```

### 3. CRM API
- **Base URL**: `http://localhost:5000/mock`
- **Authentication**: API Key
- **Test API Key**: `crm-api-key-xyz789`

#### Endpoints:
```http
GET /crm/api/v2/contacts
POST /crm/api/v2/contacts
PUT /crm/api/v2/contacts/{id}
```

#### Example Request:
```javascript
// Configure:
// Domain: http://localhost:5000/mock
// API Key: crm-api-key-xyz789
// Token Type: API Key

// Test:
GET http://localhost:5000/mock/crm/api/v2/contacts?limit=5
Headers: X-API-Key: crm-api-key-xyz789
```

### 4. Payment Gateway API
- **Base URL**: `http://localhost:5000/mock`
- **Authentication**: API Key
- **Test API Key**: `payment-api-key-12345`

#### Endpoints:
```http
POST /payment/v1/charges
GET /payment/v1/charges/{id}
POST /payment/v1/refunds
```

#### Example Request:
```javascript
// Configure:
// Domain: http://localhost:5000/mock
// API Key: payment-api-key-12345
// Token Type: API Key

// Test:
POST http://localhost:5000/mock/payment/v1/charges
Headers: X-API-Key: payment-api-key-12345
Body: {
  "amount": 1000,
  "currency": "usd",
  "source": "tok_visa",
  "description": "Test payment"
}
```

## 🔧 Configuration Steps

### 1. Add Private API Configuration

1. Login as admin
2. Go to "Private APIs" tab
3. Click "Add API Key"
4. Fill in the details:
   - **Domain**: `http://localhost:5000/mock`
   - **API Key**: `weather-api-key-12345`
   - **Token Type**: `API Key`
5. Click "Add API Key"

### 2. Test the API

1. Go to "API Tester" tab
2. Enter the endpoint URL
3. Authentication headers will be added automatically
4. Click "Send Request"

## 🌐 Real-World Private API Examples

### Example 1: Stripe API
```javascript
// Configuration:
// Domain: https://api.stripe.com
// API Key: sk_test_1234567890abcdef
// Token Type: Bearer

// Request:
POST https://api.stripe.com/v1/charges
Headers: Authorization: Bearer sk_test_1234567890abcdef
Body: amount=1000&currency=usd&source=tok_visa
```

### Example 2: SendGrid API
```javascript
// Configuration:
// Domain: https://api.sendgrid.com
// API Key: SG.1234567890abcdef
// Token Type: Bearer

// Request:
POST https://api.sendgrid.com/v3/mail/send
Headers: Authorization: Bearer SG.1234567890abcdef
Body: {
  "personalizations": [{"to": [{"email": "test@example.com"}]}],
  "from": {"email": "sender@example.com"},
  "subject": "Test",
  "content": [{"type": "text", "value": "Hello"}]
}
```

### Example 3: AWS API Gateway
```javascript
// Configuration:
// Domain: https://api.execute-api.us-west-2.amazonaws.com
// API Key: your-api-key-here
// Token Type: API Key

// Request:
GET https://api.execute-api.us-west-2.amazonaws.com/prod/resource
Headers: X-API-Key: your-api-key-here
```

## 📝 Testing Checklist

- [ ] Backend server is running
- [ ] Frontend is accessible
- [ ] Logged in as admin user
- [ ] Private API configured with correct domain and key
- [ ] Authentication method matches API requirements
- [ ] Request URL includes full path
- [ ] Required headers are set (if not auto-added)
- [ ] Request body format matches API expectations

## 🔍 Troubleshooting

### Common Issues:

1. **401 Unauthorized**
   - Check API key is correct
   - Verify token type (API Key vs Bearer)
   - Ensure domain matches exactly

2. **403 Forbidden**
   - API key may be expired
   - Insufficient permissions

3. **CORS Errors**
   - Backend CORS configuration
   - Ensure domain is in allowed origins

4. **Network Errors**
   - Backend server not running
   - Incorrect port or URL

### Debug Steps:

1. Check browser console for errors
2. Verify backend logs
3. Test with curl/Postman first
4. Check API documentation for exact requirements

## 🚀 Advanced Usage

### Custom Headers
```javascript
// Add custom headers in ApiPilot
Headers: {
  "X-API-Key": "your-key",
  "Content-Type": "application/json",
  "X-Custom-Header": "custom-value"
}
```

### Query Parameters
```javascript
// Add query parameters in Params tab
Key: limit, Value: 10
Key: sort, Value: created_at
```

### Environment Variables
For production, set these in your `.env` file:
```env
PRIVATE_API_TOKENS=token1,token2,token3
PRIVATE_API_KEYS=key1,key2,key3
CORS_ALLOWED_ORIGINS=https://yourapp.com
```

## 📚 Additional Resources

- [REST API Best Practices](https://restfulapi.net/)
- [API Authentication Methods](https://www.oauth.com/)
- [CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [JWT Authentication](https://jwt.io/)
