# imgdithr REST API Documentation

imgdithr provides a RESTful API for developers to process images programmatically. The API allows you to apply all of imgdithr's non-destructive image processing modes in a stateless, single-pass request.

## Authentication

All API requests must be authenticated using a Bearer token.
By default, you can configure your API key in the `.env` file using the `API_KEY` variable.

**Header Format:**
```http
Authorization: Bearer <YOUR_API_KEY>
```

> [!WARNING]
> **Security Best Practices**
> - **Always use HTTPS/TLS** in production. Since this API uses a static Bearer token, transmitting it over unencrypted HTTP makes it trivial to intercept via Man-in-the-Middle (MITM) attacks.
> - **Keep your API key secret**. Never commit your `.env` file to version control or expose the key in client-side code (e.g., frontend JavaScript).

---

## Endpoint: Process Image

**URL**: `/api/v1/process`
**Method**: `POST`
**Content-Type**: `multipart/form-data`

### Request Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `image` | File | **Yes** | The image file to process. |
| `mode` | String | **Yes** | The processing mode to apply (see below). |
| `save_format` | String | No | The output format: `AUTO`, `PNG`, `JPEG`, `WEBP`, `GIF`. Default is `PNG` or `AUTO`. |

*(Additional parameters depend on the `mode` selected. See the Modes section below.)*

### Response

- **Success (200 OK)**: Returns the processed image file directly as a binary attachment.
- **Error (400/401/500)**: Returns a JSON object with an `error` message.

---

## Processing Modes & Parameters

Append these parameters to your `multipart/form-data` request based on the `mode` you specify.

### 1. `mode="resolution"` (Resize)
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `resize_type` | String | `"percentage"` or empty (pixel dimensions). |
| `percentage` | Float | Scale percentage (e.g., `50` for 50%), required if `resize_type="percentage"`. |
| `width` | Int | Target width in pixels. |
| `height` | Int | Target height in pixels. |

### 2. `mode="crop"` (Crop & Transform)
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `crop_x` | Int | Starting X coordinate. Default `0`. |
| `crop_y` | Int | Starting Y coordinate. Default `0`. |
| `crop_w` | Int | Crop width. |
| `crop_h` | Int | Crop height. |
| `crop_rotate` | Float | Rotation angle in degrees (before cropping). |
| `crop_scaleX` | Float | Set to `-1` to horizontally mirror the image. |
| `crop_scaleY` | Float | Set to `-1` to vertically flip the image. |

### 3. `mode="rotate"`
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `rotate_deg` | Int | Rotation angle in degrees. Default `90`. |

### 4. `mode="filter"` (Color Filters)
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `filter_type` | String | `"grayscale"`, `"sepia"`, `"blue"`, `"warm"`, `"invert"`, `"posterize"`, `"high_contrast"`, `"vintage"`, or `"none"`. |

### 5. `mode="adjust"` (Basic Adjustments)
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `brightness` | Float | Brightness multiplier. Default `1.0`. |
| `contrast` | Float | Contrast multiplier. Default `1.0`. |
| `saturation` | Float | Saturation multiplier. Default `1.0`. |
| `sharpness` | Float | Sharpness multiplier. Default `1.0`. |

### 6. `mode="dither"` (Retro 1-bit Dithering)
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `dither_method` | String | Name of the dithering algorithm (e.g. `"floyd_steinberg"`, `"bayer"`, `"atkinson"`). |

### 7. `mode="remove_bg"` (AI Background Removal)
*(No additional parameters required. Uses `rembg` under the hood).*

### 8. `mode="watermark"`
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `wm_text` | String | Text to overlay on the image. |
| `wm_color` | String | Hex color for the text (e.g. `"#ffffff"`). |
| `wm_opacity` | Int | Opacity from `0` to `255`. Default `128`. |
| `wm_image` | File | Optional image logo file to overlay instead of/alongside text. |

---

## Example Usage (cURL)

**Apply a Grayscale Filter and save as JPEG:**
```bash
curl -X POST http://127.0.0.1:5000/api/v1/process \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -F "image=@/path/to/your/image.jpg" \
  -F "mode=filter" \
  -F "filter_type=grayscale" \
  -F "save_format=JPEG" \
  --output result_grayscale.jpg
```

**Remove Background:**
```bash
curl -X POST http://127.0.0.1:5000/api/v1/process \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -F "image=@/path/to/product.png" \
  -F "mode=remove_bg" \
  -F "save_format=PNG" \
  --output product_transparent.png
```

**Resize by 50%:**
```bash
curl -X POST http://127.0.0.1:5000/api/v1/process \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -F "image=@/path/to/large_image.jpg" \
  -F "mode=resolution" \
  -F "resize_type=percentage" \
  -F "percentage=50" \
  --output smaller_image.jpg
```
