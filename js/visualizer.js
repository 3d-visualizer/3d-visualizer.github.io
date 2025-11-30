class PanSVG extends HTMLElement {
  connectedCallback() {
    // Create SVG element
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.touchAction = "none"; // prevent touch scrolling
    this.appendChild(svg);

    // Create group to apply pan & zoom
    const g = document.createElementNS(svgNS, "g");
    svg.appendChild(g);

    // Add image
    const img = document.createElementNS(svgNS, "image");
    img.setAttributeNS(null, "href", "../img/dark/map.webp");
    img.setAttribute("x", 0);
    img.setAttribute("y", 0);
    img.setAttribute("width", "4000");
    img.setAttribute("height", "2000");
    g.appendChild(img);

    // Pan & zoom state
    let offsetX = 0, offsetY = 0;
    let scale = 1;
    let isDragging = false;
    let startX, startY;

    function updateTransform() {
      g.setAttribute("transform", `translate(${offsetX},${offsetY}) scale(${scale})`);
    }

    // Mouse events for panning
    svg.addEventListener("mousedown", e => {
      isDragging = true;
      startX = e.offsetX - offsetX;
      startY = e.offsetY - offsetY;
    });

    svg.addEventListener("mousemove", e => {
      if (isDragging) {
        offsetX = e.offsetX - startX;
        offsetY = e.offsetY - startY;
        updateTransform();
      }
    });

    svg.addEventListener("mouseup", () => isDragging = false);
    svg.addEventListener("mouseleave", () => isDragging = false);

    // Zoom with mouse wheel
    svg.addEventListener("wheel", e => {
      e.preventDefault();
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      const zoomAmount = -e.deltaY * 0.001;
      const newScale = scale * (1 + zoomAmount);

      if (newScale < 0.1 || newScale > 5) return;

      // Adjust pan to zoom around mouse
      offsetX -= (mouseX - offsetX) * (newScale / scale - 1);
      offsetY -= (mouseY - offsetY) * (newScale / scale - 1);

      scale = newScale;
      updateTransform();
    });
  }
}

customElements.define("pan-svg", PanSVG);