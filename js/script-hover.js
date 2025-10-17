class HoverButton {
  constructor(el) {
    this.el = el;
    this.hover = false;
    this.calculatePosition();
    this.attachEventsListener();

    // --- Forzar recálculos cuando el layout se estabilice ---
    const forceCalc = () => this.calculatePosition();

    // Si la página ya terminó de cargar, programar recálculos en los siguientes frames.
    if (document.readyState === "complete") {
      requestAnimationFrame(() => {
        // doble rAF + timeout para cubrir shifts por webfonts/imágenes
        requestAnimationFrame(forceCalc);
        setTimeout(forceCalc, 60);
      });
    } else {
      // si no ha terminado, aseguramos recálculo en load y DOMContentLoaded
      window.addEventListener("load", forceCalc);
      document.addEventListener("DOMContentLoaded", forceCalc);
    }

    // Fallback: si en el primer movimiento las posiciones son inválidas, recalcular
    const firstMouse = () => {
      if (!this.width || isNaN(this.x) || isNaN(this.y)) {
        forceCalc();
      }
      window.removeEventListener("mousemove", firstMouse);
    };
    window.addEventListener("mousemove", firstMouse, { once: true });

    // Si hay ResizeObserver disponible, observar cambios de tamaño del elemento (útil si CSS cambia)
    if (typeof ResizeObserver !== "undefined") {
      this._ro = new ResizeObserver(forceCalc);
      try {
        this._ro.observe(this.el);
      } catch (err) {
        // no romper si algo falla
      }
    }
  }

  attachEventsListener() {
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    window.addEventListener("resize", (e) => this.calculatePosition(e));
  }

  calculatePosition() {
    gsap.set(this.el, {
      x: 0,
      y: 0,
      scale: 1,
    });

    const box = this.el.getBoundingClientRect();
    this.x = box.left + box.width * 0.5;
    this.y = box.top + box.height * 0.5;
    this.width = box.width;
    this.height = box.height;

    // Si quieres debuguear, descomenta la siguiente línea:
    // console.log('calcPos', this.el, this.x, this.y, this.width, this.height);
  }

  onMouseMove(e) {
    let hover = false;
    let hoverArea = this.hover ? 0.7 : 0.5;
    let x = e.clientX - this.x;
    let y = e.clientY - this.y;
    let distance = Math.sqrt(x * x + y * y);
    if (distance < this.width * hoverArea) {
      hover = true;
      if (!this.hover) {
        this.hover = true;
      }
      this.onHover(e.clientX, e.clientY);
    }

    if (!hover && this.hover) {
      this.onLeave();
      this.hover = false;
    }
  }

  onHover(x, y) {
    gsap.to(this.el, {
      x: (x - this.x) * 0.4,
      y: (y - this.y) * 0.4,
      scale: 1.15,
      ease: "power2.out",
      duration: 0.4,
    });

    this.el.style.zIndex = 10;
  }
  onLeave() {
    gsap.to(this.el, {
      x: 0,
      y: 0,
      scale: 1,
      ease: "elastic.out(1.2, 0.4)",
      duration: 0.7,
    });

    this.el.style.zIndex = 1;
  }
}

const btn1 = document.querySelector("li:nth-child(1) button");
new HoverButton(btn1);

const btn2 = document.querySelector("li:nth-child(2) button");
new HoverButton(btn2);
