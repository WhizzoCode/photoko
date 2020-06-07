
class Gallery {

  constructor(app) {
    this.app = app;
    this.selectedPhoto = null;

    // Selecciones
    this.photosMsg = document.getElementById('photos-msg');
    this.files = document.getElementById('files');
    this.buttonUploadPhotos = document.getElementById('upload-photos');
    this.buttonEditPhoto = document.getElementById('edit-photo');
    this.buttonDeletePhoto = document.getElementById('delete-photo');

    // Evento: Subir fotos
    this.files.addEventListener('change', ev => {this.uploadPhotos()});
    document.getElementById('upload-photos')
      .addEventListener('click', ev => {
        if (!this.app.inAdmin) this.files.click();
      });

    // Evento: Editar foto
    this.buttonEditPhoto.addEventListener('click', ev => {
      if (!this.app.inAdmin) this.editPhoto();
    });

    // Evento: Borrar foto
    this.buttonDeletePhoto.addEventListener('click', ev => {this.deletePhoto()});
  }

  getPhotos() {
    this.buttonUploadPhotos.classList.remove('disabled');
    this.buttonEditPhoto.classList.add('disabled');
    this.buttonDeletePhoto.classList.add('disabled');
    this.selectedPhoto = null;
    let id = this.app.user.id;
    if (this.app.inAdmin) {
      id = this.app.inAdmin.id;
      this.buttonUploadPhotos.classList.add('disabled');
    }
    document.getElementById('photos-container').innerHTML = '';
    this.app.api.getGallery(id, response => {
      response.photos.forEach(photo => {
        this.galleryAddPhoto(photo);
      });
    });
  }

  uploadPhotos() {
    let files = this.files.files;
    let numUploads = files.length;
    this.photosMsg.textContent = `Subiendo ${numUploads} fotos...`;
    this.photosMsg.classList.add('show');
    for (let i = 0; i < files.length; i++) {
      this.app.api.sendPhoto(files[i], response => {
        numUploads--;
        if (numUploads > 0) {
          this.photosMsg.textContent = `Subiendo ${numUploads} fotos...`;
        } else {
          this.photosMsg.classList.remove('show');
          this.files.value = '';
        }
        if (!response.error) {
          this.galleryAddPhoto(response.photo);
        }
      });
    }
  }

  editPhoto() {
    if (this.selectedPhoto) {
      this.app.editor.open(this.selectedPhotoId());
    }
  }

  deletePhoto() {
    if (this.selectedPhoto) {
      let startTime = new Date();
      this.photosMsg.textContent = `Borrando foto`;
      this.photosMsg.classList.add('show');
      this.app.api.deletePhoto(this.selectedPhotoId(), resp => {
        if (!resp.error) {
          this.selectedPhoto.remove();
          this.selectPhoto(null);
          let endTime = new Date();
          let wait = 1000 - (endTime - startTime);
          setTimeout(() => {this.photosMsg.classList.remove('show')}, wait);
        }
      });
    }
  }

  galleryAddPhoto(photo) {
    let photoEl = document.createElement('div');
    photoEl.id = `photo-${photo.id}`;
    photoEl.classList.add('photo');
    photoEl.style.backgroundImage = `url(/api/photo/${photo.id}/img/small)`;
    photoEl.addEventListener('click', ev => this.selectPhoto(ev.currentTarget));
    let selectionEl = document.createElement('div');
    selectionEl.classList.add('selection');
    photoEl.append(selectionEl);
    let editedEl = document.createElement('span');
    editedEl.classList.add('fas', 'fa-sliders-h');
    if (photo.edition != false) {
      editedEl.classList.add('show');
    }
    selectionEl.append(editedEl);
    document.getElementById('photos-container').prepend(photoEl);
  }

  selectPhoto(el) {
    if (el === null) {
      if (this.selectedPhoto) {
        this.selectedPhoto.firstChild.classList.remove('show');
        this.selectedPhoto = null;
      }
    } else if (el === this.selectedPhoto) {
      this.selectedPhoto.firstChild.classList.remove('show');
      this.selectedPhoto = null;
    } else {
      if (this.selectedPhoto) {
        this.selectedPhoto.firstChild.classList.remove('show');
      }
      this.selectedPhoto = el;
      this.selectedPhoto.firstChild.classList.add('show');
    }
    if (this.selectedPhoto) {
      if (!this.app.inAdmin) this.buttonEditPhoto.classList.remove('disabled');
      this.buttonDeletePhoto.classList.remove('disabled');
    } else {
      if (!this.app.inAdmin) this.buttonEditPhoto.classList.add('disabled');
      this.buttonDeletePhoto.classList.add('disabled');
    }
  }

  selectedPhotoId() {
    return parseInt(this.selectedPhoto.id.substring(6), 10);
  }

  showEditionMark(show) {
    let mark = this.selectedPhoto.firstElementChild.firstElementChild;
    if (show) mark.classList.add('show');
    else mark.classList.remove('show');
  }

}
