class PanSVG extends HTMLElement {
  connectedCallback() {
    // Create SVG element
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.touchAction = "none"; // prevent touch scrolling
    this.appendChild(svg);

    let playing = false;
    let animStartTime = 0;
    const animDuration = 200000; // 20 seconds (same as CSS)

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    const animationFrames = [
      { t: 0, x: -168, y: -(window.innerHeight * 0.1) }, // -10vh
      { t: 0.35, x: -2184, y: -945 },
      { t: 0.55, x: -1680, y: 0 },
      { t: 0.85, x: -504, y: -210 },
      { t: 1, x: -168, y: -(window.innerHeight * 0.1) }, // loop back
    ];

    function animatePan(timestamp) {
      if (!playing) return;

      if (!animStartTime) animStartTime = timestamp;
      let progress = (timestamp - animStartTime) / animDuration;

      // Loop the animation 0 → 1
      progress = progress % 1;

      // Find which segment we are currently in
      let i = animationFrames.findIndex(
        (f, index) =>
          progress >= f.t && progress < animationFrames[index + 1]?.t
      );

      // Safety fallback
      if (i === -1 || i >= animationFrames.length - 1) i = 0;

      const a = animationFrames[i];
      const b = animationFrames[i + 1];

      // Normalize progress inside this segment
      const localT = (progress - a.t) / (b.t - a.t);

      // Interpolated target position
      offsetX = lerp(a.x, b.x, localT);
      offsetY = lerp(a.y, b.y, localT);

      // Apply boundary limits
      updateTransform();

      requestAnimationFrame(animatePan);
    }

    if (new URLSearchParams(location.search).has("play")) {
      this.classList.add("loop");
      playing = true;
      requestAnimationFrame(animatePan);
    }

    // Create group to apply pan & zoom
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("class", "map");
    svg.appendChild(g);

    const imgs = [];
    const imgs_options = {
      map: {
        name: "map",
        width: 4000,
        height: 2000,
        x: 0,
        y: 0,
      },
      itesa: {
        name: "itesa",
        x: 2262,
        y: 669,
        hover: true,
      },
      itla: {
        name: "itla",
        x: 2492,
        y: 811,
        hover: true,
      },
      several: {
        name: "several",
        x: 1918,
        y: 1007,
        hover: true,
      },
      avante: {
        name: "avante",
        x: 1450,
        y: 1169,
        hover: true,
      },
      capital: {
        name: "capital",
        x: 1373,
        y: 862,
        hover: true,
      },
      pixel: {
        name: "pixel",
        x: 810,
        y: 1093,
        hover: true,
      },
      planttherapy: {
        name: "planttherapy",
        x: 962,
        y: 376,
        hover: true,
      },
      enovational: {
        name: "enovational",
        x: 2492,
        y: 184,
        hover: true,
      },
      santodoming: {
        name: "santodomingo",
        x: 1660,
        y: 811,
      },
      twinfalls: {
        name: "twinfalls",
        x: 840,
        y: 308,
      },
      dc: {
        name: "dc",
        x: 2379,
        y: 129,
      },
    };

    function createBGImage(name, options, theme) {
      const img = document.createElementNS(svgNS, "image");

      img.setAttributeNS(null, "href", `../img/${theme}/${options.name}.webp`);
      img.setAttribute("x", options.x);
      img.setAttribute("y", options.y);
      options.width && img.setAttribute("width", options.width);
      options.height && img.setAttribute("height", options.height);
      options.hover && img.setAttribute("class", "hover-state");
      imgs.push(img);
      return img;
    }

    // Add images dynamically
    ["light", "dark"].forEach((theme) => {
      const theme_group = document.createElementNS(svgNS, "g");
      theme_group.setAttribute("class", theme);

      Object.entries(imgs_options).forEach(([key, options]) => {
        theme_group.appendChild(createBGImage(key, options, theme));
      });

      g.appendChild(theme_group);
    });

    // Pan & zoom state
    let offsetX = 0,
      offsetY = 0;
    let scale = 1;
    let isDragging = false;
    let startX, startY;

    function updateTransform() {
      // Calculate limits
      const svgRect = svg.getBoundingClientRect();
      const viewWidth = svgRect.width;
      const viewHeight = svgRect.height;
      const imgWidthScaled = parseFloat(imgs[0].getAttribute("width")) * scale;
      const imgHeightScaled =
        parseFloat(imgs[0].getAttribute("height")) * scale;

      // Clamp offsetX
      const minX = Math.min(0, viewWidth - imgWidthScaled);
      const maxX = 0;
      offsetX = Math.min(Math.max(offsetX, minX), maxX);

      // Clamp offsetY
      const minY = Math.min(0, viewHeight - imgHeightScaled);
      const maxY = 0;
      offsetY = Math.min(Math.max(offsetY, minY), maxY);

      g.setAttribute(
        "transform",
        `matrix(${scale},0,0,${scale},${offsetX},${offsetY})`
      );
    }

    // Mouse events for panning
    svg.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.offsetX - offsetX;
      startY = e.offsetY - offsetY;
    });

    svg.addEventListener("mousemove", (e) => {
      if (isDragging) {
        offsetX = e.offsetX - startX;
        offsetY = e.offsetY - startY;
        updateTransform();
      }
    });

    svg.addEventListener("mouseup", () => (isDragging = false));
    svg.addEventListener("mouseleave", () => (isDragging = false));

    // Zoom with mouse wheel
    svg.addEventListener("wheel", (e) => {
      e.preventDefault();
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      const zoomAmount = -e.deltaY * 0.001;
      let newScale = scale * (1 + zoomAmount);

      // Minimum zoom to fit the viewport
      const minScaleX = svg.clientWidth / imgs[0].getAttribute("width");
      const minScaleY = svg.clientHeight / imgs[0].getAttribute("height");
      const minScale = Math.max(minScaleX, minScaleY);

      if (newScale < minScale) newScale = minScale;
      if (newScale > 5) newScale = 5;

      offsetX -= (mouseX - offsetX) * (newScale / scale - 1);
      offsetY -= (mouseY - offsetY) * (newScale / scale - 1);

      scale = newScale;
      updateTransform();
    });

    // Default cursor
    svg.style.cursor = "grab";

    svg.addEventListener("mousedown", () => {
      svg.style.cursor = "grabbing";
    });

    svg.addEventListener("mouseup", () => {
      svg.style.cursor = "grab";
    });
  }
}

customElements.define("pan-svg", PanSVG);
