
class Editor {

  constructor(app) {
    this.app = app;
    this.idPhoto = null;
    this.img = null;
    this.view = document.getElementById('view');
    this.viewCtx = this.view.getContext('2d');
    this.retoko = new Retoko(this.view);
    this.histogram = document.getElementById('histo');
    this.histogramCtx = this.histogram.getContext('2d');
    this.retokoHistogram = new Retoko(this.histogram);
    this.isPrev = true;
    this.oldIsPrev = null;
    this.isAutoZoom = true;
    this.scale = 1;
    this.posX = 0;
    this.posY = 0;
    this.saveTimer = null;
    this.selectedGroup = null;
    this.lastDisplaySize = null;

    // Selectores
    this.photo = document.getElementById('photo');
    this.galleryButtons = document.querySelectorAll('[id^="go-gallery-"]');
    this.zoomOutButton = document.getElementsByClassName('fa-minus-circle')[0];
    this.zoomInButton = document.getElementsByClassName('fa-plus-circle')[0];
    this.autoZoomButton = document.getElementsByClassName('fa-expand')[0];
    this.prevButtons = document.getElementsByClassName('fa-eye');
    this.resetButtons = document.getElementsByClassName('fa-undo');
    this.downloadButtons = document.querySelectorAll('[id^=download-]');
    this.groupButtons = document.querySelectorAll('[id^="group-"]');
    this.adjPane = document.getElementById('adjustments');
    this.adjGroups = document.querySelectorAll('[id^="adjustments-"]');
    this.adjs = document.querySelectorAll('[id^=adj-]');
    this.blackFilter = document.getElementById('adj-black');
    this.whiteFilter = document.getElementById('adj-white');
    this.brightnesFilter = document.getElementById('adj-brightness');
    this.shadowsFilter = document.getElementById('adj-shadows');
    this.mediumFilter = document.getElementById('adj-medium');
    this.lightsFilter = document.getElementById('adj-lights');
    this.hueFilter = document.getElementById('adj-hue');
    this.saturationFilter = document.getElementById('adj-saturation');
    this.temperatureFilter = document.getElementById('adj-temperature');

    // Acción: Redimensionar ventana
    window.addEventListener('resize', ev => {
      if (this.app.main.id === 'editor') {
        if (window.innerWidth < 768 && this.lastDisplaySize == 'big') {
          this.selectGroup();
        } else if (window.innerWidth >= 768 && this.selectedGroup == null) {
          this.selectGroup('light');
        }
        if (window.innerWidth >= 768) this.lastDisplaySize = 'big';
        else this.lastDisplaySize = 'small';
        this.setSize();
      }
    });

    // Acción: Cambia posición vista
    let self = this;
    let captureViewMove = function(ev) {
      let oldIsPrev = null;
      self.setPosition(ev.movementX, ev.movementY);
    }
    this.view.addEventListener('mousedown', ev => {
      if (window.innerWidth >= 768) {
        if (self.isPrev) {
          self.oldIsPrev = self.isPrev;
          self.isPrev = false;
        }
        this.view.addEventListener('mousemove', captureViewMove);
      }
    });
    this.app.main.addEventListener('mouseup', ev => {
      this.view.removeEventListener('mousemove', captureViewMove);
      if (self.oldIsPrev) {
        self.isPrev = self.oldIsPrev;
        self.oldIsPrev = null;
        self.renderView();
      }
    });

    // Acción: Ir a galería
    this.galleryButtons.forEach(button => {
      button.addEventListener('click', ev => {this.close()});
    });

    // Acción: Botónes zoom
    this.zoomOutButton.addEventListener('click', ev => {this.setScale('zoomOut')});
    this.zoomInButton.addEventListener('click', ev => {this.setScale('zoomIn')});
    this.autoZoomButton.addEventListener('click', ev => {this.selectAutoZoom(null)});

    // Acción: Botón previsualizar
    this.prevButtons[0].addEventListener('click', ev => {this.selectPrev(null)});
    this.prevButtons[1].addEventListener('click', ev => {this.selectPrev(null)});

    // Acción: Botón reset
    this.resetButtons[0].addEventListener('click', ev => {this.reset(true)});
    this.resetButtons[1].addEventListener('click', ev => {this.reset(true)});

    // Acción: Seleccionar grupo
    this.groupButtons.forEach(button => {
      button.addEventListener('click', ev => {this.selectGroup(ev.currentTarget.id.split('-')[1])});
    });

    // Action: Modificar filtros
    this.blackFilter.addEventListener('input', ev => {this.setFilter(ev.currentTarget)});
    this.whiteFilter.addEventListener('input', ev => {this.setFilter(ev.currentTarget)});
    this.brightnesFilter.addEventListener('input', ev => {this.setFilter(ev.currentTarget)});
    this.shadowsFilter.addEventListener('input', ev => {this.setFilter(ev.currentTarget)});
    this.mediumFilter.addEventListener('input', ev => {this.setFilter(ev.currentTarget)});
    this.lightsFilter.addEventListener('input', ev => {this.setFilter(ev.currentTarget)});
    this.hueFilter.addEventListener('input', ev => {this.setFilter(ev.currentTarget)});
    this.saturationFilter.addEventListener('input', ev => {this.setFilter(ev.currentTarget)});
    this.temperatureFilter.addEventListener('input', ev => {this.setFilter(ev.currentTarget)});

    // Acción: Descarga foto
    this.downloadButtons.forEach(button => {
      button.addEventListener('click', ev => {this.renderDownload(ev.currentTarget)});
    });
  }

  open(id) {
    this.idPhoto = id;
    this.img = new Image();
    this.img.addEventListener('load', ev => {
      this.app.main.id = 'editor';
      this.downloadButtons.forEach(button => {
        button.setAttribute('download', `photoko-${id}.jpg`);
      });
      this.setupHistogram();
      this.reset(false);
      this.app.api.getPhotoEdition(id, res => {
        Object.keys(res.edition).forEach(filter => {
          let el = document.getElementById('adj-' + filter);
          this.setFilter(el, res.edition[filter], false, false);
        });
        if (Object.keys(res.edition).length > 0) this.renderView();
      });
    });
    this.img.src = `/api/photo/${id}/img/big`;
  }

  close() {
    this.saveFilters();
    let hasFilters = false;
    if (Object.keys(this.retoko.filters).length > 0) hasFilters = true;
    this.app.gallery.showEditionMark(hasFilters);
    this.app.main.id = 'gallery';
  }

  reset(save = true) {
    this.selectPrev(true, false);
    this.selectAutoZoom(true, false);
    if (window.innerWidth < 768) {
      this.selectGroup();
    } else if (this.selectedGroup == null) {
      this.selectGroup('light');
    }
    this.adjs.forEach(el => {
      this.setFilter(el, 'deffault', false, save);
    });
    this.setSize();
  }

  setSize() {
    this.view.width = this.photo.offsetWidth;
    this.view.height = this.photo.offsetHeight;
    if (window.innerWidth < 768 && !this.isAutoZoom) {
      this.selectAutoZoom(true, false);
    }
    this.setScale();
  }

  setScale(mode = null) {
    switch (mode) {
      case 'zoomIn':
        this.scale *= 1.5;
        this.selectAutoZoom(false);
        break;
      case 'zoomOut':
        this.scale /= 1.5;
        this.selectAutoZoom(false);
        break;
      default:
        if (this.isAutoZoom) {
          let arImg = this.img.naturalWidth / this.img.naturalHeight;
          let arView = this.view.width / this.view.height;
          if (arImg < arView) {
            this.scale = this.view.height / this.img.naturalHeight;
          } else {
            this.scale = this.view.width / this.img.naturalWidth;
          }
          this.posX = 0;
          this.posY = 0;
        }
        break;
    }
    this.drawView();
  }

  setPosition(x, y) {
    if (this.isAutoZoom) this.selectAutoZoom(false, false);
    this.posX += x;
    this.posY += y;
    this.drawView();
  }

  drawView() {
    let dWidth = this.img.naturalWidth * this.scale;
    let dHeight = this.img.naturalHeight * this.scale;
    let dX = (this.view.width / 2) - (dWidth / 2) + this.posX;
    let dY = (this.view.height / 2) - (dHeight / 2) + this.posY;
    this.viewCtx.clearRect(0, 0, this.view.width, this.view.height);
    this.viewCtx.drawImage(this.img, dX, dY, dWidth, dHeight);
    this.retoko.setCache();
    this.renderView();
  }

  renderView() {
    if (this.isPrev) {
      this.retoko.render();
    }
    this.retokoHistogram.renderHistogram();
  }

  renderDownload(el) {
    let dCanvas = document.createElement('canvas');
    dCanvas.width = this.img.naturalWidth;
    dCanvas.height = this.img.naturalHeight;
    dCanvas.getContext('2d').drawImage(this.img, 0, 0);
    let dRetoko = new Retoko(dCanvas);
    dRetoko.filters = this.retoko.filters;
    dRetoko.setCache();
    dRetoko.render();
    el.href = dCanvas.toDataURL('image/jpeg');
  }

  selectPrev(activate = null, next = true) {
    if (activate === null) activate = !this.isPrev;
    if (activate === true) {
      this.isPrev = true;
      this.prevButtons[0].classList.add('selected');
      this.prevButtons[1].classList.add('selected');
    } else {
      this.isPrev = false;
      this.prevButtons[0].classList.remove('selected');
      this.prevButtons[1].classList.remove('selected');
      this.retoko.reset();
    }
    if (next) this.renderView();
  }

  selectAutoZoom(activate = null, next = true) {
    if (activate === null) activate = !this.isAutoZoom;
    if (activate === true) {
      this.isAutoZoom = true;
      this.autoZoomButton.classList.add('selected');
      if (next) this.setScale();
    } else {
      this.isAutoZoom = false;
      this.autoZoomButton.classList.remove('selected');
    }
  }

  selectGroup(activate = null) {
    let oldWidth = this.photo.offsetWidth;
    let oldHeight = this.photo.offsetHeight;
    if (activate === this.selectedGroup) activate = null;
    if (window.innerWidth >= 768 && activate == null) activate = 'light';
    this.selectedGroup = activate;
    this.groupButtons.forEach(button => {
      if (button.id.split('-')[1] === activate) {
        button.classList.add('selected');
      } else {
        button.classList.remove('selected');
      }
    });
    this.adjGroups.forEach(adjGroup => {
      if (adjGroup.id.split('-')[1] === activate) {
        adjGroup.classList.add('show');
      } else {
        adjGroup.classList.remove('show');
      }
    });
    if (this.selectedGroup) {
      this.adjPane.classList.add('show');
    } else {
      this.adjPane.classList.remove('show');
    }
    if (this.photo.offsetWidth != oldWidth || this.photo.offsetHeight != oldHeight) {
      this.setSize();
    }
  }

  setFilter(el, val = null, next = true, save = true) {
    let name = el.id.split('-')[1];
    let value = val;
    if (val === null) value = el.value;
    else if (val === 'deffault') {
      value = this.retoko.filtersDeffaults[name];
      el.value = value;
    }
    else el.value = value;
    el.nextElementSibling.value = value;
    this.retoko.setFilter(name, value);
    if (save) this.saveFilters(4000);
    if (next) this.renderView();
  }

  saveFilters(time = 0) {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.app.api.putPhotoEdition(this.idPhoto, this.retoko.filters, resp => {});
    }, time);
  }

  setupHistogram() {
    let imgWidth = this.img.naturalWidth;
    let imgHeight = this.img.naturalHeight;
    let width = 400;
    let height = 400;
    if (imgWidth > imgHeight) {
      height = width * imgHeight / imgWidth;
    } else {
      width = height * imgWidth / imgHeight;
    }
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(this.img, 0, 0, width, height);
    this.retokoHistogram.setCache(canvas);
    this.retokoHistogram.filters = this.retoko.filters;
  }

}
