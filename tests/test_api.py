import io

from PIL import Image


def get_auth_headers(client):
    # The app looks for API_KEY config, but let's just use the testing config
    return {"Authorization": "Bearer test-secret-key"}


def test_api_missing_image(client):
    response = client.post("/api/v1/process", headers=get_auth_headers(client))
    assert response.status_code == 400
    assert b"No image provided" in response.data


def test_api_invalid_auth(client):
    response = client.post("/api/v1/process", headers={"Authorization": "Bearer fake"})
    assert response.status_code == 401


def test_api_pipeline_crop(client):
    img = Image.new("RGB", (200, 200), color="blue")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    img_byte_arr.seek(0)

    data = {
        "image": (img_byte_arr, "test.png"),
        "crop_x": "50",
        "crop_y": "50",
        "crop_w": "100",
        "crop_h": "100",
        "save_format": "PNG",
    }
    response = client.post(
        "/api/v1/process", headers=get_auth_headers(client), data=data, content_type="multipart/form-data"
    )

    assert response.status_code == 200
    assert response.headers["Content-Type"] == "image/png"
    
    # Verify result size
    res_img = Image.open(io.BytesIO(response.data))
    assert res_img.size == (100, 100)


def test_api_halftone(client):
    img = Image.new("RGB", (200, 200), color="blue")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    img_byte_arr.seek(0)

    data = {
        "image": (img_byte_arr, "test.png"),
        "halftone_shape": "round",
        "halftone_size": "10",
        "halftone_angle": "45",
        "save_format": "JPEG",
    }
    response = client.post(
        "/api/v1/process", headers=get_auth_headers(client), data=data, content_type="multipart/form-data"
    )

    assert response.status_code == 200
    assert response.headers["Content-Type"] == "image/jpeg"
