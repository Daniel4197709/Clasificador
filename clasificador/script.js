// URL del modelo Teachable Machine exportado
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/DrlS9wpXm/";

let model = null;
let webcam = null;
let isWebcamRunning = false;
let animationFrameId = null;

// Elementos del DOM
const statusPill = document.getElementById("model-status");
const statusText = document.getElementById("status-text");

// Tabs
const tabUpload = document.getElementById("tab-upload");
const tabWebcam = document.getElementById("tab-webcam");
const uploadContainer = document.getElementById("upload-container");
const webcamContainer = document.getElementById("webcam-container");

// Subida de imagen
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const dropContent = document.getElementById("drop-content");
const imagePreview = document.getElementById("image-preview");
const uploadActions = document.getElementById("upload-actions");
const btnRemoveImg = document.getElementById("btn-remove-img");

// Cámara web
const webcamPlaceholder = document.getElementById("webcam-placeholder");
const webcamVideoBox = document.getElementById("webcam-video-box");
const btnToggleWebcam = document.getElementById("btn-toggle-webcam");

// Resultados
const topPredictionCard = document.getElementById("top-prediction-card");
const topClassName = document.getElementById("top-class-name");
const topClassProb = document.getElementById("top-class-prob");
const labelContainer = document.getElementById("label-container");

// 1. Cargar el modelo al iniciar
async function initModel() {
  try {
    statusPill.className = "status-pill loading";
    statusText.textContent = "Cargando modelo de IA...";

    const modelJSON = MODEL_URL + "model.json";
    const metadataJSON = MODEL_URL + "metadata.json";

    model = await tmImage.load(modelJSON, metadataJSON);

    statusPill.className = "status-pill ready";
    statusText.textContent = "Modelo listo";
    btnToggleWebcam.disabled = false;

    console.log("Modelo cargado con éxito. Clases:", model.getTotalClasses());
  } catch (error) {
    console.error("Error al cargar el modelo:", error);
    statusPill.className = "status-pill error";
    statusText.textContent = "Error al cargar modelo";
    labelContainer.innerHTML = `<p class="placeholder-text" style="color: #ef4444;">
      No se pudo cargar el modelo. Verifica tu conexión a internet o la URL del modelo.
    </p>`;
  }
}

// 2. Control de Pestañas (Subir Imagen vs Cámara)
tabUpload.addEventListener("click", () => {
  if (tabUpload.classList.contains("active")) return;
  tabUpload.classList.add("active");
  tabWebcam.classList.remove("active");
  uploadContainer.classList.add("active");
  webcamContainer.classList.remove("active");

  stopWebcam();
  if (imagePreview.src && !imagePreview.classList.contains("hidden")) {
    predictImage(imagePreview);
  } else {
    resetResults();
  }
});

tabWebcam.addEventListener("click", () => {
  if (tabWebcam.classList.contains("active")) return;
  tabWebcam.classList.add("active");
  tabUpload.classList.remove("active");
  webcamContainer.classList.add("active");
  uploadContainer.classList.remove("active");

  resetResults();
});

// 3. Lógica para Subir Imagen
dropZone.addEventListener("click", (e) => {
  if (e.target !== btnRemoveImg) {
    fileInput.click();
  }
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleImageFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener("change", (e) => {
  if (e.target.files && e.target.files[0]) {
    handleImageFile(e.target.files[0]);
  }
});

btnRemoveImg.addEventListener("click", (e) => {
  e.stopPropagation();
  fileInput.value = "";
  imagePreview.src = "";
  imagePreview.classList.add("hidden");
  dropContent.classList.remove("hidden");
  uploadActions.classList.add("hidden");
  resetResults();
});

function handleImageFile(file) {
  if (!file.type.startsWith("image/")) {
    alert("Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    imagePreview.classList.remove("hidden");
    dropContent.classList.add("hidden");
    uploadActions.classList.remove("hidden");

    imagePreview.onload = () => {
      predictImage(imagePreview);
    };
  };
  reader.readAsDataURL(file);
}

// Clasificar imagen estática
async function predictImage(imgElement) {
  if (!model) return;

  statusText.textContent = "Clasificando imagen...";
  try {
    const predictions = await model.predict(imgElement);
    renderPredictions(predictions);
    statusText.textContent = "Modelo listo";
  } catch (err) {
    console.error("Error al predecir imagen:", err);
  }
}

// 4. Lógica de Cámara Web
btnToggleWebcam.addEventListener("click", async () => {
  if (isWebcamRunning) {
    stopWebcam();
  } else {
    await startWebcam();
  }
});

async function startWebcam() {
  if (!model) return;

  try {
    btnToggleWebcam.disabled = true;
    btnToggleWebcam.innerHTML = "<span>Iniciando cámara...</span>";

    const flip = true; // Efecto espejo
    const width = 360;
    const height = 360;

    webcam = new tmImage.Webcam(width, height, flip);
    await webcam.setup(); // Solicita permisos al navegador
    await webcam.play();

    webcamVideoBox.innerHTML = "";
    webcamVideoBox.appendChild(webcam.canvas);
    webcamPlaceholder.classList.add("hidden");

    isWebcamRunning = true;
    btnToggleWebcam.disabled = false;
    btnToggleWebcam.innerHTML = "<span>Detener Cámara</span>";
    btnToggleWebcam.style.background = "#ef4444";

    loopWebcam();
  } catch (error) {
    console.error("Error al acceder a la cámara:", error);
    alert("No se pudo acceder a la cámara web. Asegúrate de otorgar los permisos necesarios.");
    btnToggleWebcam.disabled = false;
    btnToggleWebcam.innerHTML = "<span>Activar Cámara</span>";
    btnToggleWebcam.style.background = "";
  }
}

function stopWebcam() {
  if (webcam && isWebcamRunning) {
    webcam.stop();
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  }
  isWebcamRunning = false;
  webcamVideoBox.innerHTML = "";
  webcamPlaceholder.classList.remove("hidden");
  btnToggleWebcam.innerHTML = "<span>Activar Cámara</span>";
  btnToggleWebcam.style.background = "";
}

async function loopWebcam() {
  if (!isWebcamRunning) return;

  webcam.update(); // Actualiza el frame de la cámara
  await predictWebcam();
  animationFrameId = requestAnimationFrame(loopWebcam);
}

async function predictWebcam() {
  if (!model || !webcam) return;
  const predictions = await model.predict(webcam.canvas);
  renderPredictions(predictions);
}

// 5. Renderizar Resultados
function renderPredictions(predictions) {
  if (!predictions || predictions.length === 0) return;

  // Ordenar de mayor a menor probabilidad
  const sorted = [...predictions].sort((a, b) => b.probability - a.probability);
  const top = sorted[0];

  // Actualizar tarjeta destacada
  topPredictionCard.classList.remove("empty");
  topClassName.textContent = top.className;
  const topPercent = (top.probability * 100).toFixed(1);
  topClassProb.textContent = `${topPercent}% de probabilidad`;

  // Renderizar la lista de todas las clases
  labelContainer.innerHTML = "";

  sorted.forEach((item, index) => {
    const percent = (item.probability * 100).toFixed(1);
    const isTop = index === 0;

    const row = document.createElement("div");
    row.className = `prediction-item ${isTop ? "is-top" : ""}`;
    row.innerHTML = `
      <div class="item-header">
        <span class="item-name">${item.className}</span>
        <span class="item-prob">${percent}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: ${percent}%;"></div>
      </div>
    `;
    labelContainer.appendChild(row);
  });
}

function resetResults() {
  topPredictionCard.classList.add("empty");
  topClassName.textContent = "-";
  topClassProb.textContent = "0% de confianza";
  labelContainer.innerHTML = `
    <p class="placeholder-text">Carga una foto o enciende la cámara para ver la clasificación en vivo.</p>
  `;
}

// Iniciar carga del modelo al cargar la página
window.addEventListener("DOMContentLoaded", initModel);
