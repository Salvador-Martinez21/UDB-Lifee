class AgendaIngenieria {
  constructor() {
    this.usuarios = [];
    this.usuarioActual =
      JSON.parse(localStorage.getItem("udb_usuario_actual")) || null;
    this.materias = JSON.parse(localStorage.getItem("udb_materias")) || [];
    this.trabajos = JSON.parse(localStorage.getItem("udb_trabajos")) || [];
    this.init(); // init es async (se encarga de cargar el JSON antes de verificar auth)
  }

  // init ahora intenta cargar usuarios desde un archivo JSON y luego continúa normalmente
  async init() {
    // intenta cargar archivo JSON con usuarios; si falla, mantiene/usa localStorage
    await this.loadUsuariosFromJSON("udb_usuarios.json");
    this.setupEventListeners();
    this.verificarAutenticacion();
  }

  setupEventListeners() {
    // Login/Registro
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.iniciarSesion();
      });
    }

    const materiaForm = document.getElementById("materiaForm");
    if (materiaForm) {
      materiaForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.agregarMateria();
      });
    }

    const trabajoForm = document.getElementById("trabajoForm");
    if (trabajoForm) {
      trabajoForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.agregarTrabajo();
      });
    }

    // Botones del menú principal (Notas / Calendario)
    const btnNotas = document.querySelector("li:nth-child(1) button");
    const btnCalendario = document.querySelector("li:nth-child(2) button");

    if (btnNotas) {
      btnNotas.addEventListener("click", (e) => {
        e.preventDefault();
        const wrapper = document.getElementById("wrapper");
        const notas = document.getElementById("appScreen-notas");
        const calendario = document.getElementById("appScreen-calendario");

        // ocultamos wrapper y calendario, mostramos notas
        if (wrapper) wrapper.style.display = "none";
        if (calendario) calendario.style.display = "none";
        if (notas) {
          notas.style.display = "flex";
          notas.style.flexDirection = "column";
        }

        // asegurarnos de que los controles del calendario estén ocultos
        this._setCalendarControlsVisible(false);
      });
    }

    if (btnCalendario) {
      btnCalendario.addEventListener("click", (e) => {
        e.preventDefault();
        const wrapper = document.getElementById("wrapper");
        const notas = document.getElementById("appScreen-notas");
        const calendario = document.getElementById("appScreen-calendario");
        if (notas) notas.style.display = "none";
        if (wrapper) wrapper.style.display = "none";
        if (calendario) calendario.style.display = "block";

        // mostrar los controles del calendario al abrir la vista de calendario
        this._setCalendarControlsVisible(true);
      });
    }

    // Botón Regresar (corregido)
    const btnRegresar = document.getElementById("nav-btn-regresar");
    if (btnRegresar) {
      btnRegresar.addEventListener("click", (e) => {
        e.preventDefault();
        // mostrar wrapper (menú principal) y ocultar la vista de notas y calendario
        const wrapper = document.getElementById("wrapper");
        const notas = document.getElementById("appScreen-notas");
        const calendario = document.getElementById("appScreen-calendario");

        if (notas) notas.style.display = "none";
        if (calendario) calendario.style.display = "none";
        if (wrapper) wrapper.style.display = "flex";

        // ocultar controles del calendario al volver al menú
        this._setCalendarControlsVisible(false);
      });
    }

    // Botón Cerrar sesión: soporta onclick inline o enlace por id/class/attr
    const btnCerrarInline = document.getElementById("nav-btn"); // en tu HTML hay onclick="app.cerrarSesion()"
    const btnCerrarById = document.getElementById("nav-btn-cerrar");
    const btnCerrarByClass = document.querySelector(".nav-logout");
    const btnCerrarByAttr = document.querySelector("[data-logout]");

    const bindLogout = (el) => {
      if (!el) return;
      el.addEventListener("click", (e) => {
        e.preventDefault();
        this.cerrarSesion();
      });
    };

    bindLogout(btnCerrarInline);
    bindLogout(btnCerrarById);
    bindLogout(btnCerrarByClass);
    bindLogout(btnCerrarByAttr);

    // También ocultar controles si el usuario hace click en "Este mes" (si no está visible)
    // (esto es por si el calendario se abre desde otros puntos)
    const controlsTodayBtn = document.querySelector(".c-today__btn");
    if (controlsTodayBtn) {
      controlsTodayBtn.addEventListener("click", () => {
        // si la vista del calendario no está visible por alguna razón, ocultar controles
        const calendario = document.getElementById("appScreen-calendario");
        this._setCalendarControlsVisible(
          Boolean(calendario && calendario.style.display !== "none")
        );
      });
    }
  }

  // Helper: mostrar/ocultar controles del calendario (id="calendar-controls")
  _setCalendarControlsVisible(visible) {
    const controls = document.getElementById("calendar-controls");
    if (!controls) return;
    // Usamos display para que no interfiera con layout ni con clicks en nav
    controls.style.display = visible ? "flex" : "none";
  }

  // Nueva función: intenta cargar usuarios desde un archivo JSON.
  // Si no hay archivo o falla, se queda con los usuarios que haya en localStorage (o vacío).
  async loadUsuariosFromJSON(path) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) throw new Error("No se encontró el archivo JSON");

      const data = await response.json();

      // Aceptamos dos formatos comunes:
      if (Array.isArray(data)) {
        this.usuarios = data;
      } else if (Array.isArray(data.usuarios)) {
        this.usuarios = data.usuarios;
      } else if (Array.isArray(data.users)) {
        this.usuarios = data.users;
      } else {
        console.warn(
          "Formato JSON de usuarios inesperado, usando localStorage."
        );
        this.usuarios = JSON.parse(localStorage.getItem("udb_usuarios")) || [];
        return;
      }

      localStorage.setItem("udb_usuarios", JSON.stringify(this.usuarios));
      console.log(
        `Usuarios cargados desde ${path} (total: ${this.usuarios.length})`
      );
    } catch (err) {
      console.warn(
        `No se pudo cargar ${path}: ${err.message}. Usando localStorage.`
      );
      this.usuarios = JSON.parse(localStorage.getItem("udb_usuarios")) || [];
    }
  }

  verificarAutenticacion() {
    if (this.usuarioActual) {
      this.mostrarAplicacion();
    } else {
      this.mostrarLogin();
    }
  }

  iniciarSesion() {
    const carnetEl = document.getElementById("carnet");
    const passwordEl = document.getElementById("password");
    if (!carnetEl || !passwordEl) {
      alert("Formulario de login incompleto en el DOM.");
      return;
    }

    const carnet = carnetEl.value.trim().toUpperCase();
    const password = passwordEl.value;

    const usuario = this.usuarios.find(
      (u) =>
        String(u.carnet) === String(carnet) &&
        String(u.password) === String(password)
    );

    if (usuario) {
      this.usuarioActual = usuario;
      localStorage.setItem("udb_usuario_actual", JSON.stringify(usuario));
      this.mostrarAplicacion();
    } else {
      alert("Carnet o contraseña incorrectos");
    }
  }

  cerrarSesion() {
    this.usuarioActual = null;
    localStorage.removeItem("udb_usuario_actual");
    this.mostrarLogin();
    // asegurarnos de que los controles del calendario queden ocultos al cerrar sesión
    this._setCalendarControlsVisible(false);
  }

  mostrarLogin() {
    // quitar clases de estado de app y aplicar login
    document.body.classList && document.body.classList.remove("app-bg");
    document.body.classList && document.body.classList.add("login-bg");

    const loginScreen = document.getElementById("loginScreen");
    const appScreen = document.getElementById("appScreen");
    const loginForm = document.getElementById("loginForm");
    const calendario = document.getElementById("appScreen-calendario");

    if (loginScreen) loginScreen.style.display = "flex";
    if (appScreen) appScreen.style.display = "none";
    if (loginForm) {
      loginForm.style.display = "flex";
      loginForm.reset();
    }

    // restaurar vista inicial del app (menu visible, notas ocultas)
    const wrapper = document.getElementById("wrapper");
    const notas = document.getElementById("appScreen-notas");
    if (wrapper) wrapper.style.display = "flex";
    if (notas) notas.style.display = "none";

    // asegurar que el calendario no quede visible
    if (calendario) calendario.style.display = "none";
    // y ocultar los controles también
    this._setCalendarControlsVisible(false);
  }

  mostrarAplicacion() {
    document.body.classList && document.body.classList.remove("login-bg");
    document.body.classList && document.body.classList.add("app-bg");

    const loginScreen = document.getElementById("loginScreen");
    const appScreen = document.getElementById("appScreen");
    const calendario = document.getElementById("appScreen-calendario");

    if (loginScreen) loginScreen.style.display = "none";
    if (appScreen) appScreen.style.display = "block";

    // mostrar carnet y cargar datos
    if (this.usuarioActual) {
      const userCarnetEl = document.getElementById("userCarnet");
      if (userCarnetEl) userCarnetEl.textContent = this.usuarioActual.carnet;
    }

    this.cargarMateriasSelect();
    this.renderizarMaterias();

    // Al mostrar la app por primera vez, mostramos el menú principal (wrapper)
    const wrapper = document.getElementById("wrapper");
    const notas = document.getElementById("appScreen-notas");
    if (wrapper) wrapper.style.display = "flex";
    if (notas) notas.style.display = "none";

    // asegurar que el calendario no se muestre automáticamente
    if (calendario) calendario.style.display = "none";
    // y ocultar los controles del calendario por defecto
    this._setCalendarControlsVisible(false);
  }

  agregarMateria() {
    // validaciones básicas
    if (!this.usuarioActual || !this.usuarioActual.id) {
      console.error(
        "No hay usuario autenticado al intentar agregar materia:",
        this.usuarioActual
      );
      this.mostrarLogin();
      return;
    }

    const nombreEl = document.getElementById("nombreMateria");
    const codigoEl = document.getElementById("codigoMateria");
    const semestreEl = document.getElementById("semestre");

    if (!nombreEl || !codigoEl || !semestreEl) {
      alert("Formulario de materia incompleto en el DOM.");
      return;
    }

    const nombre = nombreEl.value;
    const codigo = codigoEl.value.toUpperCase();
    const semestre = semestreEl.value;

    const materia = {
      id: Date.now(),
      usuarioId: this.usuarioActual.id,
      nombre,
      codigo,
      semestre,
      fechaCreacion: new Date().toISOString(),
    };

    this.materias.push(materia);
    this.guardarDatos();
    this.cargarMateriasSelect();
    this.renderizarMaterias();
    const materiaForm = document.getElementById("materiaForm");
    if (materiaForm) materiaForm.reset();
  }

  agregarTrabajo() {
    if (!this.usuarioActual || !this.usuarioActual.id) {
      console.error(
        "No hay usuario autenticado al intentar agregar trabajo:",
        this.usuarioActual
      );
      this.mostrarLogin();
      return;
    }

    const materiaSelect = document.getElementById("materiaSelect");
    const tituloEl = document.getElementById("tituloTrabajo");
    const descripcionEl = document.getElementById("descripcionTrabajo");
    const fechaEntregaEl = document.getElementById("fechaEntrega");
    const prioridadEl = document.getElementById("prioridad");

    if (
      !materiaSelect ||
      !tituloEl ||
      !descripcionEl ||
      !fechaEntregaEl ||
      !prioridadEl
    ) {
      alert("Formulario de trabajo incompleto en el DOM.");
      return;
    }

    const materiaId = parseInt(materiaSelect.value);
    const titulo = tituloEl.value;
    const descripcion = descripcionEl.value;
    const fechaEntrega = fechaEntregaEl.value;
    const prioridad = prioridadEl.value;

    const trabajo = {
      id: Date.now(),
      usuarioId: this.usuarioActual.id,
      materiaId,
      titulo,
      descripcion,
      fechaEntrega,
      prioridad,
      completado: false,
      fechaCreacion: new Date().toISOString(),
    };

    this.trabajos.push(trabajo);
    this.guardarDatos();
    this.renderizarMaterias();
    const trabajoForm = document.getElementById("trabajoForm");
    if (trabajoForm) trabajoForm.reset();
  }

  cargarMateriasSelect() {
    const select = document.getElementById("materiaSelect");
    if (!select) return;
    select.innerHTML = '<option value="">Seleccionar materia</option>';

    if (!this.usuarioActual || !this.usuarioActual.id) return;

    const uid = this.usuarioActual.id;
    const materiasUsuario = this.materias.filter(
      (m) => String(m.usuarioId) === String(uid)
    );

    materiasUsuario.forEach((materia) => {
      const option = document.createElement("option");
      option.value = materia.id;
      option.textContent = `${materia.codigo} - ${materia.nombre}`;
      select.appendChild(option);
    });
  }

  renderizarMaterias() {
    const container = document.getElementById("listaMaterias");
    if (!container) return;
    container.innerHTML = "";

    if (!this.usuarioActual || !this.usuarioActual.id) {
      container.innerHTML =
        '<p class="no-data">Debes iniciar sesión para ver tus materias.</p>';
      return;
    }

    const uid = this.usuarioActual.id;
    const materiasUsuario = this.materias.filter(
      (m) => String(m.usuarioId) === String(uid)
    );

    if (materiasUsuario.length === 0) {
      container.innerHTML =
        '<p class="no-data">No hay materias registradas. Agrega tu primera materia.</p>';
      return;
    }

    materiasUsuario.forEach((materia) => {
      const trabajosMateria = this.trabajos.filter(
        (t) =>
          String(t.materiaId) === String(materia.id) &&
          String(t.usuarioId) === String(uid)
      );

      const materiaCard = document.createElement("div");
      materiaCard.className = "materia-card";

      materiaCard.innerHTML = `
                <div class="materia-header">
                    <span class="materia-nombre">${materia.nombre}</span>
                    <span class="materia-codigo">${materia.codigo} - Sem ${
        materia.semestre
      }</span>
                </div>
                <div class="trabajos-lista">
                    ${
                      trabajosMateria.length === 0
                        ? '<p class="no-trabajos">No hay trabajos asignados</p>'
                        : trabajosMateria
                            .map((trabajo) => this.renderizarTrabajo(trabajo))
                            .join("")
                    }
                </div>
            `;

      container.appendChild(materiaCard);
    });
  }

  renderizarTrabajo(trabajo) {
    const fechaEntrega = new Date(trabajo.fechaEntrega);
    const hoy = new Date();
    const diffTime = fechaEntrega - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let fechaClass = "";
    if (diffDays <= 3 && diffDays >= 0) fechaClass = "fecha-proxima";
    if (diffDays < 0) fechaClass = "fecha-pasada";

    return `
            <div class="trabajo-item prioridad-${
              trabajo.prioridad
            } ${fechaClass}">
                <strong>${trabajo.titulo}</strong>  
                <p>${trabajo.descripcion || "Sin descripción"}</p>
                <small>Entrega: ${
                  isNaN(fechaEntrega.getTime())
                    ? "Fecha inválida"
                    : fechaEntrega.toLocaleDateString()
                } (${isNaN(diffDays) ? "?" : diffDays} días)</small>
                <button onclick="app.marcarCompletado(${
                  trabajo.id
                })" class="btn-app">
                    ${trabajo.completado ? "✅" : "⏳"} ${
      trabajo.completado ? "Completado" : "Marcar como completado"
    }
                </button>
                <button onclick="app.eliminarTrabajo(${
                  trabajo.id
                })" class="btn-app">🗑️ Eliminar</button>
            </div>
        `;
  }

  marcarCompletado(trabajoId) {
    const trabajo = this.trabajos.find((t) => t.id === trabajoId);
    if (trabajo) {
      trabajo.completado = !trabajo.completado;
      this.guardarDatos();
      this.renderizarMaterias();
    }
  }

  eliminarTrabajo(trabajoId) {
    if (confirm("¿Estás seguro de que quieres eliminar este trabajo?")) {
      this.trabajos = this.trabajos.filter((t) => t.id !== trabajoId);
      this.guardarDatos();
      this.renderizarMaterias();
    }
  }

  guardarDatos() {
    localStorage.setItem("udb_usuarios", JSON.stringify(this.usuarios));
    localStorage.setItem("udb_materias", JSON.stringify(this.materias));
    localStorage.setItem("udb_trabajos", JSON.stringify(this.trabajos));
  }
}

// Inicializar la aplicación
const app = new AgendaIngenieria();
