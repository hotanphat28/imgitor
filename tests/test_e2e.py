from playwright.sync_api import Page


def test_homepage_loads(page: Page, live_server_url: str):
    """Verify that the homepage loads properly in the browser."""
    page.goto(live_server_url)

    # Check that the main title exists
    expect_title = "Image Tool - Web"
    assert expect_title in page.content(), (
        f"Expected to find '{expect_title}' on the page."
    )

    # Test file upload input exists
    file_input = page.locator("input#image")
    assert file_input.count() > 0, "Expected to find the main image upload input."


def test_upload_no_file_api(page: Page, live_server_url: str):
    """Test API directly for uploading without a file, expecting 400."""
    response = page.request.post(f"{live_server_url}/upload")
    assert response.status == 400
    assert "No file uploaded" in response.text()


def test_upload_invalid_file_api(page: Page, live_server_url: str):
    """Test API directly for uploading an invalid file type, expecting 400."""
    response = page.request.post(
        f"{live_server_url}/upload",
        multipart={
            "image": {
                "name": "test.txt",
                "mimeType": "text/plain",
                "buffer": b"not an image",
            },
            "mode": "resolution",
            "width": "50",
            "height": "50",
        },
    )
    assert response.status == 400
    assert "Invalid file type" in response.text()


def test_upload_and_edit_ui(page: Page, live_server_url: str, tmp_path):
    """Test the full UI flow of uploading an image and seeing the edit screen."""
    # Create sample image
    from PIL import Image

    img_path = tmp_path / "sample.jpg"
    img = Image.new("RGB", (100, 100), color="red")
    img.save(img_path, "JPEG")

    page.goto(live_server_url)

    # Upload the image
    page.locator("input#image").set_input_files(str(img_path))

    # Wait for the edit view to become visible
    # Based on index.html: document.getElementById('step-2-edit').style.display = 'flex';
    edit_step = page.locator("#step-2-edit")
    edit_step.wait_for(state="visible", timeout=5000)

    # Assert that the live preview image is loaded
    preview_img = page.locator("#preview-live")

    # Note: We do not assert preview_img.is_visible() because cropper.js
    # hides the original img element with the 'cropper-hidden' class.

    # And check that it actually loaded an image source
    src = preview_img.get_attribute("src")
    assert src.startswith("/static/uploads/") or src.startswith("data:image/")


def test_ui_redesign_features(page: Page, live_server_url: str, tmp_path):
    """Test the toast notifications and history drawer from the UI redesign."""
    from PIL import Image

    img_path = tmp_path / "sample_ui.jpg"
    img = Image.new("RGB", (100, 100), color="blue")
    img.save(img_path, "JPEG")

    page.goto(live_server_url)
    
    # Upload
    page.locator("input#image").set_input_files(str(img_path))
    edit_step = page.locator("#step-2-edit")
    edit_step.wait_for(state="visible", timeout=5000)
    
    # Click Adjustments tool to show sliders
    page.locator("label[for='adjust']").click()
    page.locator("#adjust-inputs").wait_for(state="visible", timeout=3000)

    # 1. Trigger an edit to see the Toast
    brightness_slider = page.locator("input[name='brightness']")
    brightness_slider.fill("1.5")
    # Dispatch change event to trigger saveState
    brightness_slider.evaluate("el => el.dispatchEvent(new Event('change'))")

    # Wait for the toast
    toast = page.locator(".toast")
    toast.wait_for(state="visible", timeout=3000)
    assert "CHANGED BRIGHTNESS" in toast.inner_text().upper()

    # 2. Check History Drawer
    history_btn = page.locator("button[title='History']")
    history_btn.click()
    
    drawer = page.locator("#history-drawer")
    # should have 'active' class
    assert "active" in drawer.get_attribute("class")

    # Verify timeline items (should have Original Image + Changed Brightness)
    timeline_items = page.locator(".history-item")
    # Sometimes it takes a ms to render, so we can wait for count
    page.wait_for_function("document.querySelectorAll('.history-item').length >= 2")
    assert timeline_items.count() >= 2
