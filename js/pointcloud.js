import * as THREE from "https://cdn.skypack.dev/three@0.130.1/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.130.1/examples/jsm/controls/OrbitControls.js";
import { PCDLoader } from "https://cdn.skypack.dev/three@0.130.1/examples/jsm/loaders/PCDLoader.js";
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.z = 60;
camera.position.y = -5;
camera.position.x = -3;

const controls = new OrbitControls(camera, renderer.domElement);

const light = new THREE.AmbientLight(0x404040);
scene.add(light);

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

let city = "./data/pcd/ciudadortogonal.26.pcd";
let forest = "./data/pcd/Forest.pcd";

const loader = new PCDLoader();

renderPointCloud1();

function renderPointCloud1() {
  loader.load(
    city,
    function (mesh) {
      scene.clear();
      mesh.material.color.setHex(0xff7b00);
      scene.add(mesh);
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    function (error) {
      console.log("An error happened");
    }
  );
}

function renderPointCloud2() {
  loader.load(
    forest,
    function (mesh) {
      scene.clear();
      mesh.material.color.setHex(0xa7c957);
      scene.add(mesh);
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    function (error) {
      console.log("An error happened");
    }
  );
}

function render() {
  document.getElementById("1").addEventListener("click", renderPointCloud1);
  document.getElementById("2").addEventListener("click", renderPointCloud2);

  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

render();
