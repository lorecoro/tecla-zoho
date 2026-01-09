curl --request POST \
  --url https://tecla-zoho.mydomain.com/zoho/calendar/create \
  --header 'Authorization: Basic V...5' \
  --header 'Content-Type: application/json' \
  --data '{
    "summary": "TEST",
    "location": "",
    "description": "Test",
    "start": "2026-01-01T10:30:00+01:00",
    "end": "2026-01-01T11:30:00+01:00",
    "attendees": [
      {"email": "myemail@gmail.com"}
    ],
    "reminders": {
      "useDefault": true
    }
}'
