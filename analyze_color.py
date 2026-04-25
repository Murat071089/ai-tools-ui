import cv2
import numpy as np

img = cv2.imread(r"c:\Users\user\Desktop\ии продажи\checkout-bg.png")
if img is not None:
    # Resize for faster processing
    img = cv2.resize(img, (100, 100))
    # Convert BGR to RGB
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Get max pixel values to see if there is a bright spot
    max_val = np.max(img, axis=(0, 1))
    avg_val = np.mean(img, axis=(0, 1))
    print("Max (R,G,B):", max_val)
    print("Avg (R,G,B):", avg_val)
else:
    print("Image not loaded")
