# Image Similarity - Technical Details

## Overview

The TrackeBack system uses a sophisticated **hybrid image similarity algorithm** that combines deep learning features with color analysis to accurately match found and lost items.

## Algorithm Components

### 1. Deep Feature Extraction (70% weight)
- **Model**: ResNet-50 pretrained on ImageNet
- **Architecture**: 50-layer deep convolutional neural network
- **Features**: 2048-dimensional feature vector from final layer
- **Process**:
  1. Images resized to 256×256, center-cropped to 224×224
  2. Normalized using ImageNet statistics
  3. Forward pass through ResNet-50 (excluding final FC layer)
  4. Extract deep feature embeddings
  5. Calculate cosine similarity between embeddings

**Why ResNet-50?**
- Captures high-level semantic features (shape, texture, patterns)
- Robust to variations in lighting, angle, and background
- Pretrained on 1M+ images, generalizes well to new objects

### 2. Color Analysis (30% weight)

#### Mean LAB Color (40% of color score)
- Converts images from BGR to LAB color space
- LAB space is perceptually uniform (better than RGB)
- Calculates mean L (lightness), A (green-red), B (blue-yellow)
- Focuses on foreground objects using Otsu thresholding
- Compares mean colors using cosine similarity

#### LAB Histogram (60% of color score)
- Creates 32-bin histograms for each LAB channel
- Captures color distribution across the entire object
- More detailed than mean color
- Normalized and compared using cosine similarity

### 3. Final Score Calculation

```python
image_similarity = 0.7 × deep_similarity + 0.3 × color_similarity

where:
color_similarity = 0.4 × mean_LAB_sim + 0.6 × histogram_LAB_sim
```

## Complete Pipeline

```
Input: Two images (lost item image, found item image)
       ↓
1. Foreground Extraction (Otsu thresholding + morphology)
       ↓
2. Deep Features Branch:              Color Features Branch:
   - Resize & crop (224×224)          - Convert to LAB
   - Normalize (ImageNet stats)       - Extract foreground mask
   - ResNet-50 forward pass           - Calculate mean LAB
   - Extract 2048-d vector            - Calculate LAB histogram
   - Cosine similarity                - Cosine similarities
       ↓                                     ↓
3. Weighted Combination
       ↓
Output: Similarity score (0.0 to 1.0)
```

## Example Similarity Scores

| Scenario | Deep Features | Color | Final Score |
|----------|--------------|-------|-------------|
| Same item, different angle | 0.92 | 0.85 | **0.90** |
| Same category, same color | 0.75 | 0.88 | **0.79** |
| Same category, different color | 0.78 | 0.45 | **0.68** |
| Different items, same color | 0.42 | 0.82 | **0.54** |
| Completely different | 0.25 | 0.30 | **0.26** |

## Integration with ML Matching

The image similarity is integrated into the overall match score:

```
Match Score = 0.40 × Description + 0.25 × Image + 0.15 × Location + 
              0.10 × Category + 0.05 × Color + 0.05 × Date
```

**Conditional Usage:**
- If **both items have images**: Image similarity contributes 25%
- If **either lacks image**: Weight redistributed to other factors

## Performance Characteristics

### Strengths:
✅ Robust to lighting variations (LAB color space)
✅ Handles different angles and perspectives (deep features)
✅ Captures both semantic and color information
✅ Works well with occluded or partial views
✅ Pretrained on large dataset (good generalization)

### Limitations:
⚠️ Requires both items to have images
⚠️ GPU recommended for faster processing (works on CPU)
⚠️ First run downloads ResNet-50 weights (~98MB)
⚠️ Memory intensive for large batch processing

## Technical Requirements

```python
# Dependencies
opencv-python>=4.5.0    # Image processing, color analysis
torch>=2.0.0           # Deep learning framework
torchvision>=0.15.0    # ResNet-50 model
Pillow>=9.0.0          # Image loading
numpy>=1.21.0          # Numerical operations
```

## Model Details

**ResNet-50 Architecture:**
- Input: 224×224×3 RGB image
- Layers: conv1 → maxpool → layer1(3 blocks) → layer2(4 blocks) → 
         layer3(6 blocks) → layer4(3 blocks) → avgpool
- Output: 2048-dimensional feature vector
- Parameters: 25.6M
- Pre-training: ImageNet (1000 classes, 1.2M images)

**Color Analysis:**
- Otsu thresholding for adaptive background removal
- Morphological operations (opening, closing) for noise reduction
- LAB color space for perceptual uniformity
- 32-bin histograms for color distribution

## Code Location

- **Main implementation**: `backend/image_similarity.py`
- **Integration**: `backend/ml_matching_service.py` (lines 95-115, 258-266)
- **Testing**: `backend/test_ml_scheduler.py`

## References

- ResNet: "Deep Residual Learning for Image Recognition" (He et al., 2015)
- LAB Color Space: CIE 1976 L*a*b* color space
- Otsu Thresholding: "A Threshold Selection Method from Gray-Level Histograms" (Otsu, 1979)
