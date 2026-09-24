import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Instancia del modelo 3D
let model = null;

// Insancia de los materials que se modificarán cuando cambie la textura (se inicializan al cargar el modelo)
const texturedMaterials = [];

// Loader
const loaderEl = document.getElementById("loader");
const loaderText = document.getElementById("loader-text");
const loaderMessages = [
  "Compiling shaders",
  "Aligning polygons",
  "Baking textures",
  "Calibrating lights",
  "Spinning up WebGL",
  "Unwrapping UVs",
  "Ray tracing dreams",
  "Feeding the GPU",
  "Importing geometries",
  "Mapping normals",
  "Optimizing meshes",
  "Rendering pixels",
];
let loaderIndex = 0;
let loaderInterval;

function startLoader() {
  loaderText.textContent = loaderMessages[loaderIndex];
  loaderInterval = setInterval(() => {
    loaderIndex = (loaderIndex + 1) % loaderMessages.length;
    loaderText.textContent = loaderMessages[loaderIndex];
  }, 800);
}

function stopLoader() {
  clearInterval(loaderInterval);
  loaderEl.classList.add("hidden");
}

// Posición de la cámara
const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
camera.position.set(0, 1, 5);
camera.lookAt(0, 0, 0);

// Renderizador del modelo
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});

// Escena del modelo 3D
const scene = createScene();

/**
 * Crear la escena y el render y añadirlo al dom
 * @returns {THREE.Scene} escena creada
 */
function createScene() {
  const scene = new THREE.Scene();

  renderer.setSize(500, 500);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.backgroundColor = "transparent";

  // Añadir el mockup al canvas en el DOM
  const container = document.getElementById("canvas-container");
  container.appendChild(renderer.domElement);

  // Añadir efectos de iluminación
  addLights(scene);
  return scene;
}

/**
 * Actualiza la textura del modelo con una de las texturas precargadas
 * @param {string} image URL de la imagen a usar como textura.
 */
window.changeModelTexture = function (image) {
  const loader = new THREE.TextureLoader();
  const texture = loader.load(image);

  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  texturedMaterials.forEach((material) => {
    material.map = texture;
    material.color.set(0xffffff);
    material.needsUpdate = true;
  });
}

/**
 * Añade la iluminación a la escena del mockup para añadir más realismo
 * @param {THREE.Scene<THREE.Object3DEventMap>} scene Escena del mockup
 */
function addLights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1);

  keyLight.position.set(0, 10, 5);
  keyLight.castShadow = true;

  keyLight.shadow.camera.left = -40;
  keyLight.shadow.camera.right = 40;
  keyLight.shadow.camera.top = 40;
  keyLight.shadow.camera.bottom = -40;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 100;

  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.bias = -0.0005;

  scene.add(keyLight);

  const sideLight = new THREE.DirectionalLight(0xffffff, 0.5);
  sideLight.position.set(-5, 3, 5);
  scene.add(sideLight);

  const rimLight = new THREE.PointLight(0xaaaaaa, 0.4);
  rimLight.position.set(0, 2, -5);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0xcccccc, 0.3);
  fillLight.position.set(0, -3, 0);
  scene.add(fillLight);
}

/**
 * Inicializa toda la lógica al cargar el DOM
 */
function init() {
  startLoader();

  const loader = new GLTFLoader();
  loader.load(
    "./scene.gltf",

    (gltf) => {
      model = gltf.scene;

      model.scale.set(0.007, 0.007, 0.007);
      model.position.set(0, -9, 0);

      model.traverse((node) => {
        if (!node.isMesh) return;

        node.castShadow = true;
        node.receiveShadow = true;

        const materials = Array.isArray(node.material)
          ? node.material
          : [node.material];

        materials.forEach((material) => {
          if (material.map) {
            texturedMaterials.push(material);
          }
        });
      });

      scene.add(model);
      stopLoader();
    },

    undefined,

    (error) => {
      console.error("Error cargando GLTF:", error);
    },
  );
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

init();
animate();

let isDragging = false;
let previousMouseX = 0;

function enableModelRotation() {
  const canvas = renderer.domElement;

  canvas.addEventListener("mousedown", (e) => {
    isDragging = true;
    previousMouseX = e.clientX;
  });

  canvas.addEventListener("mouseup", () => {
    isDragging = false;
  });

  canvas.addEventListener("mouseleave", () => {
    isDragging = false;
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isDragging || !model) return;

    const deltaX = e.clientX - previousMouseX;
    previousMouseX = e.clientX;

    // Ajusta la sensibilidad
    const rotationSpeed = 0.005;

    model.rotation.y += deltaX * rotationSpeed;
  });
}

enableModelRotation();
