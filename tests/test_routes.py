import io

def test_index_route(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b'Image Processor' in response.data

def test_upload_no_file(client):
    response = client.post('/upload', data={})
    assert response.status_code == 400
    assert b'No file uploaded' in response.data

def test_upload_invalid_file(client):
    data = {
        'image': (io.BytesIO(b"not an image"), 'test.txt'),
        'mode': 'resolution',
        'width': '50',
        'height': '50'
    }
    response = client.post('/upload', data=data, content_type='multipart/form-data')
    assert response.status_code == 400
    assert b'Invalid file type' in response.data

def test_upload_resize_success(client, sample_image_file):
    data = {
        'image': (sample_image_file, 'test.jpg'),
        'mode': 'resolution',
        'width': '50',
        'height': '50'
    }
    response = client.post('/upload', data=data, content_type='multipart/form-data')
    assert response.status_code == 200
    assert response.mimetype == 'image/jpeg'
