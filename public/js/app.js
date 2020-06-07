
let app;

class App {

  constructor() {
    this.user = null;
    this.inAdmin = false;
    
    // Selecciones
    this.main = document.querySelector('body > div');

    // Módulos
    this.api = new Api();
    this.editor = new Editor(this);
    this.gallery = new Gallery(this);

    // Evento: Recargar galería
    document.getElementsByTagName('h1')[0].addEventListener('click', ev => {this.restart()});

    // Acciones
    this.start();
  }

  start() {
    this.api.getUserMe(response => {
      this.user = response.user;
      if (this.user.roles.includes('ROLE_ADMIN')) {
        let userIcon = document.getElementById('userIcon');
        userIcon.classList.remove('fa-user');
        userIcon.classList.add('fa-user-cog');
        userIcon.addEventListener('click', ev => this.toggleAdminView());
      }
      this.restart();
    });
  }

  restart() {
    this.inAdmin = false;
    let username = document.getElementById('username');
    username.textContent = this.user.name;
    username.classList.remove('admin');
    this.main.id = 'gallery';
    this.gallery.getPhotos();
  }

  toggleAdminView() {
    let adminTable = document.getElementById('admin-table');
    if (this.main.id === 'admin') {
      this.main.id = 'gallery';
    } else {
      this.main.id = 'admin';
      this.api.getUser(response => {
        adminTable.innerHTML = `<tr class="admin-table-big">
                                  <th>Rol</th>
                                  <th>Email</th>
                                  <th>Nombre</th>
                                  <th>Registro</th>
                                  <th>Últ. acceso</th>
                                  <th>Fotos</th>
                                  <th></th>
                                </tr>`;
        response.users.forEach(user => {
          let icon = 'fa-user';
          if (user.roles.includes('ROLE_ADMIN')) {
            icon = 'fa-user-cog';
          }
          let tr = document.createElement('tr');
          tr.id = `user-${user.id}`;
          tr.innerHTML = `<td><span class="fas ${icon}"></span></td>
                          <td><span>${user.email}</span></td>
                          <td><span>${user.name}</span></td>
                          <td class="admin-table-big">${user.date}</td>
                          <td class="admin-table-big">${user.lastSeen}</td>
                          <td>${user.photos}/${user.editions}</td>
                          <td><span class="fas fa-trash-alt"></span></td>`;
          adminTable.appendChild(tr);
          tr.children[1].firstChild.addEventListener('click', ev => {
            let username = document.getElementById('username');
            if (this.user.id == user.id) {
              this.inAdmin = false;
              username.textContent = this.user.name;
              username.classList.remove('admin');
            } else {
              this.inAdmin = user;
              username.textContent = this.inAdmin.name;
              username.classList.add('admin');
            }
            this.main.id = 'gallery';
            this.gallery.getPhotos();
          });
          tr.children[6].firstChild.addEventListener('click', ev => {
            this.api.deleteUserId(user.id, response => {
              document.getElementById(`user-${user.id}`).remove();
            });
          });
        });
      });
    }
  }

}

window.addEventListener('load', ev => {app = new App()});