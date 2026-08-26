import re

from playwright.sync_api import expect


def test_homepage_loads(page, live_server_url):
    """Test that the main application loads correctly."""
    page.goto(live_server_url)
    expect(page).to_have_title(re.compile("Retro Print Suite"))
    
    # Check that upload zone is visible
    upload_zone = page.locator("#upload-zone")
    expect(upload_zone).to_be_visible()
    
    # Check that right panel exists
    panel = page.locator(".kiosk-control-board")
    expect(panel).to_be_visible()
    
    # Check module titles
    expect(page.locator("text=RETRO STUDIO").first).to_be_visible()
    expect(page.locator("text=BASICS").first).to_be_visible()


def test_upload_image_shows_preview(page, live_server_url):
    """Test uploading an image switches to preview mode."""
    page.goto(live_server_url)

    # Use the hidden file input
    page.set_input_files("#image-upload", "tests/sample.jpg")

    # Upload zone should hide, preview zone should show
    expect(page.locator("#upload-zone")).to_be_hidden()
    expect(page.locator("#preview-zone")).to_be_visible()

    # The download button should become enabled
    download_btn = page.locator("#btn-download")
    expect(download_btn).not_to_be_disabled()
