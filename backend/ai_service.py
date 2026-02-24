from PIL import Image
import numpy as np
from sklearn.cluster import KMeans
from collections import Counter
import io

def rgb_to_hex(rgb):
    return '#{:02x}{:02x}{:02x}'.format(int(rgb[0]), int(rgb[1]), int(rgb[2]))

def analyze_image_colors(image_bytes: bytes, num_colors=5):
    """
    Analyzes an image to find dominant colors.
    Returns a list of hex codes and their estimated percentage.
    """
    try:
        # Open image
        image = Image.open(io.BytesIO(image_bytes))
        image = image.convert('RGB')
        
        # Resize for faster processing (max 150x150)
        image.thumbnail((150, 150))
        
        # Convert to numpy array
        image_array = np.array(image)
        
        # Reshape to list of pixels
        pixels = image_array.reshape(-1, 3)
        
        # Use KMeans to find clusters
        clf = KMeans(n_clusters=num_colors, random_state=42, n_init=10)
        labels = clf.fit_predict(pixels)
        
        # Count labels to find most common
        counts = Counter(labels)
        total_pixels = len(pixels)
        
        # Get centers (colors)
        centers = clf.cluster_centers_
        
        # Sort by frequency
        ordered_colors = []
        for i, count in counts.most_common(num_colors):
            color = centers[i]
            hex_code = rgb_to_hex(color)
            percentage = (count / total_pixels) * 100
            ordered_colors.append({
                "hex": hex_code,
                "percentage": round(percentage, 1),
                "rgb": [int(c) for c in color]
            })
            
        return {
            "colors": ordered_colors,
            "total_colors_detected": len(ordered_colors),
            "primary_color": ordered_colors[0]['hex'] if ordered_colors else None
        }
        
    except Exception as e:
        print(f"Error analyzing image: {e}")
        return {"error": str(e)}
