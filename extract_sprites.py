from PIL import Image
import numpy as np
import base64
import io
import os
import json

img = Image.open(r'C:\Users\Fit You\Desktop\Projeto do Vini\cats\sprite sheet simy.png')
arr = np.array(img)

# Frame definitions: (name, x1, x2, y1, y2)
frames_def = [
    ('idle',      68,  309,  74, 312),
    ('walk1',    388,  640,  74, 312),
    ('walk2',    716,  956,  74, 312),
    ('walk3',     63,  318, 377, 612),
    ('jump_up',  395,  616, 377, 612),
    ('crouch',   696,  971, 377, 612),
    ('jump_down', 42,  317, 667, 912),
    ('death',    381,  654, 667, 912),
    ('victory',  697,  924, 667, 912),
]

TARGET_SIZE = 128

def remove_green_bg(pixels, threshold=80):
    """Remove green background using chroma key"""
    bg = np.array([22, 237, 18], dtype=float)
    dist = np.sqrt(np.sum((pixels.astype(float) - bg) ** 2, axis=2))
    alpha = np.where(dist > threshold, 255, 0).astype(np.uint8)
    return alpha

output_dir = r'C:\Users\Fit You\Desktop\Projeto do Vini\sprite_test'
os.makedirs(output_dir, exist_ok=True)

b64_frames = {}

for name, x1, x2, y1, y2 in frames_def:
    # Crop frame
    crop = img.crop((x1, y1, x2 + 1, y2 + 1))
    
    # Convert to RGBA
    crop_rgba = crop.convert('RGBA')
    crop_arr = np.array(crop_rgba)
    
    # Remove green background
    rgb = crop_arr[:, :, :3]
    alpha = remove_green_bg(rgb)
    crop_arr[:, :, 3] = alpha
    
    # Create result image with transparent background
    result = Image.fromarray(crop_arr, 'RGBA')
    
    # Resize to TARGET_SIZE maintaining aspect ratio
    # First fit inside a box, then paste centered
    result.thumbnail((TARGET_SIZE, TARGET_SIZE), Image.LANCZOS)
    
    # Create final image at exact size
    final = Image.new('RGBA', (TARGET_SIZE, TARGET_SIZE), (0, 0, 0, 0))
    offset_x = (TARGET_SIZE - result.width) // 2
    offset_y = (TARGET_SIZE - result.height) // 2
    final.paste(result, (offset_x, offset_y), result)
    
    # Save as PNG
    final.save(os.path.join(output_dir, f'{name}.png'))
    
    # Convert to base64
    buf = io.BytesIO()
    final.save(buf, format='PNG')
    b64 = base64.b64encode(buf.getvalue()).decode('ascii')
    b64_frames[name] = f'data:image/png;base64,{b64}'
    
    print(f'{name}: {result.width}x{result.height} (from {x2-x1+1}x{y2-y1+1})')

# Save base64 data as JSON for reference
with open(os.path.join(output_dir, 'frames.json'), 'w') as f:
    # Just save names, too large for full b64
    json.dump({k: len(v) for k, v in b64_frames.items()}, f, indent=2)

print('\nFrames extracted to:', output_dir)
print(f'Each frame: {TARGET_SIZE}x{TARGET_SIZE}px with transparent background')
