import io

from PIL import Image


def test_api_process_unauthorized(client):
    response = client.post("/api/v1/process")
    assert response.status_code == 401
    assert b"Unauthorized" in response.data


def test_api_process_no_image(client):
    headers = {"Authorization": "Bearer test-secret-key"}
    response = client.post("/api/v1/process", headers=headers)
    assert response.status_code == 400
    assert b"No image provided" in response.data


def test_api_process_empty_image(client):
    headers = {"Authorization": "Bearer test-secret-key"}
    data = {"image": (io.BytesIO(b""), "")}
    response = client.post(
        "/api/v1/process",
        headers=headers,
        data=data,
        content_type="multipart/form-data",
    )
    assert response.status_code == 400
    assert b"Empty file provided" in response.data


def test_api_process_no_mode(client, sample_image):
    headers = {"Authorization": "Bearer test-secret-key"}

    img_byte_arr = io.BytesIO()
    sample_image.save(img_byte_arr, format="PNG")
    img_byte_arr.seek(0)

    data = {"image": (img_byte_arr, "test.png")}
    response = client.post(
        "/api/v1/process",
        headers=headers,
        data=data,
        content_type="multipart/form-data",
    )
    assert response.status_code == 400
    assert b"No 'mode' provided" in response.data


def test_api_process_valid(client, sample_image):
    headers = {"Authorization": "Bearer test-secret-key"}

    img_byte_arr = io.BytesIO()
    sample_image.save(img_byte_arr, format="PNG")
    img_byte_arr.seek(0)

    data = {
        "image": (img_byte_arr, "test.png"),
        "mode": "filter",
        "filter_type": "grayscale",
        "save_format": "PNG",
    }

    response = client.post(
        "/api/v1/process",
        headers=headers,
        data=data,
        content_type="multipart/form-data",
    )
    assert response.status_code == 200
    assert response.mimetype == "image/png"

    # Verify the returned image is grayscale
    result_img = Image.open(io.BytesIO(response.data))
    assert result_img.mode == "L"
