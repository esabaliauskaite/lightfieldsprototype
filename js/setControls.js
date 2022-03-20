export function setCameraX(camera) {
  camera.position.x = document.getElementById("CameraXInput").value;
  document
    .getElementById("CameraXInput")
    .style.setProperty("--value", camera.position.x);
  document.getElementById("CameraXamount").value =
    document.getElementById("CameraXInput").value;
}

export function setCameraY(camera) {
  camera.position.y = document.getElementById("CameraYInput").value;
  document
    .getElementById("CameraYInput")
    .style.setProperty("--value", camera.position.y);
  document.getElementById("CameraYamount").value =
    document.getElementById("CameraYInput").value;
}

export function setCameraZ(camera) {
  camera.position.z = document.getElementById("CameraZInput").value;
  document
    .getElementById("CameraZInput")
    .style.setProperty("--value", camera.position.z);
  document.getElementById("CameraZamount").value =
    document.getElementById("CameraZInput").value;
}

export function setFOV(camera) {
  camera.fov = document.getElementById("FOVAmount").value;
  camera.updateProjectionMatrix();
}
