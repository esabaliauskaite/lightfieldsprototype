import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass";
import { addLight } from "./light";
import { addGUI } from "./gui";

var scene = new THREE.Scene();

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor("#e5e5e5");
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.physicallyCorrectLights = true;

var camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 2;

document.body.appendChild(renderer.domElement);

const renderPass = new RenderPass(scene, camera);

const bokehPass = new BokehPass(scene, camera, {
  focus: 1.0,
  aperture: 0.025,
  maxblur: 0.01,

  width: window.innerWidth,
  height: window.innerHeight,
});

const composer = new EffectComposer(renderer);

composer.addPass(renderPass);
composer.addPass(bokehPass);

renderer.render(scene, camera);

var geo = new THREE.PlaneBufferGeometry(2, 2, 4, 4);
var img = new THREE.MeshBasicMaterial({
  map: new THREE.TextureLoader().load("css/texture.jpg"),
});
img.side = THREE.DoubleSide;
var plane = new THREE.Mesh(geo, img);

scene.add(plane);

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

var render = function () {
  requestAnimationFrame(render);
  composer.render(0.1);
};

addGUI(plane, camera, bokehPass);
addLight(scene);

render();
