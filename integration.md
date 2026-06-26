# Frontend-Backend Integration Guide

This document describes the step-by-step process to integrate the TanStack Start frontend with the FastAPI/Neo4j backend.

## Overview

The frontend currently uses mock data from `src/lib/omnicow/data.ts`. To connect to the real backend, we need to:
1. Configure the backend to accept frontend requests
2. Replace mock data calls with actual API calls
3. Handle authentication, error states, and loading states appropriately

## Prerequisites

- Backend running and accessible (typically at `http://localhost:8000`)
- Frontend development server running (typically at `http://localhost:5173` or similar)
- Node.js and Python environments set up
- Required dependencies installed for both frontend and backend

## Step 1: Backend Configuration

### 1.1 Update CORS Settings

The backend needs to allow requests from the frontend origin.

Edit `backend/app/core/config.py`:

```python
# CORS settings - update to include your frontend URL
BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173"]  # Add your frontend URL(s)
```

For development, you can also use:
```python
BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
```

### 1.2 Environment Configuration

Ensure `.env` file in backend directory contains proper settings:

```env
# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password
NEO4J_DATABASE=neo4j

# Security
SECRET_KEY=your_strong_secret_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS Origins (comma-separated)
BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 1.3 Verify Neo4j Connection

Test that the backend can connect to Neo4j:
```bash
cd backend
python check_neo4j.py
```

### 1.4 Start the Backend

```bash
cd backend
# Activate virtual environment if needed
source venv/bin/activate
# Install dependencies if not already installed
pip install -r requirements.txt
# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API documentation will be available at `http://localhost:8000/docs`

## Step 2: Frontend Preparation

### 2.1 Install Required Dependencies

```bash
# Install axios or fetch polyfill if needed
npm install axios
# Optional: install react-query for data fetching (already included)
# npm install @tanstack/react-query
```

### 2.2 Create API Service Layer

Create a new directory for API services: `src/lib/api/`

Create `src/lib/api/client.ts`:

```typescript
import axios from 'axios';

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle common error cases
    if (error.response?.status === 401) {
      // Redirect to login or handle unauthorized access
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

Create `src/lib/api/farmers.ts`:

```typescript
import apiClient from './client';
import type { Farmer } from '@/lib/omnicow/data';

// Farmer API functions
export const farmerApi = {
  // Get all farmers with optional filters
  getFarmers: async (
    skip: number = 0,
    limit: number = 100,
    filters?: Record<string, any>
  ) => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      ...filters,
    });
    return await apiClient.get(`/farmers?${params.toString()}`);
  },

  // Get single farmer by ID
  getFarmerById: async (farmerId: string) => {
    return await apiClient.get(`/farmers/${farmerId}`);
  },

  // Create new farmer
  createFarmer: async (farmerData: Partial<Farmer>) => {
    return await apiClient.post('/farmers', farmerData);
  },

  // Update existing farmer
  updateFarmer: async (farmerId: string, farmerData: Partial<Farmer>) => {
    return await apiClient.put(`/farmers/${farmerId}`, farmerData);
  },

  // Delete/deactivate farmer
  deleteFarmer: async (farmerId: string) => {
    await apiClient.delete(`/farmers/${farmerId}`);
  },

  // Get farmer adoption history
  getFarmerAdoptionHistory: async (farmerId: string) => {
    return await apiClient.get(`/farmers/${farmerId}/adoption-history`);
  },
};
```

Create similar service files for other endpoints (training, adoption, etc.) as needed.

### 2.3 Configure Environment Variables

Create `.env` file in the frontend root directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
# Optional: other configuration variables
```

Update `vite.config.ts` if needed to ensure environment variables are loaded:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteTsconfigPaths } from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), viteTsconfigPaths()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
```

## Step 3: Replace Mock Data with API Calls

### 3.1 Update Data Fetching in Components

Replace imports from mock data with API service calls.

Example: Update `src/routes/index.tsx` (priority queue):

```typescript
// OLD IMPORT (mock data)
// import { FARMERS, priorityCounts } from '@/lib/omnicow/data';

// NEW IMPORT (API service)
import { farmerApi } from '@/lib/api/farmers';
import { useQuery } from '@tanstack/react-query';

// In your component:
const PriorityQueue = () => {
  const { data: farmers = [], isLoading, error } = useQuery({
    queryKey: ['farmers', { priority: 'urgent' }],
    queryFn: () => farmerApi.getFarmers(0, 50, { priority: 'urgent' }),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading farmers</div>;

  // Process farmers data as needed
  return (
    // ... your JSX
  );
};
```

### 3.2 Update Farmer Profiles Page

Update `src/routes/farmers.tsx`:

```typescript
// OLD IMPORT
// import { FARMERS, type Farmer } from '@/lib/omnicow/data';

// NEW IMPORT
import { farmerApi } from '@/lib/api/farmers';
import { useQuery, useQueries } from '@tanstack/react-query';

function FarmerProfiles() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");

  // Fetch farmers list
  const { data: allFarmers = [], isLoading, error } = useQuery({
    queryKey: ['farmers', { search: query }],
    queryFn: () => farmerApi.getFarmers(0, 1000), // Adjust limit as needed
  });

  // Filter locally or implement server-side filtering
  const filteredFarmers = allFarmers.filter(farmer =>
    farmer.id.toLowerCase().includes(query.toLowerCase()) ||
    farmer.name?.toLowerCase().includes(query.toLowerCase())
  );

  // Fetch selected farmer details
  const { data: selectedFarmer, isLoading: loadingDetail } = useQuery({
    queryKey: ['farmer', selectedId],
    queryFn: () => selectedFarmer ? farmerApi.getFarmerById(selectedId) : null,
    enabled: !!selectedId,
  });

  // ... rest of component
}
```

### 3.3 Update Other Pages

Apply similar changes to:
- `src/routes/clusters.tsx`
- `src/routes/follow-up.tsx`
- `src/routes/settings.tsx`
- `src/routes/trends.tsx`
- Any other components using mock data

## Step 4: Handle Authentication (If Required)

If your backend requires authentication:

### 4.1 Create Auth Service

Create `src/lib/api/auth.ts`:

```typescript
import apiClient from './client';

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', credentials);
    // Store token
    localStorage.setItem('access_token', response.access_token);
    return response;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('access_token');
  },

  getCurrentUser: async () => {
    return await apiClient.get('/auth/me');
  },
};
```

### 4.2 Create Login Page

Create `src/routes/login.tsx`:

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { authApi } from "@/lib/api/auth";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.login({ email, password });
      navigate("/"); // Redirect to homepage after login
    } catch (error) {
      // Handle error (show message to user)
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Login to OmniCow</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
```

### 4.3 Add Auth Protection to Routes

Create a wrapper component or use route loaders to protect routes that require authentication.

## Step 5: Handle Data Transformation

The backend may return data in a different format than the mock data. Create adapter functions if needed.

Create `src/lib/api/adapters.ts`:

```typescript
// Adapter to convert backend farmer format to frontend format if needed
export const adaptFarmerFromBackend = (backendFarmer: any): Farmer => {
  return {
    id: backendFarmer.id,
    ward: backendFarmer.ward,
    subCounty: backendFarmer.subCounty,
    county: backendFarmer.county,
    cluster: backendFarmer.cluster,
    priority: backendFarmer.priority,
    day7: backendFarmer.day7_score,
    day90: backendFarmer.day90_score,
    day120: backendFarmer.day120_score,
    window: {
      kind: backendFarmer.window_kind as any,
      daysRemaining: backendFarmer.days_remaining,
    },
    shap: backendFarmer.shap_explanation,
    // Map other fields as needed
    gender: backendFarmer.gender,
    age: backendFarmer.age,
    ageGroup: backendFarmer.age_group,
    registration: backendFarmer.registration_method,
    cooperative: backendFarmer.cooperative_name,
    lastContact: backendFarmer.last_contact_date,
    firstTraining: backendFarmer.first_training_date,
    trainers: backendFarmer.trainers || [],
    topics: backendFarmer.topics || [],
    history: backendFarmer.intervention_history || [],
    // Graph features
    pageRank: backendFarmer.page_rank,
    peerAdoptionRatio: backendFarmer.peer_adoption_ratio,
    influence: backendFarmer.influence_score,
    communitySize: backendFarmer.community_size,
    momentum: backendFarmer.momentum as any,
    adopted: backendFarmer.has_adopted,
    lat: backendFarmer.latitude,
    lng: backendFarmer.longitude,
    shapFeatures: backendFarmer.shap_features || [],
  };
};

// Then use in your API service:
// const response = await apiClient.get(`/farmers/${id}`);
// const farmer = adaptFarmerFromBackend(response);
```

## Step 6: Error Handling and Loading States

### 6.1 Create Custom Hooks for Data Fetching

Create `src/lib/hooks/useApi.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';

export const useApiQuery = <T = any>(key: string[], queryFn: () => Promise<T>) => {
  return useQuery<T, Error>({
    queryKey: key,
    queryFn,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useApiMutation = <T = any, V = any>(
  mutationFn: (variables: V) => Promise<T>
) => {
  const queryClient = useQueryClient();
  return useMutation<T, Error, V>({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries(); // Refetch all queries on success
    },
  });
};
```

### 6.2 Implement Global Error Handling

Create an error boundary or use react-query's built-in error handling.

## Step 7: Testing the Integration

### 7.1 Start Both Servers

Terminal 1 (Backend):
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

Terminal 2 (Frontend):
```bash
npm run dev
```

### 7.2 Verify API Calls

1. Open browser dev tools → Network tab
2. Check that requests are going to `http://localhost:8000/api/v1/*`
3. Verify responses contain real data from Neo4j
4. Ensure mock data imports are no longer being used

### 7.3 Test Edge Cases

- Empty states
- Error states (network errors, 500 errors)
- Loading states
- Authentication flows (if implemented)
- Data consistency between frontend and backend

## Step 8: Production Considerations

### 8.1 Environment Variables

Use different environment files for different environments:
- `.env.development`
- `.env.production`
- `.env.staging`

### 8.2 API Versioning

Consider versioning your API calls if the backend might change:
```typescript
baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
```

### 8.3 Caching Strategy

Adjust react-query caching strategies based on data volatility:
```typescript
useQuery({
  queryKey: ['farmers'],
  queryFn: () => farmerApi.getFarmers(),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

### 8.4 Rate Handling

Implement retry mechanisms and exponential backoff for failed requests:
```typescript
// In apiClient.ts or use custom query functions
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 429) {
      // Handle rate limiting
      // Implement retry-after logic
    }
    return Promise.reject(error);
  }
);
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Solution: Verify `BACKEND_CORS_ORIGINS` in backend config includes frontend URL
   - Check that the backend is actually picking up the environment variables

2. **Connection Refused**
   - Solution: Ensure backend is running on the expected port
   - Check firewall settings
   - Verify `uvicorn` is binding to `0.0.0.0` not just `127.0.0.1`

3. **404 Errors**
   - Solution: Verify API endpoints exist in backend
   - Check that the base URL is correct (including `/api/v1` prefix)

4. **Authentication Errors**
   - Solution: Verify tokens are being stored and sent correctly
   - Check backend authentication endpoints

### Debugging Tips

1. Enable API debug logging in backend:
   ```python
   # In main.py or config
   import logging
   logging.basicConfig(level=logging.DEBUG)
   ```

2. Use browser dev tools to inspect network requests
3. Test API endpoints directly using curl or Postman:
   ```bash
   curl http://localhost:8000/api/v1/farmers
   ```
4. Check backend logs for detailed error messages

## Files Modified Summary

### Backend Changes:
- `backend/app/core/config.py` - CORS origins
- `backend/.env` - Environment variables

### Frontend Changes:
- `src/lib/api/client.ts` - Axios instance with interceptors
- `src/lib/api/farmers.ts` (and other endpoint services) - API service layer
- `src/lib/api/adapters.ts` - Data transformation helpers
- `src/lib/hooks/useApi.ts` - Custom hooks for data fetching
- `src/routes/*.tsx` - Replace mock data imports with API calls
- `.env` - Frontend environment variables
- `src/routes/login.tsx` (if auth needed) - Authentication page

## Verification Checklist

- [ ] Backend server running and accessible
- [ ] CORS properly configured
- [ ] Frontend can reach backend API endpoints
- [ ] Mock data imports replaced with API service calls
- [ ] Loading and error states handled
- [ ] Data displays correctly from backend
- [ ] Authentication workflow (if applicable) functions correctly
- [ ] No console errors related to data fetching
- [ ] Responsive design maintained