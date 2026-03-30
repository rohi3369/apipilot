// Real-world API templates for testing
export const realApiTemplates = [
  {
    name: "E-Signature API",
    domain: "http://localhost:3333",
    description: "Contract e-signature creation API",
    authentication: {
      type: "api_key",
      header: "X-API-Key"
    },
    endpoints: [
      {
        name: "Create E-Signature",
        method: "POST",
        path: "/esign/create",
        headers: {
          "Content-Type": "application/json"
        },
        bodyTemplate: {
          "entry": 2,
          "system": "PE-STAGE",
          "provider": "docusign",
          "sendEmail": false,
          "callbackUrl": "https://preprod.free.beeceptor.com",
          "reference": "BEQ3485219",
          "market": "UK",
          "supplier": "BGL",
          "supplier_name": "Scottish & Southern Electricity",
          "meter": {
            "type": "elec",
            "number": "0401512031012351310964",
            "serial": "216546804",
            "tariff": "MQ0009938"
          },
          "currentcontractenddate": "2026-04-02",
          "capa": [],
          "consumption": [
            {
              "key": "Night",
              "value": "2038.700",
              "totalPerContract": "4077.400"
            },
            {
              "key": "Day",
              "value": "13148.100",
              "totalPerContract": "26296.200"
            },
            {
              "key": "Total",
              "value": "15186.800",
              "totalPerContract": "30373.600"
            }
          ],
          "contract": {
            "offer": {
              "type": "fixed",
              "green": null,
              "date": "2026-03-09 09:01",
              "valid": "2026-12-19 16:30"
            },
            "period": {
              "start": "2026-04-03",
              "end": "2028-04-02 23:59:59",
              "duration": 24,
              "durationDays": 731,
              "durationMonths": 24,
              "durationYears": 2
            },
            "autorenew": true,
            "outofcontract": false,
            "commission": {
              "type": "uplift",
              "uplift": [
                {
                  "type": "auto",
                  "value": "1.000",
                  "denomination": "p"
                }
              ],
              "values": [
                {
                  "type": "ngp",
                  "value": "304.152",
                  "upliftSplit": [
                    {
                      "type": "auto",
                      "value": "1.000",
                      "denomination": "p"
                    }
                  ],
                  "yearlyvalue": "151.868",
                  "denomination": "£"
                }
              ]
            }
          },
          "cost": {
            "annualCost": "3929.322",
            "monthlyCost": "327.443",
            "contractCost": "7858.644",
            "annualCcl": "121.646",
            "annualVat": "810.192",
            "monthlyCostIncCclVat": "405.096"
          },
          "prices": [
            {
              "key": "Day",
              "value": "23.155",
              "dailyCost": "8.341",
              "monthlyCost": "253.707",
              "quarterlyCost": "761.122",
              "annualCost": "3044.487",
              "contractCost": "6088.974"
            },
            {
              "key": "Night",
              "value": "17.133",
              "dailyCost": "0.957",
              "monthlyCost": "29.107",
              "quarterlyCost": "87.321",
              "annualCost": "349.284",
              "contractCost": "698.568"
            },
            {
              "key": "Standing Charge",
              "value": "146.726",
              "dailyCost": "1.467",
              "monthlyCost": "44.629",
              "quarterlyCost": "133.888",
              "annualCost": "535.551",
              "contractCost": "1071.102"
            }
          ],
          "manualEntries": [],
          "company": {
            "code": "13355051",
            "name": "NGP LIMITED",
            "type": "Private Limited Company (LTD)",
            "classificationCode": "68209",
            "classificationDesc": "Other letting and operating of own or leased real estate",
            "employees": 2,
            "turnover": 0,
            "micro": true,
            "businesstype": "Micro",
            "address": {
              "door": "Suite 16 Enterprise House",
              "street": "Telford Road",
              "city": "Bicester, Oxon",
              "postcode": "OX26 4LD",
              "country": "U.K."
            }
          },
          "site": {
            "address": {
              "city": "BEDFORDSHIRE",
              "door": "WARREN COURT",
              "street": "UNIT 6-7, CHICKSANDS, SHEFFORD",
              "postcode": "SG17 5QB",
              "country": "U.K."
            }
          },
          "person": {
            "title": "Mr",
            "lastName": "az",
            "firstName": "an",
            "job": "TESTER",
            "email": "nikhilr@ngpwebsmart.com",
            "telephone": "11111111111",
            "mobile": null
          },
          "billingAddress": {
            "door": "Suite 16 Enterprise House",
            "street": "Telford Road",
            "city": "Bicester, Oxon",
            "postcode": "OX26 4LD",
            "country": "U.K."
          },
          "payment": "customerInput",
          "completeUrl": "https://beq.clearvue.dev/completed",
          "currentSupplier": {
            "internal": "BGL",
            "code": "BIZZ",
            "name": "British Gas Trading Ltd"
          },
          "SSE": {
            "AVEPPU": "25.873",
            "bills": 8,
            "totalSc": "1071.104"
          },
          "addDirectDebit": true,
          "public": true,
          "isNGPTemplate": false,
          "documentName": "BEQ3485219_1773046959925"
        }
      }
    ]
  },
  {
    name: "Stripe Payment API",
    domain: "https://api.stripe.com",
    description: "Stripe payment processing",
    authentication: {
      type: "bearer",
      header: "Authorization"
    },
    endpoints: [
      {
        name: "Create Payment Intent",
        method: "POST",
        path: "/v1/payment_intents",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        bodyTemplate: "amount=1000&currency=usd&payment_method=pm_card_visa"
      }
    ]
  },
  {
    name: "SendGrid Email API",
    domain: "https://api.sendgrid.com",
    description: "Email sending service",
    authentication: {
      type: "bearer",
      header: "Authorization"
    },
    endpoints: [
      {
        name: "Send Email",
        method: "POST",
        path: "/v3/mail/send",
        headers: {
          "Content-Type": "application/json"
        },
        bodyTemplate: {
          "personalizations": [
            {
              "to": [{"email": "test@example.com"}],
              "subject": "Test Email"
            }
          ],
          "from": {"email": "sender@example.com"},
          "content": [
            {"type": "text/plain", "value": "Hello from SendGrid!"}
          ]
        }
      }
    ]
  },
  {
    name: "Slack API",
    domain: "https://slack.com",
    description: "Slack messaging and integration",
    authentication: {
      type: "bearer",
      header: "Authorization"
    },
    endpoints: [
      {
        name: "Post Message",
        method: "POST",
        path: "/api/chat.postMessage",
        headers: {
          "Content-Type": "application/json"
        },
        bodyTemplate: {
          "channel": "#general",
          "text": "Hello from API!"
        }
      }
    ]
  }
];

// Helper function to format API for testing
export const formatApiForTesting = (template) => {
  return {
    name: template.name,
    domain: template.domain,
    authentication: template.authentication,
    testRequests: template.endpoints.map(endpoint => ({
      method: endpoint.method,
      url: `${template.domain}${endpoint.path}`,
      headers: endpoint.headers,
      body: typeof endpoint.bodyTemplate === 'string' 
        ? endpoint.bodyTemplate 
        : JSON.stringify(endpoint.bodyTemplate, null, 2)
    }))
  };
};
