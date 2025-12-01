# **3D Visualizer**
[![Visualizer Preview](https://3d-visualizer.github.io/img/visualizer-preview.webp)](https://3d-visualizer.github.io)

A lightweight visualizer built with native **Web Components** and **SVG**, created as a refactor of a previous project that originally used **Vue.js**, **Blender**, and **Konva**. The original version started as a Google Maps-based app showing the cities where I’ve lived, studied, or worked. But as the map grew too large and visually restrictive, the project evolved into a custom-designed world—my own interpretation of those places with my own aesthetic and style.

The current version displays pre-rendered 3D assets inside an SVG, allowing crisp scaling, smooth panning, zooming, and optional looping animations. All visual elements come from Blender renders but are delivered as WebP images layered on an SVG canvas for maximum performance.

3D Visualizer now runs as a standalone component that can sit on a dedicated monitor as a looping map or ambient visual. It supports theming, hover states, and a `?play` URL parameter to enable automatic camera-style movement.
