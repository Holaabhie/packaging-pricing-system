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
        
        # Check for transparency (Alpha channel) heuristics before converting
        has_transparency = False
        try:
            original = Image.open(io.BytesIO(image_bytes))
            if original.mode in ('RGBA', 'LA') or (original.mode == 'P' and 'transparency' in original.info):
                # Simple check if there are any transparent pixels
                alpha = np.array(original.convert('RGBA'))[:, :, 3]
                if np.min(alpha) < 255:
                    has_transparency = True
        except Exception:
            pass

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
        
        # Detect heuristics for Matte/Glossy based on contrast/variance (very basic heuristic)
        variance = np.var(pixels)
        surface_finish = "Glossy/High Contrast" if variance > 3000 else "Matte/Low Contrast"
        
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
            
        suggested_outer_material = "PET" if surface_finish == "Glossy/High Contrast" else "BOPP"
        if has_transparency:
            suggested_inner_material = "LDPE/CPP (Clear)"
        else:
            suggested_inner_material = "MET_PET / AL_FOIL"

        return {
            "colors": ordered_colors,
            "total_colors_detected": len(ordered_colors),
            "primary_color": ordered_colors[0]['hex'] if ordered_colors else None,
            "has_transparency": has_transparency,
            "surface_finish_heuristic": surface_finish,
            "suggested_materials": {
                "outer": suggested_outer_material,
                "inner_barrier": suggested_inner_material
            }
        }
        
    except Exception as e:
        import traceback
        print(f"Error analyzing image: {e}")
        traceback.print_exc()
        return {"error": str(e)}
