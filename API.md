### Endpoint

`GET /hotels`

### Query Parameters

| Name             | Type   | Required | Description                      |
| ---------------- | ------ | -------- | -------------------------------- |
| destination      | string | ✅       | City or area to stay in          |
| arrival_date     | string | ✅       | Format: YYYY-MM-DD               |
| departure_date   | string | ✅       | Format: YYYY-MM-DD               |
| budget_per_night | number | ❌       | Approx budget per night          |
| travelers        | number | ❌       | Number of travelers (default: 1) |
| purpose          | string | ❌       | Trip type (default: leisure)     |

### Example Request

```bash
curl "http://127.0.0.1:8000/hotels?destination=Tokyo&arrival_date=2025-05-12&departure_date=2025-05-18&budget_per_night=180&travelers=2&purpose=leisure"
```
