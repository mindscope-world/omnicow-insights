#!/usr/bin/env python3
# This script verifies that all API service files have been correctly updated
# to not access .data on the response since the client interceptor already does that

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

print("Verifying API service files for correct response handling...")
print("=" * 60)

issues_found = False

for filename in files_to_check:
    filepath = os.path.join(api_dir, filename)
    if not os.path.exists(filepath):
        print(f"⚠️  File not found: {filename}")
        continue

    with open(filepath, 'r') as f:
        content = f.read()

    print(f"\n📄 Checking {filename}...")

    # Look for incorrect .data access after apiClient calls
    # Pattern: apiClient.get|post|put|delete(...) followed by .data
    incorrect_pattern = r'apiClient\.(get|post|put|delete)\s*\([^)]*\)\s*\.\s*data'
    matches = re.findall(incorrect_pattern, content, re.IGNORECASE)

    if matches:
        print(f"  ❌ Found incorrect .access patterns: {matches}")
        issues_found = True
    else:
        print(f"  ✅ No incorrect .data access found")

    # Also check for proper usage - should return response directly or use response for mapping
    # Look for return statements that use response correctly
    correct_return_pattern = r'return\s+response(?:\s*\.\s*\w+)?\s*(?:[;{|])'
    correct_matches = re.findall(correct_return_pattern, content)

    # Check for map operations on response
    map_pattern = r'response\s*\.\s*map'
    map_matches = re.findall(map_pattern, content)

    if correct_matches or map_matches:
        print(f"  ✅ Found correct response usage patterns")
    elif 'return response;' in content or 'return response' in content.replace(' ', ''):
        print(f"  ✅ Found correct return response pattern")

if not issues_found:
    print("\n" + "=" * 60)
    print("✅ All API files have been correctly updated!")
    print("   No incorrect .data access found after API calls.")
else:
    print("\n" + "=" * 60)
    print("❌ Issues found in API files!")
    print("   Please review the output above and fix any incorrect patterns.")