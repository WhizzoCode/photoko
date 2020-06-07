
/**
 * Elementos
 */
let aLogin;
let aSignup;
let aRecove;
let formLogin;
let formSignup;
let formRecover;
let formRecover3;
let formRecover4;
let inputLoginEmail;
let inputLoginPassword;
let inputSignupName;
let inputSignupEmail;
let inputSignupPassword;
let inputSignupPassword2;
let inputRecoverEmail;
let inputRecoverPassword;
let inputRecoverPassword2;
let buttonLogin;
let buttonSignup;
let buttonRecover;
let buttonRecover3;
let buttonRecover4;
let buttonEnter;
let error;

/**
 * Inicio
 */
window.addEventListener('load', ev => {
  /**
   * Enlaces
   */
  aLogin = document.querySelector('#sec_login a');
  aSignup = document.querySelector('#sec_signup a');
  aRecover = document.querySelector('#sec_recover a');
  aLogin.addEventListener('click', ev => {
    ev.preventDefault();
    changeView('login');
  });
  aSignup.addEventListener('click', ev => {
    ev.preventDefault();
    changeView('signup');
  });
  aRecover.addEventListener('click', ev => {
    ev.preventDefault();
    changeView('recover');
  });

  /**
   * Formularios
   */
  formLogin = document.getElementById('form_login');
  formSignup = document.getElementById('form_signup');
  formRecover = document.getElementById('form_recover');
  formRecover3 = document.getElementById('form_recover3');
  formRecover4 = document.getElementById('form_recover4');

  /**
   * Validaciones
   */
  inputLoginEmail = document.getElementById('l_email');
  inputLoginPassword = document.getElementById('l_password');
  inputSignupName = document.getElementById('s_name');
  inputSignupEmail = document.getElementById('s_email');
  inputSignupPassword = document.getElementById('s_password');
  inputSignupPassword2 = document.getElementById('s_password2');
  inputRecoverEmail = document.getElementById('r_email');
  inputRecoverPassword = document.getElementById('r_password');
  inputRecoverPassword2 = document.getElementById('r_password2');

  inputLoginEmail.addEventListener('blur', ev => validateEmail(ev.target));
  inputLoginPassword.addEventListener('blur', ev => validatePassword(ev.target));
  inputSignupName.addEventListener('blur', ev => validateName(ev.target));
  inputSignupEmail.addEventListener('blur', ev => validateEmail(ev.target));
  inputSignupPassword.addEventListener('blur', ev => validatePassword(ev.target));
  inputSignupPassword2.addEventListener('blur', ev => validatePassword(ev.target));
  inputRecoverEmail.addEventListener('blur', ev => validatePassword(ev.target));
  inputRecoverPassword.addEventListener('blur', ev => validatePassword(ev.target));
  inputRecoverPassword2.addEventListener('blur', ev => validatePassword(ev.target));

  /**
   * Botones
   */
  buttonLogin = document.getElementById('button_login');
  buttonSignup = document.getElementById('button_signup');
  buttonRecover = document.getElementById('button_recover');
  buttonRecover3 = document.getElementById('button_recover3');
  buttonRecover4 = document.getElementById('button_recover4');
  buttonEnter = document.getElementById('button_enter');
  buttonLogin.addEventListener('click', ev => {
    ev.preventDefault();
    login();
  });
  buttonSignup.addEventListener('click', ev => {
    ev.preventDefault();
    signup();
  });
  buttonRecover.addEventListener('click', ev => {
    ev.preventDefault();
    recover();
  });
  buttonRecover3.addEventListener('click', ev => {
    ev.preventDefault();
    recover3();
  });
  buttonRecover4.addEventListener('click', ev => {
    ev.preventDefault();
    recover4();
  });
  buttonEnter.addEventListener('click', ev => {
    window.location.reload();
  });

  /**
   * Errores
   */
  error = document.getElementById('error');
});

/**
 * Funciones
 */
function changeView(view) {
  document.getElementById('main').className = view;
  document.querySelectorAll('input:not([type="hidden"])').forEach(el => {el.value = '';});
  document.querySelectorAll('p.error, p.warning').forEach(el => {el.textContent = '';});
}

function validateRequired(el, msgValue) {
  let warning = el.nextElementSibling;
  if (el.value === '') {
    warning.innerHTML = msgValue;
    return false;
  } else {
    warning.innerHTML = '';
    return true;
  }
}

function validateEmail(el) {
  let warning = el.nextElementSibling;
  if (!validateRequired(el, 'Has de poner un email')) {
    return false;
  } else if (!/^.+@.+\..+$/.test(el.value)) {
    warning.innerHTML = 'El email no es válido';
    return false;
  } else {
    return true;
  }
}

function validatePassword(el) {
  return validateRequired(el, 'Has de poner una contraseña');
}

function validateName(el) {
  return validateRequired(el, 'Has de poner un nombre de usuario');
}

function login() {
  if (validateEmail(inputLoginEmail) && validatePassword(inputLoginPassword)) {
    formLogin.submit();
  }
}

function signup() {
  if (validateName(inputSignupName) && validateEmail(inputSignupEmail)
    && validatePassword(inputSignupPassword) && validatePassword(inputSignupPassword2)) {
      if (inputSignupPassword.value === inputSignupPassword2.value) {
        formSignup.submit();
      } else {
        error.textContent = 'La contraseña no coincide';
      }
  }
}

function recover() {
  if (validateEmail(inputRecoverEmail)) {
    formRecover.submit();
  }
}

function recover3() {
  if (validatePassword(inputRecoverPassword) && validatePassword(inputRecoverPassword2)) {
      if (inputSignupPassword.value === inputSignupPassword2.value) {
        formRecover3.submit();
      } else {
        error.textContent = 'La contraseña no coincide';
      }
  }
}

function recover4() {
  formRecover4.submit();
}