# Backend Setup

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database Configuration
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=weatherDashboard

# Server Configuration
PORT=3000

# API Configuration
WEATHER_API_BASE_URL=https://api.open-meteo.com/v1/forecast
```

Copy `.env.example` to `.env` and update the values as needed.

## Installation

```bash
npm install
```

## Running

```bash
npm start
# or for development
npm run dev
```

## Testing

```bash
npm test
```

