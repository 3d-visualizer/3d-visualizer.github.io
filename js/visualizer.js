class PanSVG extends HTMLElement {
  connectedCallback() {
    const svgNS = "http://www.w3.org/2000/svg";

    // ---------------------------------------
    // SVG Base Setup
    // ---------------------------------------
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.touchAction = "none"; // enable mobile panning
    svg.style.cursor = "grab";
    this.appendChild(svg);

    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("class", "map");
    svg.appendChild(g);

    // ---------------------------------------
    // Animation Setup
    // ---------------------------------------
    let playing = false;
    let animStartTime = 0;
    const animDuration = 20000; // 20s

    const lerp = (a, b, t) => a + (b - a) * t;

    const animationFrames = [
      { t: 0, x: -168, y: -(window.innerHeight * 0.1) },
      { t: 0.35, x: -2184, y: -945 },
      { t: 0.55, x: -1680, y: 0 },
      { t: 0.85, x: -504, y: -210 },
      { t: 1, x: -168, y: -(window.innerHeight * 0.1) },
    ];

    const animatePan = (timestamp) => {
      if (!playing) return;
      if (!animStartTime) animStartTime = timestamp;

      let progress = ((timestamp - animStartTime) / animDuration) % 1;

      let i = animationFrames.findIndex(
        (f, idx) => progress >= f.t && progress < animationFrames[idx + 1]?.t
      );
      if (i === -1 || i >= animationFrames.length - 1) i = 0;

      const a = animationFrames[i];
      const b = animationFrames[i + 1];
      const localT = (progress - a.t) / (b.t - a.t);

      offsetX = lerp(a.x, b.x, localT);
      offsetY = lerp(a.y, b.y, localT);

      updateTransform();
      requestAnimationFrame(animatePan);
    };

    if (new URLSearchParams(location.search).has("play")) {
      this.classList.add("loop");
      playing = true;
      requestAnimationFrame(animatePan);
    }

    // ---------------------------------------
    // Asset Definitions
    // ---------------------------------------
    const imgs = [];
    const imgs_options = {
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
    };

    const createBGImage = (opt, theme) => {
      const img = document.createElementNS(svgNS, "image");
      img.setAttributeNS(null, "href", `../img/${theme}/${opt.name}.webp`);
      img.setAttribute("x", opt.x);
      img.setAttribute("y", opt.y);
      if (opt.width) img.setAttribute("width", opt.width);
      if (opt.height) img.setAttribute("height", opt.height);
      if (opt.hover) img.setAttribute("class", "hover-state");
      imgs.push(img);
      return img;
    };

    ["light", "dark"].forEach((theme) => {
      const themeGroup = document.createElementNS(svgNS, "g");
      themeGroup.setAttribute("class", theme);
      Object.values(imgs_options).forEach((opt) =>
        themeGroup.appendChild(createBGImage(opt, theme))
      );
      g.appendChild(themeGroup);
    });

    // ---------------------------------------
    // Pan & Zoom State
    // ---------------------------------------
    let offsetX = 0;
    let offsetY = 0;
    let scale = 1;
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    const updateTransform = () => {
      const svgRect = svg.getBoundingClientRect();
      const viewW = svgRect.width;
      const viewH = svgRect.height;

      const imgW = parseFloat(imgs[0].getAttribute("width")) * scale;
      const imgH = parseFloat(imgs[0].getAttribute("height")) * scale;

      const minX = Math.min(0, viewW - imgW);
      const minY = Math.min(0, viewH - imgH);

      offsetX = Math.min(Math.max(offsetX, minX), 0);
      offsetY = Math.min(Math.max(offsetY, minY), 0);

      g.setAttribute(
        "transform",
        `matrix(${scale},0,0,${scale},${offsetX},${offsetY})`
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
      isDragging = true;
      const p = getPoint(e);
      startX = p.x - offsetX;
      startY = p.y - offsetY;
      svg.style.cursor = "grabbing";
    };

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const p = getPoint(e);
      offsetX = p.x - startX;
      offsetY = p.y - startY;
      updateTransform();
    };

    const onUp = () => {
      isDragging = false;
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
      let newScale = scale * (1 - e.deltaY * 0.001);

      const minScale = Math.max(
        svg.clientWidth / imgs[0].getAttribute("width"),
        svg.clientHeight / imgs[0].getAttribute("height")
      );

      newScale = Math.min(Math.max(newScale, minScale), 5);

      offsetX -= (mouseX - offsetX) * (newScale / scale - 1);
      offsetY -= (mouseY - offsetY) * (newScale / scale - 1);

      scale = newScale;
      updateTransform();
    });
  }
}

customElements.define("pan-svg", PanSVG);
