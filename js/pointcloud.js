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

let city = "./data/pcd/ciudadortogonal.26.pcd";
let forest = "./data/pcd/Forest.pcd";

const loader = new PCDLoader();

renderPointCloud1();

function renderPointCloud1() {
  document.getElementById("PC2").classList.remove("clicked");
  document.getElementById("PC1").classList.add("clicked");
  loader.load(
    city,
    function (mesh) {
      document.getElementById("canvas").style.display = "block";
      document.getElementById("loader").style.display = "none";
      scene.clear();
      mesh.material.color.setHex(0xff7b00);
      scene.add(mesh);
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      document.getElementById("loader").style.display = "block";
      document.getElementById("canvas").style.display = "none";
    },
    function (error) {
      console.log("An error happened");
    }
  );
}

function renderPointCloud2() {
  document.getElementById("PC2").classList.add("clicked");
  document.getElementById("PC1").classList.remove("clicked");
  loader.load(
    forest,
    function (mesh) {
      document.getElementById("canvas").style.display = "block";
      document.getElementById("loader").style.display = "none";
      scene.clear();
      mesh.material.color.setHex(0xa7c957);
      scene.add(mesh);
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      document.getElementById("loader").style.display = "block";
      document.getElementById("canvas").style.display = "none";
    },
    function (error) {
      console.log("An error happened");
    }
  );
}

function Resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
  document.getElementById("PC1").addEventListener("click", renderPointCloud1);
  document.getElementById("PC2").addEventListener("click", renderPointCloud2);
  Resize();
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

render();