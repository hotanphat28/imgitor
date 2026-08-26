import io

from PIL import Image


def test_index_route(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"Retro Print Suite" in response.data


def test_download_image(client):
    # Test downloading without image
    response = client.post("/download")
    assert response.status_code == 400
    assert b"No file uploaded." in response.data

    # Test valid image download
    img = Image.new("RGB", (100, 100), color="red")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    img_byte_arr.seek(0)

    response = client.post(
        "/download",
        data={
            "image": (img_byte_arr, "test.png"),
            "retro_mode": "none"
        },
        content_type="multipart/form-data",
    )
    assert response.status_code == 200
    assert response.headers["Content-Type"] == "image/jpeg"
    assert "attachment" in response.headers["Content-Disposition"]
