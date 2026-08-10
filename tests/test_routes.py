import io
import json
from PIL import Image


def test_index(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"Image Tool - Web" in response.data


def test_upload_init(client, sample_image_file):
    data = {"action": "init", "image": (sample_image_file, "test.jpg")}
    response = client.post("/upload", data=data, content_type="multipart/form-data")
    assert response.status_code == 200
    res_data = json.loads(response.data)
    assert res_data["success"] is True
    assert "session_id" in res_data


def test_upload_preview_only(client, sample_image_file):
    # Init first
    data_init = {"action": "init", "image": (sample_image_file, "test.jpg")}
    res_init = client.post(
        "/upload", data=data_init, content_type="multipart/form-data"
    )
    session_id = json.loads(res_init.data)["session_id"]

    data_preview = {
        "action": "preview_only",
        "session_id": session_id,
        "current_step": "0",
        "mode": "filter",
        "filter_type": "grayscale",
    }
    res_preview = client.post(
        "/upload", data=data_preview, content_type="multipart/form-data"
    )
    assert res_preview.status_code == 200
    res_data = json.loads(res_preview.data)
    assert res_data["success"] is True
    assert res_data["image"].startswith("data:image/jpeg;base64,")


def test_upload_estimate_size(client, sample_image_file):
    # Init first
    data_init = {"action": "init", "image": (sample_image_file, "test.jpg")}
    res_init = client.post(
        "/upload", data=data_init, content_type="multipart/form-data"
    )
    session_id = json.loads(res_init.data)["session_id"]

    data_estimate = {
        "action": "estimate_size",
        "session_id": session_id,
        "current_step": "0",
        "mode": "resolution",
        "resize_type": "percentage",
        "percentage": "50",
        "save_format": "JPEG",
        "quality": "80",
    }
    res_estimate = client.post(
        "/upload", data=data_estimate, content_type="multipart/form-data"
    )
    assert res_estimate.status_code == 200
    res_data = json.loads(res_estimate.data)
    assert res_data["success"] is True
    assert "size_bytes" in res_data
    assert res_data["width"] == 50
    assert res_data["height"] == 50


def test_upload_edit_and_download(client, sample_image_file):
    # Init
    data_init = {"action": "init", "image": (sample_image_file, "test.jpg")}
    res_init = client.post(
        "/upload", data=data_init, content_type="multipart/form-data"
    )
    session_id = json.loads(res_init.data)["session_id"]

    # Edit
    data_edit = {
        "action": "edit",
        "session_id": session_id,
        "current_step": "0",
        "mode": "filter",
        "filter_type": "grayscale",
    }
    res_edit = client.post(
        "/upload", data=data_edit, content_type="multipart/form-data"
    )
    assert res_edit.status_code == 200
    res_data = json.loads(res_edit.data)
    assert res_data["current_step"] == 1

    # Download
    data_download = {
        "action": "download",
        "session_id": session_id,
        "current_step": "1",
        "save_format": "PNG",
    }
    res_download = client.post(
        "/upload", data=data_download, content_type="multipart/form-data"
    )
    assert res_download.status_code == 200
    assert res_download.mimetype == "image/png"


def test_batch_start_status(client, sample_image_file):
    sample_image_file2 = io.BytesIO(sample_image_file.getvalue())
    data = {
        "images": [(sample_image_file, "test1.jpg"), (sample_image_file2, "test2.jpg")],
        "mode": "filter",
        "filter_type": "sepia",
        "save_format": "PNG",
    }
    res_start = client.post(
        "/batch/start", data=data, content_type="multipart/form-data"
    )
    assert res_start.status_code == 200
    job_id = json.loads(res_start.data)["job_id"]

    res_status = client.get(f"/batch/status/{job_id}")
    assert res_status.status_code == 200
    status_data = json.loads(res_status.data)
    assert "status" in status_data
    assert status_data["total"] == 2
