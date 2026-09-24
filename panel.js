/**
 * Lógica del panel lateral para preview de mockup
 * Controla el color de fondo y las imágenes del div de preview
 */

// Estado global
let currentColor = "#ffffff";
let currentFrontSrc = null;
let currentBackSrc = null;
let showingFront = true;

function initPanel() {
  const panel = document.getElementById("side-panel");
  const colorPicker = document.getElementById("color-picker");
  const frontInput = document.getElementById("image-input");
  const backInput = document.getElementById("image-input-back");
  const frontPreview = document.getElementById("front-preview");
  const backPreview = document.getElementById("back-preview");
  const debugPreview = document.getElementById("debug-preview");
  const toggleBtn = document.getElementById("toggle-preview");

  if (!panel || !colorPicker || !frontInput || !backInput) {
    console.warn("Panel elements not found");
    return;
  }

  // Actualizar el color de fondo
  colorPicker.addEventListener("input", (e) => {
    currentColor = e.target.value;
    updatePreviewBackground();
  });

  // Imagen frente
  frontInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      currentFrontSrc = event.target.result;
      frontPreview.style.backgroundImage = `url(${currentFrontSrc})`;
      frontPreview.style.backgroundSize = "cover";
      frontPreview.style.backgroundPosition = "center";
      updateActivePreview();
    };
    reader.readAsDataURL(file);
  });

  // Imagen atrás
  backInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      currentBackSrc = event.target.result;
      backPreview.style.backgroundImage = `url(${currentBackSrc})`;
      backPreview.style.backgroundSize = "cover";
      backPreview.style.backgroundPosition = "center";
      updateActivePreview();
    };
    reader.readAsDataURL(file);
  });

  // Alternar entre frente y atrás
  toggleBtn.addEventListener("click", () => {
    showingFront = !showingFront;
    updateActivePreview();
  });

  // Vista previa PNG
  document.querySelector(".side-panel button:last-of-type").addEventListener("click", () => {
    generatePreviewPNG().then((image) => {
      if (image != null) {
        debugPreview.src = image;
        changeModelTexture(image);
      }
    });
  });

  function updateActivePreview() {
    const previewSquare = document.getElementById("preview-square");
    const previews = previewSquare.querySelectorAll(".texture-preview");

    previews.forEach((p) => {
      p.classList.remove("active");
      p.style.opacity = "0";
      p.style.transform = "scale(0.8) rotateY(90deg)";
    });

    const activePreview = showingFront ? frontPreview : backPreview;
    activePreview.classList.add("active");
    activePreview.style.opacity = "1";
    activePreview.style.transform = "scale(1) rotateY(0deg)";
  }

  function updatePreviewBackground() {
    const previewSquare = document.getElementById("preview-square");
    previewSquare.style.backgroundColor = currentColor;
  }
}

/**
 * Procesa una imagen: redimensiona y retorna una promesa con la imagen procesada
 */
function processImage(src, targetWidth) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;

    img.onload = () => {
      const proporcion = targetWidth / img.width;
      const nuevaAltura = img.height * proporcion * 0.617;

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = nuevaAltura;
      const ctx = canvas.getContext("2d");

      // Solo redimensionar (sin flip — el flip se aplica en generatePreviewPNG)
      ctx.drawImage(img, 0, 0, targetWidth, nuevaAltura);

      resolve({ canvas, nuevaAltura });
    };

    img.onerror = () => resolve(null);
  });
}

/**
 * Genera un PNG con ambas imágenes (frente y atrás)
 * @returns {Promise<string|null>}
 */
async function generatePreviewPNG() {
  if (!currentFrontSrc && !currentBackSrc) {
    console.warn("No images loaded");
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 4096;
  canvas.height = 2048;
  const ctx = canvas.getContext("2d");

  // Fondo
  ctx.fillStyle = currentColor;
  ctx.fillRect(0, 0, 4096, 2048);

  // Dibujar imagen frente (si existe) en x=1180, y=1805
  if (currentFrontSrc) {
    const frontResult = await processImage(currentFrontSrc, 270);
    if (frontResult) {
      ctx.save();
      ctx.scale(1, -1);
      const yFlipped = -(1805 + frontResult.nuevaAltura);
      ctx.drawImage(frontResult.canvas, 1180, yFlipped);
      ctx.restore();
    }
  }

  // Dibujar imagen atrás (si existe) en x=315, y=1750
  if (currentBackSrc) {
    const backResult = await processImage(currentBackSrc, 270);
    if (backResult) {
      ctx.save();
      ctx.scale(1, -1);
      const yFlipped = -(1750 + backResult.nuevaAltura);
      ctx.drawImage(backResult.canvas, 315, yFlipped);
      ctx.restore();
    }
  }

  return canvas.toDataURL("image/png");
}

// Inicializar
document.addEventListener("DOMContentLoaded", initPanel);
