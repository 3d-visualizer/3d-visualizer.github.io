class PanSVG extends HTMLElement {
  #data = {
    svgNS: "http://www.w3.org/2000/svg",
    playing: false,
    animStartTime: 0,
    animDuration: 200000,

    offsetX: 0,
    offsetY: 0,
    scale: 1,
    startX: 0,
    startY: 0,
    isDragging: false,

    animationFrames: [
      { t: 0, x: -168, y: -(window.innerHeight * 0.1) },
      { t: 0.35, x: -2184, y: -945 },
      { t: 0.55, x: -1680, y: 0 },
      { t: 0.85, x: -504, y: -210 },
      { t: 1, x: -168, y: -(window.innerHeight * 0.1) },
    ],

    imgs: [],
    imgs_options: {
      map: { name: "map", width: 4000, height: 2000, x: 0, y: 0 },
      itesa: { name: "itesa", x: 2262, y: 669, hover: true },
      itla: { name: "itla", x: 2492, y: 811, hover: true },
      several: { name: "several", x: 1918, y: 1007, hover: true },
      avante: { name: "avante", x: 1450, y: 1169, hover: true },
      capital: { name: "capital", x: 1373, y: 862, hover: true },
      pixel: { name: "pixel", x: 810, y: 1093, hover: true },
      planttherapy: { name: "planttherapy", x: 962, y: 376, hover: true },
      enovational: { name: "enovational", x: 2492, y: 184, hover: true },
      santodoming: { name: "santodomingo", x: 1660, y: 811 },
      twinfalls: { name: "twinfalls", x: 840, y: 308 },
      dc: { name: "dc", x: 2379, y: 129 },
    },
  };

  connectedCallback() {
    // ---------------------------------------
    // SVG Base Setup
    // ---------------------------------------
    const svg = document.createElementNS(this.#data.svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.touchAction = "none";
    svg.style.cursor = "grab";
    this.appendChild(svg);

    const g = document.createElementNS(this.#data.svgNS, "g");
    g.setAttribute("class", "map");
    svg.appendChild(g);

    // ---------------------------------------
    // Animation Setup
    // ---------------------------------------
    // let this.#data.playing = false;

    const lerp = (a, b, t) => a + (b - a) * t;

    const animatePan = (timestamp) => {
      if (!this.#data.playing) return;
      if (!this.#data.animStartTime) this.#data.animStartTime = timestamp;

      let progress =
        ((timestamp - this.#data.animStartTime) / this.#data.animDuration) % 1;

      let i = this.#data.animationFrames.findIndex(
        (f, idx) =>
          progress >= f.t && progress < this.#data.animationFrames[idx + 1]?.t
      );
      if (i === -1 || i >= this.#data.animationFrames.length - 1) i = 0;

      const a = this.#data.animationFrames[i];
      const b = this.#data.animationFrames[i + 1];
      const localT = (progress - a.t) / (b.t - a.t);

      this.#data.offsetX = lerp(a.x, b.x, localT);
      this.#data.offsetY = lerp(a.y, b.y, localT);

      updateTransform();
      requestAnimationFrame(animatePan);
    };

    if (new URLSearchParams(location.search).has("play")) {
      this.classList.add("loop");
      this.#data.playing = true;
      requestAnimationFrame(animatePan);
    }

    const createBGImage = (opt, theme) => {
      const img = document.createElementNS(this.#data.svgNS, "image");
      img.setAttributeNS(null, "href", `../img/${theme}/${opt.name}.webp`);
      img.setAttribute("x", opt.x);
      img.setAttribute("y", opt.y);
      if (opt.width) img.setAttribute("width", opt.width);
      if (opt.height) img.setAttribute("height", opt.height);
      if (opt.hover) img.setAttribute("class", "hover-state");
      this.#data.imgs.push(img);
      return img;
    };

    ["light", "dark"].forEach((theme) => {
      const themeGroup = document.createElementNS(this.#data.svgNS, "g");
      themeGroup.setAttribute("class", theme);
      Object.values(this.#data.imgs_options).forEach((opt) =>
        themeGroup.appendChild(createBGImage(opt, theme))
      );
      g.appendChild(themeGroup);
    });

    // ---------------------------------------
    // Pan & Zoom State
    // ---------------------------------------
    const updateTransform = () => {
      const svgRect = svg.getBoundingClientRect();
      const viewW = svgRect.width;
      const viewH = svgRect.height;

      const imgW =
        parseFloat(this.#data.imgs[0].getAttribute("width")) * this.#data.scale;
      const imgH =
        parseFloat(this.#data.imgs[0].getAttribute("height")) *
        this.#data.scale;

      const minX = Math.min(0, viewW - imgW);
      const minY = Math.min(0, viewH - imgH);

      this.#data.offsetX = Math.min(Math.max(this.#data.offsetX, minX), 0);
      this.#data.offsetY = Math.min(Math.max(this.#data.offsetY, minY), 0);

      g.setAttribute(
        "transform",
        `matrix(${this.#data.scale},0,0,${this.#data.scale},${
          this.#data.offsetX
        },${this.#data.offsetY})`
      );
    };

    // ---------------------------------------
    // Unified Pointer Events (mouse + touch)
    // ---------------------------------------
    const getPoint = (e) =>
      e.touches?.length
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : { x: e.offsetX, y: e.offsetY };

    const onDown = (e) => {
      this.#data.isDragging = true;
      const p = getPoint(e);
      this.#data.startX = p.x - this.#data.offsetX;
      this.#data.startY = p.y - this.#data.offsetY;
      svg.style.cursor = "grabbing";
    };

    const onMove = (e) => {
      if (!this.#data.isDragging) return;
      e.preventDefault();
      const p = getPoint(e);
      this.#data.offsetX = p.x - this.#data.startX;
      this.#data.offsetY = p.y - this.#data.startY;
      updateTransform();
    };

    const onUp = () => {
      this.#data.isDragging = false;
      svg.style.cursor = "grab";
    };

    svg.addEventListener("mousedown", onDown);
    svg.addEventListener("mousemove", onMove);
    svg.addEventListener("mouseup", onUp);
    svg.addEventListener("mouseleave", onUp);

    svg.addEventListener("touchstart", onDown, { passive: false });
    svg.addEventListener("touchmove", onMove, { passive: false });
    svg.addEventListener("touchend", onUp);

    // ---------------------------------------
    // Zoom (mouse wheel only)
    // ---------------------------------------
    svg.addEventListener("wheel", (e) => {
      e.preventDefault();

      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      let newScale = this.#data.scale * (1 - e.deltaY * 0.001);

      const minScale = Math.max(
        svg.clientWidth / this.#data.imgs[0].getAttribute("width"),
        svg.clientHeight / this.#data.imgs[0].getAttribute("height")
      );

      newScale = Math.min(Math.max(newScale, minScale), 5);

      this.#data.offsetX -=
        (mouseX - this.#data.offsetX) * (newScale / this.#data.scale - 1);
      this.#data.offsetY -=
        (mouseY - this.#data.offsetY) * (newScale / this.#data.scale - 1);

      this.#data.scale = newScale;
      updateTransform();
    });
  }
}

customElements.define("pan-svg", PanSVG);
