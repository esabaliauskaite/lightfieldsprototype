import * as THREE from "three";

export function addLight(scene) {
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 0, 25);
  scene.add(directionalLight);
}
