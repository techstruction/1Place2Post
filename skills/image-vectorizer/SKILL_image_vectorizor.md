---
name: image-vectorizer
description: High-quality conversion of raster images (PNG, JPG, TIFF) to vector formats (SVG, EPS, PDF, DXF). Use this skill when the user wants to "vectorize", "trace", or "convert to svg/illustrator" an image from a local path, URL, or cloud storage.
---

# Image Vectorizer Skill

This skill enables the high-fidelity conversion of raster images into vector graphics. It supports a tiered approach to balance quality and speed.

## Core Capabilities

1.  **Input Support**: Local files, URLs, and browser-based uploads.
2.  **Output Formats**: 
    -   **SVG**: Standard web vector format.
    -   **EPS/PDF**: Illustrator and Print-ready formats.
    -   **DXF**: CAD and Plotter-ready formats.
3.  **Methods**:
    -   **Tier 1 (Browser AI)**: Best for complex color images, gradients, and professional prints.
    -   **Tier 2 (Local CLI)**: Best for speed, offline usage, and simple icons/logos.

---

## Instructions for the Agent

### Step 1: Gather Input
-   If file is a **URL**: Download it to `/tmp/input_image` first unless using the browser method directly.
-   If file is **Local**: Ensure you have the absolute path.
-   If "Cloud Storage/Drag and Drop" is mentioned: Use the `browser` tool to navigate to the source (e.g., GDrive, Dropbox) if credentials or links are provided, or ask the user to provide a direct link/file.

### Step 2: Choose Method (Preference to User Choice)
Ask the user if they prefer **Premium (Browser-based AI)** or **Fast (Local CLI)** if not specified.
Default to **Premium** for complex images and **Fast** for simple B&W logos.

### Step 3: Implementation - Premium Method (Vectorizer.ai)
1.  Open `https://vectorizer.ai/` using the `browser` tool.
2.  Upload the image. Use `browser_subagent` to:
    -   Click the upload area or use `file_input` if available.
    -   Wait for processing (usually 5-10 seconds).
    -   Click "Download".
3.  **Selection**: In the download dialog, select the requested format (SVG, EPS, PDF, DXF).
    -   Note: Illustrator users usually want **EPS** or **PDF**.
    -   Photoshop users usually want **SVG** or **EPS**.
4.  Download the result and move it to the user's requested destination.

### Step 4: Implementation - Fast Method (VTracer CLI)
Use the bundled `vtracer` binary located at:
`[repo_root]/skills/image-vectorizer/scripts/bin/vtracer`

**Example Command (Color):**
```bash
./vtracer --input input.png --output output.svg --colormode color --mode spline --preset photo
```

**Example Command (B&W):**
```bash
./vtracer --input input.png --output output.svg --colormode bw --mode spline --preset bw
```

### Step 5: Finalize Output
-   Provide the final vector file path to the user.
-   If possible, use `generate_image` or a browser screenshot to show a preview of the SVG.

---

## Reference Commands for VTracer
-   `--mode [spline|polygon]`: Spline is usually smoother.
-   `--filter_speckle [int]`: Remove noise (default 4).
-   `--color_precision [1-8]`: Higher is more detailed (default 6).
-   `--hierarchical [cutoff|stacked]`: Stacked is better for layers.
