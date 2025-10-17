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
    document.getElementById("loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.iniciarSesion();
    });

    document.getElementById("materiaForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.agregarMateria();
    });

    document.getElementById("trabajoForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.agregarTrabajo();
    });
  }

  // Nueva función: intenta cargar usuarios desde un archivo JSON.
  // Si no hay archivo o falla, se queda con los usuarios que haya en localStorage (o vacío).
  async loadUsuariosFromJSON(path) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) throw new Error("No se encontró el archivo JSON");

      const data = await response.json();

      // Aceptamos dos formatos comunes:
      // 1) Un array directamente: [ { id, carnet, password, ... }, ... ]
      // 2) Un objeto con propiedad "usuarios" o "users": { usuarios: [...] }
      if (Array.isArray(data)) {
        this.usuarios = data;
      } else if (Array.isArray(data.usuarios)) {
        this.usuarios = data.usuarios;
      } else if (Array.isArray(data.users)) {
        this.usuarios = data.users;
      } else {
        // formato inesperado -> fallback a localStorage
        console.warn(
          "Formato JSON de usuarios inesperado, usando localStorage."
        );
        this.usuarios = JSON.parse(localStorage.getItem("udb_usuarios")) || [];
        return;
      }

      // Guardamos en localStorage para mantener compatibilidad con el resto del app
      localStorage.setItem("udb_usuarios", JSON.stringify(this.usuarios));
      console.log(
        `Usuarios cargados desde ${path} (total: ${this.usuarios.length})`
      );
    } catch (err) {
      // Si falla (por ejemplo CORS o file://), usamos localStorage como antes
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

  registrarUsuario() {
    const carnet = document
      .getElementById("regCarnet")
      .value.trim()
      .toUpperCase();
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("regConfirmPassword").value;

    // Validaciones
    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    if (this.usuarios.find((u) => u.carnet === carnet)) {
      alert("Este carnet ya está registrado");
      return;
    }

    const usuario = {
      id: Date.now(),
      carnet: carnet,
      password: password, // En una app real, esto debería estar encriptado
      fechaRegistro: new Date().toISOString(),
    };

    this.usuarios.push(usuario);
    localStorage.setItem("udb_usuarios", JSON.stringify(this.usuarios));

    alert("Registro exitoso. Ahora puedes iniciar sesión.");
    this.mostrarLogin();
  }

  iniciarSesion() {
    const carnet = document.getElementById("carnet").value.trim().toUpperCase();
    const password = document.getElementById("password").value;

    const usuario = this.usuarios.find(
      (u) => u.carnet === carnet && u.password === password
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
  }

  mostrarLogin() {
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("appScreen").style.display = "none";
    document.getElementById("loginForm").style.display = "flex";
    document.getElementById("loginForm").reset();
  }

  mostrarAplicacion() {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("appScreen").style.display = "block";
    document.getElementById("userCarnet").textContent =
      this.usuarioActual.carnet;
    this.cargarMateriasSelect();
    this.renderizarMaterias();
  }

  agregarMateria() {
    const nombre = document.getElementById("nombreMateria").value;
    const codigo = document.getElementById("codigoMateria").value.toUpperCase();
    const semestre = document.getElementById("semestre").value;

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
    document.getElementById("materiaForm").reset();
  }

  agregarTrabajo() {
    const materiaId = parseInt(document.getElementById("materiaSelect").value);
    const titulo = document.getElementById("tituloTrabajo").value;
    const descripcion = document.getElementById("descripcionTrabajo").value;
    const fechaEntrega = document.getElementById("fechaEntrega").value;
    const prioridad = document.getElementById("prioridad").value;

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
    document.getElementById("trabajoForm").reset();
  }

  cargarMateriasSelect() {
    const select = document.getElementById("materiaSelect");
    select.innerHTML = '<option value="">Seleccionar materia</option>';

    const materiasUsuario = this.materias.filter(
      (m) => m.usuarioId === this.usuarioActual.id
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
    container.innerHTML = "";

    const materiasUsuario = this.materias.filter(
      (m) => m.usuarioId === this.usuarioActual.id
    );

    if (materiasUsuario.length === 0) {
      container.innerHTML =
        '<p class="no-data">No hay materias registradas. Agrega tu primera materia.</p>';
      return;
    }

    materiasUsuario.forEach((materia) => {
      const trabajosMateria = this.trabajos.filter(
        (t) =>
          t.materiaId === materia.id && t.usuarioId === this.usuarioActual.id
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
                <small>Entrega: ${fechaEntrega.toLocaleDateString()} (${diffDays} días)</small>
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
