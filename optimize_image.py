#!/usr/bin/env python3
from PIL import Image
import base64
import os

# Input/output paths
input_img = os.path.expandvars(r'$TEMP\placeholder.png')
output_img = os.path.expandvars(r'$TEMP\placeholder-opt.png')

# Open and optimize image
img = Image.open(input_img)
original_size = os.path.getsize(input_img)

# Resize if too large and convert to optimized format
img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
img = img.convert('RGB')  # Convert RGBA to RGB for smaller file
img.save(output_img, 'JPEG', optimize=True, quality=85)

optimized_size = os.path.getsize(output_img)

# Convert to base64
with open(output_img, 'rb') as f:
    base64_str = base64.b64encode(f.read()).decode('utf-8')

print(f"Original size: {original_size:,} bytes")
print(f"Optimized size: {optimized_size:,} bytes")
print(f"Compression: {((original_size - optimized_size) / original_size * 100):.1f}%")
print(f"Base64 data URI length: {len(base64_str):,} characters")
print(f"\nBase64 Data URI (first 200 chars):")
print(f"data:image/jpeg;base64,{base64_str[:200]}...")
print(f"\nFull base64 string saved to: {output_img}.b64")

# Save full base64 to file
with open(f"{output_img}.b64", 'w') as f:
    f.write(f"data:image/jpeg;base64,{base64_str}")

print(f"\nCopy the contents of this file to use as a data URI:")
print(f"@echo off & more < {output_img}.b64")
