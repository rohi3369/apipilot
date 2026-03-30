// Sample private API configurations for testing
export const samplePrivateApis = [
  {
    name: "Weather API",
    domain: "https://api.weathercompany.com",
    apiKey: "weather-api-key-12345",
    tokenType: "api_key",
    description: "Private weather data service",
    endpoints: [
      {
        method: "GET",
        path: "/v1/current",
        description: "Get current weather"
      },
      {
        method: "GET", 
        path: "/v1/forecast",
        description: "Get weather forecast"
      }
    ]
  },
  {
    name: "Analytics API",
    domain: "https://analytics.yourcompany.com",
    apiKey: "bearer-token-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    tokenType: "bearer",
    description: "Private analytics tracking service",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/events",
        description: "Track analytics events"
      },
      {
        method: "GET",
        path: "/api/v1/reports",
        description: "Get analytics reports"
      }
    ]
  },
  {
    name: "Internal CRM",
    domain: "https://crm.internal.company.com",
    apiKey: "crm-api-key-abcdef",
    tokenType: "api_key",
    description: "Internal CRM system",
    endpoints: [
      {
        method: "GET",
        path: "/api/v2/contacts",
        description: "List contacts"
      },
      {
        method: "POST",
        path: "/api/v2/contacts",
        description: "Create contact"
      },
      {
        method: "PUT",
        path: "/api/v2/contacts/{id}",
        description: "Update contact"
      }
    ]
  },
  {
    name: "Payment Gateway",
    domain: "https://api.paymentprovider.com",
    apiKey: "payment-api-key-xyz789",
    tokenType: "api_key",
    description: "Private payment processing",
    endpoints: [
      {
        method: "POST",
        path: "/v1/charges",
        description: "Create payment charge"
      },
      {
        method: "GET",
        path: "/v1/charges/{id}",
        description: "Get charge details"
      },
      {
        method: "POST",
        path: "/v1/refunds",
        description: "Process refund"
      }
    ]
  }
];

// Example requests you can try in ApiPilot
export const exampleRequests = [
  {
    name: "Get Current Weather",
    method: "GET",
    url: "https://api.weathercompany.com/v1/current?city=New York",
    headers: [
      { k: "X-API-Key", v: "weather-api-key-12345" }
    ],
    body: ""
  },
  {
    name: "Track Analytics Event",
    method: "POST", 
    url: "https://analytics.yourcompany.com/api/v1/events",
    headers: [
      { k: "Authorization", v: "Bearer bearer-token-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" }
    ],
    body: JSON.stringify({
      event: "user_login",
      userId: "12345",
      timestamp: new Date().toISOString()
    })
  },
  {
    name: "Get CRM Contacts",
    method: "GET",
    url: "https://crm.internal.company.com/api/v2/contacts?limit=10",
    headers: [
      { k: "X-API-Key", v: "crm-api-key-abcdef" }
    ],
    body: ""
  },
  {
    name: "Create Payment Charge",
    method: "POST",
    url: "https://api.paymentprovider.com/v1/charges",
    headers: [
      { k: "X-API-Key", v: "payment-api-key-xyz789" },
      { k: "Content-Type", v: "application/json" }
    ],
    body: JSON.stringify({
      amount: 1000,
      currency: "usd",
      source: "tok_visa",
      description: "Test payment"
    })
  }
];
