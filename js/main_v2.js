import * as THREE from "https://cdn.skypack.dev/three@0.130.1/build/three.module.js";
import { OBJLoader } from "https://cdn.skypack.dev/three@0.130.1/examples/jsm/loaders/OBJLoader.js";
import { PLYLoader } from "https://cdn.skypack.dev/three@0.130.1/examples/jsm/loaders/PLYLoader.js";

import vertexScreen from "./shaders/vertexScreen.js";
import fragmentScreen from "./shaders/fragmentScreen.js";
import vertex from "./shaders/vertex.js";
import fragment from "./shaders/fragment.js";
import { cameraHelperArray } from "./modules/cameraHelperArray.js";
import { FlyControls } from "./modules/flyControls.js";
import {
  renderLightField1,
  renderLightField2,
  renderLightField3,
} from "./renderLF.js";

// # Debug Scene ##
const imgURL = "./data/tutorial/";
const poseURL = "./data/tutorial/tutorial_poses.json";
const singleImageFov = 60; // degrees
let debugply = "./data/tutorial/blender.ply";

// # Forest Scene ##
const ForestimgURL = "./data/forestV2/";
const ForestposeURL = "./data/forestV2/poses.json";
const ForestsingleImageFov = 35; // degrees
let forest = "./data/forestV2/forest.ply";

// # City Scene ##
const CityURL = "./data/cityV2/";
const CityPoseURL = "./data/cityV2/city_poses.json";
const CityingleImageFov = 35; // degrees
let City = "./data/cityV2/city.ply";

const bgColor = new THREE.Color(0x0f0f0f);
const debugbgColor = new THREE.Color(0, 0, 0);
let quat = new THREE.Quaternion();
const demURL = "./data/zero_plane.obj";

const textureLoader = new THREE.TextureLoader();
const loader = new OBJLoader();
const plyLoader = new PLYLoader();

const views = {
  main: {
    left: 0,
    bottom: 0,
    width: 1.0,
    height: 1.0,
    background: bgColor,
    eye: [0, 0, 20],
    up: [0, 1, 0],
    fov: 60,
  },
  debug: {
    left: 0,
    bottom: 0.8,
    width: 0.15,
    height: 0.2,
    background: debugbgColor,
    eye: [0, -10, 90],
    up: [0, -1, 0],
    fov: 60,
  },
};

const mainView = views.main;
const debugView = views.debug;
let scene, renderer, dem, demScene;
let pointCloud = null;

let singleImageMaterials = new Array();
let ForestsingleImageMaterials = new Array();
let CitySingleImageMaterials = new Array();

let cameraArrayHelper = new Array();
let ForestcameraArrayHelper = new Array();
let CityCameraArrayHelper = new Array();

let sceneGeometries = [];
let rtTarget;
let rtScene;
let mainCamera, debugCamera, mainControls;
let axesHelper, cameraHelper;
let windowWidth, windowHeight;
let url = new URL(window.location);
let searchParams = new URLSearchParams(url.search);
let currentScene = searchParams.get("scene");

function createProjectiveMaterial(projCamera, tex = null) {
  var material = new THREE.ShaderMaterial({
    uniforms: {
      baseColor: {
        value: new THREE.Color(0xcccccc),
      },
      cameraMatrix: {
        type: "m4",
        value: projCamera.matrixWorldInverse,
      },
      projMatrix: {
        type: "m4",
        value: projCamera.projectionMatrix,
      },
      myTexture: {
        value: tex,
      },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
    side: THREE.DoubleSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    blendDst: THREE.OneFactor,
    blendSrc: THREE.OneFactor,
  });

  return material;
}

function createViewMaterial(texture) {
  const materialScreen = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: texture },
    },
    vertexShader: vertexScreen,
    fragmentShader: fragmentScreen,
    depthWrite: true,
    transparent: true,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
  });

  return materialScreen;
}

async function fetchPosesJSON(url) {
  const response = await fetch(url);
  const poses = await response.json();
  return poses;
}

fetchPosesJSON(poseURL).then((poses) => {
  if (!("images" in poses)) {
    console.log(
      `An error happened when loading JSON poses. Property images is not present.`
    );
  }
  const positions = new Array();
  for (const pose of poses.images) {
    const useLegacy = !(
      pose.hasOwnProperty("location") && pose.hasOwnProperty("rotation")
    );
    let pos = new THREE.Vector3();
    let quat = new THREE.Quaternion();
    let scale = new THREE.Vector3();

    if (useLegacy) {
      const M = pose.M3x4;
      let matrix = new THREE.Matrix4();
      matrix.set(
        M[0][0],
        M[0][1],
        M[0][2],
        M[0][3],
        M[1][0],
        M[1][1],
        M[1][2],
        M[1][3],
        M[2][0],
        M[2][1],
        M[2][2],
        M[2][3],
        0,
        0,
        0,
        1
      );
      matrix.decompose(pos, quat, scale);
    } else {
      pos.fromArray(pose.location);
      quat.x = pose.rotation[0];
      quat.y = pose.rotation[1];
      quat.z = pose.rotation[2];
      quat.w = pose.rotation[3];
    }
    pos.z = pos.z;

    positions.push(pos);
    const camera = new THREE.PerspectiveCamera(singleImageFov, 1.0, 0.5, 10000);
    camera.position.copy(pos);
    camera.applyQuaternion(quat);

    let url = imgURL + pose.imagefile;
    const tex = textureLoader.load(url);
    const singleImageMaterial = createProjectiveMaterial(camera, tex);
    singleImageMaterials.push(singleImageMaterial);
    if (dem) {
      dem.material = singleImageMaterial;
    }
    const helper = new cameraHelperArray(camera);
    scene.add(helper);
    helper.visible = false;
    cameraArrayHelper.push(helper);
    scene.add(camera);
  }
});

fetchPosesJSON(ForestposeURL).then((poses) => {
  if (!("images" in poses)) {
    console.log(
      `An error happened when loading JSON poses. Property images is not present.`
    );
  }
  const positions = new Array();
  for (const pose of poses.images) {
    const useLegacy = !(
      pose.hasOwnProperty("location") && pose.hasOwnProperty("rotation")
    );
    let pos = new THREE.Vector3();
    let scale = new THREE.Vector3();

    if (useLegacy) {
      const M = pose.M3x4;
      let matrix = new THREE.Matrix4();
      matrix.set(
        M[0][0],
        M[0][1],
        M[0][2],
        M[0][3],
        M[1][0],
        M[1][1],
        M[1][2],
        M[1][3],
        M[2][0],
        M[2][1],
        M[2][2],
        M[2][3],
        0,
        0,
        0,
        1
      );
      matrix.decompose(pos, quat, scale);
      pos.x = -pos.x;
    } else {
      pos.fromArray(pose.location);
      quat.x = pose.rotation[0];
      quat.y = pose.rotation[1];
      quat.z = pose.rotation[2];
      quat.w = pose.rotation[3];
    }

    //pos.z = -pos.z;
    positions.push(pos);

    const camera = new THREE.PerspectiveCamera(
      ForestsingleImageFov,
      1.0,
      0.5,
      10000
    );
    camera.position.copy(pos);
    camera.applyQuaternion(quat);

    let url = ForestimgURL + pose.imagefile;
    const tex = textureLoader.load(url);
    const ForestsingleImageMaterial = createProjectiveMaterial(camera, tex);
    ForestsingleImageMaterials.push(ForestsingleImageMaterial);
    if (dem) {
      dem.material = ForestsingleImageMaterial;
    }
    const helper = new cameraHelperArray(camera);
    scene.add(helper);
    helper.visible = false;
    ForestcameraArrayHelper.push(helper);
    scene.add(camera);
  }
});

fetchPosesJSON(CityPoseURL).then((poses) => {
  if (!("images" in poses)) {
    console.log(
      `An error happened when loading JSON poses. Property images is not present.`
    );
  }
  const positions = new Array();
  for (const pose of poses.images) {
    const useLegacy = !(
      pose.hasOwnProperty("location") && pose.hasOwnProperty("rotation")
    );
    let pos = new THREE.Vector3();
    let scale = new THREE.Vector3();

    if (useLegacy) {
      const M = pose.M3x4;
      let matrix = new THREE.Matrix4();
      matrix.set(
        M[0][0],
        M[0][1],
        M[0][2],
        M[0][3],
        M[1][0],
        M[1][1],
        M[1][2],
        M[1][3],
        M[2][0],
        M[2][1],
        M[2][2],
        M[2][3],
        0,
        0,
        0,
        1
      );
      matrix.decompose(pos, quat, scale);
      pos.x = -pos.x;
    } else {
      pos.fromArray(pose.location);
      quat.x = pose.rotation[0];
      quat.y = pose.rotation[1];
      quat.z = pose.rotation[2];
      quat.w = pose.rotation[3];
    }

    //pos.z = -pos.z;
    positions.push(pos);

    const camera = new THREE.PerspectiveCamera(
      CityingleImageFov,
      1.0,
      0.5,
      10000
    );
    camera.position.copy(pos);
    camera.applyQuaternion(quat);

    let url = CityURL + pose.imagefile;
    const tex = textureLoader.load(url);
    const CitySingleImageMaterial = createProjectiveMaterial(camera, tex);
    CitySingleImageMaterials.push(CitySingleImageMaterial);
    if (dem) {
      dem.material = CitySingleImageMaterial;
    }
    const helper = new cameraHelperArray(camera);
    scene.add(helper);
    helper.visible = false;
    CityCameraArrayHelper.push(helper);
    scene.add(camera);
  }
});

loader.load(
  demURL,
  function (object) {
    dem = object.children[0];
    dem.scale.fromArray([1, 1, -1]);
    //scene.add(dem);
    dem.position.z = -4;
    document.getElementById("Focusamount").value = dem.position.z;
    document.getElementById("FocusInput").value = dem.position.z;
    focus = dem.position.z;
    sceneGeometries.push(dem);
    rtScene.add(dem);

    // create a copy of the dem for rendering
    demScene = dem.clone();
    //demScene.position.set(dem.position);
    demScene.material = createViewMaterial(rtTarget.texture);
    scene.add(demScene);
  },
  function () {},
  function () {
    console.log(`An error happened when loading ${demURL}`);
  }
);

init();
render();

function init() {
  scene = new THREE.Scene();
  rtScene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  axesHelper = new THREE.AxesHelper(25);
  scene.add(axesHelper);

  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 0, 1);
  scene.add(light);

  mainCamera = new THREE.PerspectiveCamera(
    mainView.fov,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  mainCamera.position.fromArray(mainView.eye);
  mainCamera.up.fromArray(mainView.up);
  mainView.camera = mainCamera;

  document.getElementById("FOVAmount").value = mainCamera.fov;

  document.getElementById("CameraXInput").value = mainCamera.position.x;
  document.getElementById("CameraYInput").value = mainCamera.position.y;
  document.getElementById("CameraZInput").value = mainCamera.position.z;

  document.getElementById("CameraXamount").value = mainCamera.position.x;
  document.getElementById("CameraYamount").value = mainCamera.position.y;
  document.getElementById("CameraZamount").value = mainCamera.position.z;

  //controls for user
  mainControls = new FlyControls(mainCamera, renderer.domElement);
  mainControls.dragToLook = true;

  cameraHelper = new THREE.CameraHelper(mainCamera);
  scene.add(cameraHelper);

  debugCamera = new THREE.PerspectiveCamera(
    debugView.fov,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  debugCamera.position.fromArray(debugView.eye);
  debugCamera.up.fromArray(debugView.up);
  debugView.camera = debugCamera;

  rtTarget = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    }
  );

  document.getElementById("CameraOrrientationX").value = mainView.up[0];
  document.getElementById("CameraOrrientationY").value = mainView.up[1];
  document.getElementById("CameraOrrientationZ").value = mainView.up[2];

  document.body.appendChild(renderer.domElement);

  document.getElementById("TUTORIAL").classList.add("clicked");
}

function Resize() {
  if (windowWidth != window.innerWidth || windowHeight != window.innerHeight) {
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    renderer.setSize(windowWidth, windowHeight);
  }
}

function setFocus() {
  dem.position.z = document.getElementById("FocusInput").value;
  demScene.position.z = dem.position.z;
  document
    .getElementById("FocusInput")
    .style.setProperty("--value", dem.position.z);
  document.getElementById("Focusamount").value =
    document.getElementById("FocusInput").value;
}

function setFOV() {
  mainCamera.fov = document.getElementById("FOVAmount").value;
  mainCamera.updateProjectionMatrix();
}

function setCameraX() {
  mainCamera.position.x = parseFloat(
    document.getElementById("CameraXInput").value
  );
  document
    .getElementById("CameraXInput")
    .style.setProperty("--value", mainCamera.position.x);
  document.getElementById("CameraXamount").value =
    document.getElementById("CameraXInput").value;
}
function setCameraY() {
  mainCamera.position.y = parseFloat(
    document.getElementById("CameraYInput").value
  );
  document
    .getElementById("CameraYInput")
    .style.setProperty("--value", mainCamera.position.y);
  document.getElementById("CameraYamount").value =
    document.getElementById("CameraYInput").value;
}
function setCameraZ() {
  mainCamera.position.z = parseFloat(
    document.getElementById("CameraZInput").value
  );
  document
    .getElementById("CameraZInput")
    .style.setProperty("--value", mainCamera.position.z);
  document.getElementById("CameraZamount").value =
    document.getElementById("CameraZInput").value;
}

function renderPointCloud() {
  if (document.getElementById("FOREST").classList.contains("clicked")) {
    if (pointCloud) {
      pointCloud.parent.remove(pointCloud);
    }
    plyLoader.load(
      forest,
      function (geometry) {
        document.getElementById("loadedScene").style.display = "block";
        document.getElementById("loader").style.display = "none";
        const material = new THREE.PointsMaterial({
          size: 0.03,
          vertexColors: true,
        });
        const mesh = new THREE.Points(geometry, material);
        mesh.geometry.scale(0.9, 0.9, 1.0);
        mesh.geometry.rotateY(3.14159);
        mesh.geometry.rotateZ(4.71239);
        mesh.geometry.translate(0.0, 1.0, 7.0);
        scene.add(mesh);
        if (document.getElementById("PCView").checked == true) {
          mesh.visible = true;
        }
        if (document.getElementById("PCView").checked == false) {
          mesh.visible = false;
        }

        pointCloud = mesh;
      },
      function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        document.getElementById("loader").style.display = "block";
        document.getElementById("loadedScene").style.display = "none";
      },
      function (error) {
        console.log("An error happened");
      }
    );
  } else if (
    document.getElementById("TUTORIAL").classList.contains("clicked")
  ) {
    if (pointCloud) {
      pointCloud.parent.remove(pointCloud);
    }
    plyLoader.load(
      debugply,
      function (geometry) {
        document.getElementById("loadedScene").style.display = "block";
        document.getElementById("loader").style.display = "none";
        const material = new THREE.PointsMaterial({
          size: 0.01,
          vertexColors: true,
        });
        const mesh = new THREE.Points(geometry, material);
        mesh.geometry.scale(0.2, 0.2, 0.2);
        mesh.geometry.rotateY(3.14159);
        mesh.geometry.rotateZ(3.14159);
        mesh.geometry.translate(0.5, 0.02, 0.5);
        scene.add(mesh);
        if (document.getElementById("PCView").checked == true) {
          mesh.visible = true;
        }
        if (document.getElementById("PCView").checked == false) {
          mesh.visible = false;
        }

        pointCloud = mesh;
      },
      function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        document.getElementById("loader").style.display = "block";
        document.getElementById("loadedScene").style.display = "none";
      },
      function (error) {
        console.log("An error happened");
      }
    );
  } else if (document.getElementById("CITY").classList.contains("clicked")) {
    if (pointCloud) {
      pointCloud.parent.remove(pointCloud);
    }
    plyLoader.load(
      City,
      function (geometry) {
        document.getElementById("loadedScene").style.display = "block";
        document.getElementById("loader").style.display = "none";
        const material = new THREE.PointsMaterial({
          size: 0.01,
          vertexColors: true,
        });
        const mesh = new THREE.Points(geometry, material);
        mesh.geometry.scale(20.0, 20.0, 1.0);
        mesh.geometry.rotateY(3.14159);
        mesh.geometry.rotateZ(3.14159);
        mesh.geometry.translate(115.0, -25.0, 0.0);
        scene.add(mesh);
        if (document.getElementById("PCView").checked == true) {
          mesh.visible = true;
        }
        if (document.getElementById("PCView").checked == false) {
          mesh.visible = false;
        }

        pointCloud = mesh;
      },
      function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        document.getElementById("loader").style.display = "block";
        document.getElementById("loadedScene").style.display = "none";
      },
      function (error) {
        console.log("An error happened");
      }
    );
  }
}

async function LF1(renderLightField1) {
  if (document.querySelector("#FOREST").classList.contains("clicked")) {
    renderLightField1();
    for (let i = 0; i < ForestsingleImageMaterials.length; i++) {
      dem.material = ForestsingleImageMaterials[i];
      renderer.render(rtScene, views.main.camera);
    }
  }
}

async function LF2(renderLightField2) {
  if (document.querySelector("#TUTORIAL").classList.contains("clicked")) {
    renderLightField2();
    for (let i = 0; i < singleImageMaterials.length; i++) {
      dem.material = singleImageMaterials[i];
      renderer.render(rtScene, views.main.camera);
    }
  }
}

async function LF3(renderLightField3) {
  if (document.querySelector("#CITY").classList.contains("clicked")) {
    renderLightField3();
    for (let i = 0; i < CitySingleImageMaterials.length; i++) {
      dem.material = CitySingleImageMaterials[i];
      renderer.render(rtScene, views.main.camera);
    }
  }
}

async function LF1Pinhole() {
  if (
    document.querySelector("#FOREST").classList.contains("clicked") &&
    document.getElementById("PinholeView").checked
  ) {
    renderer.clear();
    mainCamera.fov = singleImageFov;
    document.getElementById("PinholeInput").min = 0;
    document.getElementById("PinholeInput").max =
      ForestsingleImageMaterials.length - 1;
    dem.material =
      ForestsingleImageMaterials[document.getElementById("PinholeInput").value];
    renderer.render(rtScene, mainCamera);
    for (let e of document.querySelectorAll(
      'input[type="range"].styled-slider'
    )) {
      e.style.setProperty("--value", e.value);
      e.style.setProperty("--min", e.min == "" ? "-100" : e.min);
      e.style.setProperty("--max", e.max == "" ? "100" : e.max);
      e.addEventListener("input", () =>
        e.style.setProperty("--value", e.value)
      );
    }
  }
}

async function LF2Pinhole() {
  if (
    document.querySelector("#TUTORIAL").classList.contains("clicked") &&
    document.getElementById("PinholeView").checked
  ) {
    renderer.clear();
    mainCamera.fov = singleImageFov;
    document.getElementById("PinholeInput").min = 0;
    document.getElementById("PinholeInput").max =
      singleImageMaterials.length - 1;
    dem.material =
      singleImageMaterials[document.getElementById("PinholeInput").value];
    renderer.render(rtScene, mainCamera);
    for (let e of document.querySelectorAll(
      'input[type="range"].styled-slider'
    )) {
      e.style.setProperty("--value", e.value);
      e.style.setProperty("--min", e.min == "" ? "-100" : e.min);
      e.style.setProperty("--max", e.max == "" ? "100" : e.max);
      e.addEventListener("input", () =>
        e.style.setProperty("--value", e.value)
      );
    }
  }
}

async function LF3Pinhole() {
  if (
    document.querySelector("#CITY").classList.contains("clicked") &&
    document.getElementById("PinholeView").checked
  ) {
    renderer.clear();
    mainCamera.fov = CityingleImageFov;
    document.getElementById("PinholeInput").min = 0;
    document.getElementById("PinholeInput").max =
      CitySingleImageMaterials.length - 1;
    dem.material =
      CitySingleImageMaterials[document.getElementById("PinholeInput").value];
    renderer.render(rtScene, mainCamera);
    for (let e of document.querySelectorAll(
      'input[type="range"].styled-slider'
    )) {
      e.style.setProperty("--value", e.value);
      e.style.setProperty("--min", e.min == "" ? "-100" : e.min);
      e.style.setProperty("--max", e.max == "" ? "100" : e.max);
      e.addEventListener("input", () =>
        e.style.setProperty("--value", e.value)
      );
    }
  }
}

async function eventListeners() {
  document.getElementById("FocusInput").addEventListener("input", setFocus);
  document.getElementById("Focusamount").addEventListener("change", setFocus);
  document.getElementById("FOVAmount").addEventListener("input", setFOV);
  document.getElementById("CameraXInput").addEventListener("input", setCameraX);
  document.getElementById("CameraYInput").addEventListener("input", setCameraY);
  document.getElementById("CameraZInput").addEventListener("input", setCameraZ);
  document
    .getElementById("CameraXamount")
    .addEventListener("change", setCameraX);
  document
    .getElementById("CameraYamount")
    .addEventListener("change", setCameraY);
  document
    .getElementById("CameraZamount")
    .addEventListener("change", setCameraZ);
  document
    .getElementById("FOREST")
    .addEventListener("click", renderLightField1);
  document
    .getElementById("TUTORIAL")
    .addEventListener("click", renderLightField2);
  document.getElementById("CITY").addEventListener("click", renderLightField3);
  document.getElementById("FOREST").addEventListener("click", setValues);
  document.getElementById("TUTORIAL").addEventListener("click", setValues);
  document.getElementById("CITY").addEventListener("click", setValues);
  window.addEventListener("load", setFullValues);
  document.getElementById("PCView").addEventListener("click", renderPointCloud);
}

function setValues() {
  if (document.querySelector("#TUTORIAL").classList.contains("clicked")) {
    window.location.search = "?scene=Tutorial";
  }
  if (document.querySelector("#FOREST").classList.contains("clicked")) {
    window.location.search = "?scene=Forest";
  }
  if (document.querySelector("#CITY").classList.contains("clicked")) {
    window.location.search = "?scene=City";
  }
}

function setFullValues() {
  if (currentScene == "Tutorial") {
    document.getElementById("PCView").checked = false;
    document.getElementById("PinholeView").checked = false;
    dem.position.z = -4;
    document.getElementById("FocusInput").value = dem.position.z;
    demScene.position.z = dem.position.z;
    document
      .getElementById("FocusInput")
      .style.setProperty("--value", dem.position.z);
    document.getElementById("Focusamount").value =
      document.getElementById("FocusInput").value;
    mainCamera.position.z = 20.0;
    document.getElementById("CameraZInput").value = mainCamera.position.z;
    document.getElementById("CameraZInput").style.setProperty("--value", 20.0);
    document.getElementById("CameraZamount").value =
      document.getElementById("CameraZInput").value;
    mainCamera.fov = 60;
    document.getElementById("FOVAmount").value = mainCamera.fov;
    mainCamera.updateProjectionMatrix();
  } else if (currentScene == "Forest") {
    document.getElementById("PCView").checked = false;
    document.getElementById("PinholeView").checked = false;

    dem.position.z = -7;
    document.getElementById("FocusInput").value = dem.position.z;
    demScene.position.z = dem.position.z;
    document
      .getElementById("FocusInput")
      .style.setProperty("--value", dem.position.z);
    document.getElementById("Focusamount").value =
      document.getElementById("FocusInput").value;

    mainCamera.position.z = 20.0;
    document.getElementById("CameraZInput").value = mainCamera.position.z;
    document.getElementById("CameraZInput").style.setProperty("--value", 20.0);
    document.getElementById("CameraZamount").value =
      document.getElementById("CameraZInput").value;
    mainCamera.fov = 43.8;
    document.getElementById("FOVAmount").value = mainCamera.fov;
    mainCamera.updateProjectionMatrix();
  } else if (currentScene == "City") {
    document.getElementById("PCView").checked = false;
    document.getElementById("PinholeView").checked = false;

    dem.position.z = -45;
    document.getElementById("FocusInput").value = dem.position.z;
    demScene.position.z = dem.position.z;
    document
      .getElementById("FocusInput")
      .style.setProperty("--value", dem.position.z);
    document.getElementById("Focusamount").value =
      document.getElementById("FocusInput").value;

    mainCamera.position.z = 300.0;
    document.getElementById("CameraZInput").value = mainCamera.position.z;
    document.getElementById("CameraZInput").style.setProperty("--value", 300.0);
    document.getElementById("CameraZamount").value =
      document.getElementById("CameraZInput").value;
    mainCamera.position.y = -33.0;
    document.getElementById("CameraYInput").value = mainCamera.position.y;
    document.getElementById("CameraYInput").style.setProperty("--value", -33.0);
    document.getElementById("CameraYamount").value =
      document.getElementById("CameraZInput").value;
    mainCamera.position.x = 137.0;
    document.getElementById("CameraYInput").value = mainCamera.position.y;
    document.getElementById("CameraYInput").style.setProperty("--value", 137.0);
    document.getElementById("CameraYamount").value =
      document.getElementById("CameraZInput").value;
    mainCamera.fov = 43.8;
    document.getElementById("FOVAmount").value = mainCamera.fov;
    mainCamera.updateProjectionMatrix();
  }
}

function URLParameters() {
  if (currentScene == "Tutorial") {
    renderLightField2();
  } else if (currentScene == "Forest") {
    renderLightField1();
  } else if (currentScene == "City") {
    renderLightField3();
  } else {
    renderLightField2();
  }
}

function render() {
  requestAnimationFrame(render);
  mainControls.update(0.1);
  Resize();
  eventListeners();

  renderer.autoClear = false;
  renderer.setRenderTarget(rtTarget);
  renderer.setClearColor(new THREE.Color(0), 0);
  renderer.clear();

  URLParameters();

  LF1(renderLightField1);
  LF2(renderLightField2);
  LF3(renderLightField3);
  LF1Pinhole();
  LF2Pinhole();
  LF3Pinhole();

  renderer.setRenderTarget(null);

  const left = Math.floor(windowWidth * mainView.left);
  const bottom = Math.floor(windowHeight * mainView.bottom);
  const width = Math.floor(windowWidth * mainView.width);
  const height = Math.floor(windowHeight * mainView.height);

  axesHelper.visible = false;
  cameraHelper.visible = false;

  renderer.setViewport(left, bottom, width, height);
  renderer.setScissor(left, bottom, width, height);
  renderer.setScissorTest(true);
  renderer.setClearColor(bgColor, 1);
  renderer.clear();

  mainCamera.aspect = width / height;
  mainCamera.updateProjectionMatrix();
  renderer.render(scene, mainCamera);
}
