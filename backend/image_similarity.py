# image_similarity.py

import cv2
import numpy as np
from numpy.linalg import norm
from PIL import Image
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as T


# -----------------------------------------
# Utility: cosine similarity
# -----------------------------------------
def cosine_sim(v1, v2):
    v1, v2 = np.asarray(v1), np.asarray(v2)
    return float(np.dot(v1, v2) / (norm(v1) * norm(v2) + 1e-10))


# -----------------------------------------
# Foreground Mask using Otsu
# -----------------------------------------
def get_mask(img_bgr):
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    k = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k, iterations=2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k, iterations=2)

    return mask


# -----------------------------------------
# Color Similarity (foreground-only LAB)
# -----------------------------------------
def mean_lab(img_bgr, mask):
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)

    L = lab[:, :, 0][mask == 255]
    A = lab[:, :, 1][mask == 255]
    B = lab[:, :, 2][mask == 255]

    if L.size == 0:
        return np.zeros(3)

    return np.array([np.mean(L), np.mean(A), np.mean(B)], dtype=np.float32)


def hist_lab(img_bgr, mask, bins=32):
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    h = []

    for ch in range(3):
        hist = cv2.calcHist([lab], [ch], mask, [bins], [0, 255])
        hist = cv2.normalize(hist, None).flatten()
        h.append(hist)

    return np.concatenate(h)


def color_similarity(img1, img2):
    mask1 = get_mask(img1)
    mask2 = get_mask(img2)

    # Mean LAB similarity
    mean1 = mean_lab(img1, mask1)
    mean2 = mean_lab(img2, mask2)
    mean_sim = cosine_sim(mean1, mean2)

    # Histogram similarity
    hist1 = hist_lab(img1, mask1)
    hist2 = hist_lab(img2, mask2)
    hist_sim = cosine_sim(hist1, hist2)

    # Equal weights for mean + hist
    return 0.4 * mean_sim + 0.6 * hist_sim


# -----------------------------------------
# ResNet-50 Deep Feature Similarity
# -----------------------------------------
class ResNetEmbed(nn.Module):
    def __init__(self):
        super().__init__()
        base = models.resnet50(pretrained=True)
        self.feat = nn.Sequential(*list(base.children())[:-1])  # remove FC

    def forward(self, x):
        x = self.feat(x)
        return x.view(x.size(0), -1)


# initialize model on load
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
res_model = ResNetEmbed().to(device).eval()

transform = T.Compose([
    T.Resize(256),
    T.CenterCrop(224),
    T.ToTensor(),
    T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


def deep_similarity(path1, path2):
    img1 = Image.open(path1).convert("RGB")
    img2 = Image.open(path2).convert("RGB")

    x1 = transform(img1).unsqueeze(0).to(device)
    x2 = transform(img2).unsqueeze(0).to(device)

    with torch.no_grad():
        v1 = res_model(x1).cpu().numpy().flatten()
        v2 = res_model(x2).cpu().numpy().flatten()

    return cosine_sim(v1, v2)


# -----------------------------------------
# FINAL COMBINED SCORE (FIXED WEIGHTS)
# -----------------------------------------
def image_similarity(path1, path2):
    """
    Returns ONE similarity score (0–1).
    Using fixed weights:
        deep = 0.7
        color = 0.3
    """

    deep_w = 0.7
    color_w = 0.3

    # Deep features similarity
    deep_sim = deep_similarity(path1, path2)

    # Color similarity (foreground LAB)
    img1 = cv2.imread(path1)
    img2 = cv2.imread(path2)
    col_sim = color_similarity(img1, img2)

    # Combined score
    final_score = deep_w * deep_sim + color_w * col_sim
    return float(final_score)
