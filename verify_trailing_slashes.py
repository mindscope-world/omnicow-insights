#!/usr/bin/env python3
# This script will verify that all API files have the correct trailing slashes
import os
import re

# Define the API files to check
api_dir = "/home/mindscope/Lab/hackathons/omnicow-insights/src/lib/api"
files_to_check = [
    "adoption.ts",
    "agent.ts",
    "analytics.ts",
    "demand-forecast.ts",
    "farmers.ts",
    "inputs.ts",
    "input-requests.ts",
    "recommendations.ts",
    "training.ts",
    "visit-logs.ts"
]

print("Checking API files for trailing slashes on all endpoints...")
print("=" * 60)

all_good = True

for filename in files_to_check:
    filepath = os.path.join(api_dir, filename)
    if not os.path.exists(filepath):
        print(f"⚠️  File not found: {filename}")
        continue

    with open(filepath, 'r') as f:
        content = f.read()

    print(f"\n📄 Checking {filename}...")

    # Check for all API endpoints (GET, POST, PUT, DELETE)
    # Look for apiClient.get|post|put|delete(...) calls
    endpoint_matches = re.findall(r'apiClient\.(get|post|put|delete)\s*\(\s*["\']([^"\']*?)[^"\']*?["\']', content, re.IGNORECASE)

    for method, endpoint in endpoint_matches:
        # Check if endpoint should have trailing slash
        # All endpoints should have trailing slashes for consistency with backend
        if not endpoint.endswith('/'):
            # Special case: if it has query parameters, check the base URL
            if '?' in endpoint:
                base_url = endpoint.split('?')[0]
                if not base_url.endswith('/'):
                    print(f"  ❌ Missing trailing slash in base URL: {method.upper()} {base_url}")
                    all_good = False
                else:
                    print(f"  ✅ Has trailing slash in base URL: {method.upper()} {base_url}")
            else:
                print(f"  ❌ Missing trailing slash: {method.upper()} {endpoint}")
                all_good = False
        else:
            print(f"  ✅ Has trailing slash: {method.upper()} {endpoint}")

if all_good:
    print("\n" + "=" * 60)
    print("✅ All API files have correct trailing slashes!")
else:
    print("\n" + "=" * 60)
    print("❌ Some API files are missing trailing slashes")
    print("Please review the output above and fix any issues.")