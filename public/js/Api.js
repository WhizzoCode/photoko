
class Api {

  request(url, data, callback) {
    fetch(url, data)
      .then(response => response.json())
      .then(responseJson => callback(responseJson));
  }

  getUserMe(callback) {
    this.request(
      '/api/user/me',
      {
        method: 'get'
      },
      callback
    );
  }

  getUser(callback) {
    this.request(
      '/api/user',
      {
        method: 'get',
      },
      callback
    );
  }

  deleteUserId(uid, callback) {
    this.request(
      `/api/user/${uid}`,
      {
        method: 'delete',
      },
      callback
    );
  }

  getGallery(uid, callback) {
    this.request(
      `/api/user/${uid}/gallery`,
      {
        method: 'get'
      },
      callback
    );
  }

  sendPhoto(image, callback) {
    this.request(
      '/api/photo',
      {
        method: 'post',
        headers: {'Content-Type': 'image/jpeg'},
        body: image
      },
      callback
    );
  }

  deletePhoto(photoId, callback) {
    this.request(
      `/api/photo/${photoId}`,
      {
        method: 'delete'
      },
      callback
    );
  }

  putPhotoEdition(id, edition, callback) {
    this.request(
      `/api/photo/${id}/edition`,
      {
        method: 'put',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(edition)
      },
      callback
    );
  }

  getPhotoEdition(id, callback) {
    this.request(
      `/api/photo/${id}/edition`,
      {
        method: 'get',
      },
      callback
    );
  }
}
