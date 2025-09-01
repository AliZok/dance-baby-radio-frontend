# API Environment Setup

## Overview
Your API calls are now configured to use the `API_BASE_URL` environment variable with a professional fallback to `http://localhost:4000`. The system uses `config.public.baseUrl` internally.

## Configuration

### 1. Environment Variable
Create a `.env` file in your project root:

```bash
# .env
API_BASE_URL=https://backend-dance-baby-radio.onrender.com
```

### 2. Fallback Behavior
- If `API_BASE_URL` is not set, defaults to `http://localhost:4000`
- If `.env` file doesn't exist, uses the default fallback

## Usage

Your existing API calls will automatically use the environment variable:

```javascript
// This will call: https://backend-dance-baby-radio.onrender.com/api/endpoint
const { getData } = useAPI()
const result = await getData('/api/endpoint')

// This will call: https://backend-dance-baby-radio.onrender.com/api/users
const result = await getData('/api/users')
```

## Environment Examples

### Production
```bash
API_BASE_URL=https://backend-dance-baby-radio.onrender.com
```

### Development
```bash
API_BASE_URL=http://localhost:4000
```

### Custom Backend
```bash
API_BASE_URL=https://your-custom-backend.com
```

## Professional Features

- ✅ **Automatic URL Construction**: Handles endpoint formatting
- ✅ **Environment Fallback**: Graceful fallback to localhost:4000
- ✅ **Clean Integration**: Works with your existing API calls
- ✅ **No Breaking Changes**: Your current code continues to work
