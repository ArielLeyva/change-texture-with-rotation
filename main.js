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

// Índice de la textura aplicada al modelo
let currentTextureIndex = 0;

// Capas de gradiente para transición suave
let gradientOld = document.getElementById("gradient-old");
let gradientNew = document.getElementById("gradient-new");

// Renderizador del modelo
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});

// Escena del modelo 3D
const scene = createScene();

// Texturas a aplicar en el modelo
const textures = loadTextures();

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
 * Precarga las texturas a aplicar en el modelo
 * @returns {THREE.Texture<HTMLImageElement, THREE.TextureEventMap>[]} texturas cargadas
 */
function loadTextures() {
  const textureLoader = new THREE.TextureLoader();
  const textures = [
    textureLoader.load("./textures/material_baseColor.png"),
    textureLoader.load("./textures/material_baseColor-3.png"),
    textureLoader.load("./textures/material_baseColor-4.png"),
    textureLoader.load("./textures/material_baseColor-5.png"),
    textureLoader.load("./textures/material_baseColor-6.png"),
    textureLoader.load("./textures/material_baseColor-7.png"),
    textureLoader.load("./textures/material_baseColor-8.png"),
  ];
  textures.forEach((texture) => {
    // Rotar la textura para ajustarla al modelo
    texture.flipY = false;
    // Ajustar color de fondo de la textura
    texture.colorSpace = THREE.SRGBColorSpace;
  });
  return textures;
}

/**
 * Actualiza la textura del modelo con una de las texturas precargadas
 * @param {number} index índice de la textura precargada
 */
function changeModelTexture(index) {
  const texture = textures[index];

  if (!texture) return;

  texturedMaterials.forEach((material) => {
    material.map = texture;
    material.color.set(0xffffff);
    material.needsUpdate = true;
  });

  updateGradient(index);
}

/**
 * Actualizar el gradiente de fondo de la página
 * @param {number} index Ídince del gradiente a aplicar
 */
function updateGradient(index) {
  gradientNew.className = "gradient-layer";
  gradientNew.classList.add(`gradient-${index}`);
  gradientNew.style.zIndex = "-1";
  gradientNew.style.opacity = "1";

  gradientOld.style.opacity = "0";

  // Cuando termina la transición, gradientOld se prepara para la próxima
  setTimeout(() => {
    gradientOld.className = "gradient-layer";
    gradientOld.classList.add(`gradient-${index}`);
    gradientOld.style.zIndex = "-2";
    gradientOld.style.opacity = "1";

    // Swap: ahora gradientOld es el visible, gradientNew es el que se desvanece
    const temp = gradientOld;
    gradientOld = gradientNew;
    gradientNew = temp;
  }, 400);
}

// Animación del modelo
let currentSpeed = 0.04;
let rotation = 0;
/**
 * Rota el modelo sobre el eje Y
 */
function animate() {
  requestAnimationFrame(animate);

  if (model) {
    // Modifica la velocidad del rotación del modelo a razón de una función de interpolación
    const angle = model.rotation.y;
    const raw = Math.cos(angle);
    const factor = Math.max(0, raw);
    const targetSpeed = 0.001 + (1 - factor) * (0.04 - 0.001);
    currentSpeed = THREE.MathUtils.lerp(currentSpeed, targetSpeed, 0.05);
    model.rotation.y += currentSpeed;

    // Acumulamos la rotación
    rotation += currentSpeed;

    // Verificar si la rotación del modelo es mayor a 180º (el modelo está dado vuelta)
    if (rotation >= Math.PI) {
      rotation -= Math.PI * 2;
      currentTextureIndex = (currentTextureIndex + 1) % textures.length;
      changeModelTexture(currentTextureIndex);
    }
  }

  renderer.render(scene, camera);
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

      // Aplica la primera textura
      changeModelTexture(currentTextureIndex);
      stopLoader();
    },

    undefined,

    (error) => {
      console.error("Error cargando GLTF:", error);
    },
  );
}

init();
animate();