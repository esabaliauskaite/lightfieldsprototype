import * as THREE from "https://cdn.skypack.dev/three@0.130.1/build/three.module.js";
import { OBJLoader } from "https://cdn.skypack.dev/three@0.130.1/examples/jsm/loaders/OBJLoader.js";
import { PLYLoader } from "https://cdn.skypack.dev/three@0.130.1/examples/jsm/loaders/PLYLoader.js";

import vertexScreen from "./shaders/vertexScreen.js";
import fragmentScreen from "./shaders/fragmentScreen.js";
import vertex from "./shaders/vertex.js";
import fragment from "./shaders/fragment.js";
import { cameraHelperArray } from "./modules/cameraHelperArray.js";
import { FlyControls } from "./modules/flyControls.js";
import { renderLightField1, renderLightField2 } from "./renderLF.js";

// # Debug Scene ##
const imgURL = "./data/debug_scene/";
const poseURL = "./data/debug_scene/blender_poses.json";
const singleImageFov = 60; // degrees

// # Forest Scene ##
const ForestimgURL = "./data/forest_F5/";
const ForestposeURL = "./data/forest_F5/poses.json";
const ForestsingleImageFov = 35; // degrees

const bgColor = new THREE.Color(0x0f0f0f);
const debugbgColor = new THREE.Color(0, 0, 0);
let quat = new THREE.Quaternion();
const demURL = "./data/zero_plane.obj";

let forestImageLocations = [];
let urbanImageLocations = [];

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
let singleImages = new Array();
let singleImageMaterials = new Array();
let ForestsingleImageMaterials = new Array();
let cameraArrayHelper = new Array();
let ForestcameraArrayHelper = new Array();

let sceneGeometries = [];
let rtTarget;
let rtScene;

let mainCamera, debugCamera;
let axesHelper, cameraHelper;

let windowWidth, windowHeight;

const textureLoader = new THREE.TextureLoader();
const loader = new OBJLoader();

let forest = "./data/forest_F5/F5.ply";
let debugply = "./data/blender.ply";

const plyLoader = new PLYLoader();

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
    urbanImageLocations.push(pos);
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
    singleImages.push(camera);
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
      forestImageLocations.push(pos);
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
    singleImages.push(camera);
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

function showCameraArray() {
  if (document.getElementById("CameraArray").checked) {
    if (document.querySelector("#PC2").classList.contains("clicked")) {
      for (let i = 0; i < cameraArrayHelper.length; i++) {
        cameraArrayHelper[i].visible = true;
      }
      for (let i = 0; i < ForestcameraArrayHelper.length; i++) {
        ForestcameraArrayHelper[i].visible = false;
      }
    } else if (document.querySelector("#PC1").classList.contains("clicked")) {
      for (let i = 0; i < ForestcameraArrayHelper.length; i++) {
        ForestcameraArrayHelper[i].visible = true;
      }
      for (let i = 0; i < cameraArrayHelper.length; i++) {
        cameraArrayHelper[i].visible = false;
      }
    }
  } else {
    if (document.querySelector("#PC2").classList.contains("clicked")) {
      for (let i = 0; i < cameraArrayHelper.length; i++) {
        cameraArrayHelper[i].visible = false;
      }
    } else {
      for (let i = 0; i < ForestcameraArrayHelper.length; i++) {
        ForestcameraArrayHelper[i].visible = false;
      }
    }
  }
}

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

  document.getElementById("PC2").classList.add("clicked");
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

function setCamera() {
  mainCamera.position.x = document.getElementById("CameraXInput").value;
  document
    .getElementById("CameraXInput")
    .style.setProperty("--value", mainCamera.position.x);
  document.getElementById("CameraXamount").value =
    document.getElementById("CameraXInput").value;

  mainCamera.position.y = document.getElementById("CameraYInput").value;
  document
    .getElementById("CameraYInput")
    .style.setProperty("--value", mainCamera.position.y);
  document.getElementById("CameraYamount").value =
    document.getElementById("CameraYInput").value;

  mainCamera.position.z = document.getElementById("CameraZInput").value;
  document
    .getElementById("CameraZInput")
    .style.setProperty("--value", mainCamera.position.z);
}

function renderPointCloud() {
  if (document.getElementById("PC1").classList.contains("clicked")) {
    if (pointCloud) {
      pointCloud.parent.remove(pointCloud);
    }
    plyLoader.load(
      forest,
      function (geometry) {
        const material = new THREE.PointsMaterial({
          size: 0.01,
          vertexColors: true,
        });
        const mesh = new THREE.Points(geometry, material);
        mesh.rotation.z = -1.5;
        mesh.rotation.y = -3.14159;
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
      },
      function (error) {
        console.log("An error happened");
      }
    );
  } else if (document.getElementById("PC2").classList.contains("clicked")) {
    if (pointCloud) {
      pointCloud.parent.remove(pointCloud);
    }
    plyLoader.load(
      debugply,
      function (geometry) {
        const material = new THREE.PointsMaterial({
          size: 0.01,
          vertexColors: true,
        });
        const mesh = new THREE.Points(geometry, material);
        mesh.rotation.y = -3;
        mesh.rotation.z = -3;
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
      },
      function (error) {
        console.log("An error happened");
      }
    );
  }
}

function setFocusValue() {
  if (document.querySelector("#PC1").classList.contains("clicked")) {
    dem.position.z = -4;
    document.getElementById("Focusamount").value = dem.position.z;
    document.getElementById("FocusInput").value = dem.position.z;
  }
  if (document.querySelector("#PC2").classList.contains("clicked")) {
    dem.position.z = -11;
    document.getElementById("Focusamount").value = dem.position.z;
    document.getElementById("FocusInput").value = dem.position.z;
  }
}

function animation() {
  let id = null;
  const elem = document.getElementById("FocusInput");
  document.getElementById("FocusInput").value = 10;
  let pos = document.getElementById("FocusInput").value;
  clearInterval(id);
  id = setInterval(frame, 180);
  function frame() {
    if (pos == -20) {
      clearInterval(id);
    } else {
      pos--;
      elem.value = pos;
      pos = document.getElementById("FocusInput").value;
      document.getElementById("FocusInput").style.setProperty("--value", pos);
      document.getElementById("Focusamount").value =
        document.getElementById("FocusInput").value;
      setFocus();
    }
  }
}

async function LF1(renderLightField1) {
  if (document.querySelector("#PC1").classList.contains("clicked")) {
    renderLightField1();
    for (let i = 0; i < ForestsingleImageMaterials.length; i++) {
      dem.material = ForestsingleImageMaterials[i];
      renderer.render(rtScene, views.main.camera);
    }
  }
}

async function LF2(renderLightField2) {
  if (document.querySelector("#PC2").classList.contains("clicked")) {
    renderLightField2();
    for (let i = 0; i < singleImageMaterials.length; i++) {
      dem.material = singleImageMaterials[i];
      renderer.render(rtScene, views.main.camera);
    }
  }
}

async function LF1Pinhole() {
  if (
    document.querySelector("#PC1").classList.contains("clicked") &&
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
    document.querySelector("#PC2").classList.contains("clicked") &&
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

async function eventListeners() {
  document.getElementById("Ani").addEventListener("click", animation);
  document.getElementById("FocusInput").addEventListener("input", setFocus);
  document.getElementById("Focusamount").addEventListener("change", setFocus);
  document.getElementById("PC1").addEventListener("click", setFocusValue);
  document.getElementById("PC2").addEventListener("click", setFocusValue);
  document.getElementById("FOVAmount").addEventListener("input", setFOV);
  document.getElementById("CameraXInput").addEventListener("input", setCamera);
  document.getElementById("CameraYInput").addEventListener("input", setCamera);
  document.getElementById("CameraZInput").addEventListener("input", setCamera);
  document
    .getElementById("CameraXamount")
    .addEventListener("change", setCamera);
  document
    .getElementById("CameraYamount")
    .addEventListener("change", setCamera);
  document
    .getElementById("CameraZamount")
    .addEventListener("change", setCamera);
  document.getElementById("PC1").addEventListener("click", renderLightField1);
  document.getElementById("PC2").addEventListener("click", renderLightField2);
  document
    .getElementById("CameraArray")
    .addEventListener("change", showCameraArray);
  showCameraArray();
  document.getElementById("PCView").addEventListener("click", renderPointCloud);
}

function render() {
  requestAnimationFrame(render);
  mainControls.update(1);
  Resize();
  eventListeners();

  renderer.autoClear = false;
  renderer.setRenderTarget(rtTarget);
  renderer.setClearColor(new THREE.Color(0), 0);
  renderer.clear();

  LF1(renderLightField1);
  LF2(renderLightField2);
  LF1Pinhole();
  LF2Pinhole();

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

  if (document.querySelector("#DebugView").checked) {
    axesHelper.visible = true;
    cameraHelper.visible = true;
    renderer.autoClear = false;

    const debugleft = Math.floor(windowWidth * debugView.left);
    const debugbottom = Math.floor(windowHeight * debugView.bottom);
    const debugwidth = Math.floor(windowWidth * debugView.width);
    const debugheight = Math.floor(windowHeight * debugView.height);

    renderer.setViewport(debugleft, debugbottom, debugwidth, debugheight);
    renderer.setScissor(debugleft, debugbottom, debugwidth, debugheight);
    renderer.setScissorTest(true);
    renderer.setClearColor(debugbgColor, 1);
    renderer.clear();

    debugCamera.aspect = debugView.width / debugView.height;
    debugCamera.updateProjectionMatrix();
    renderer.render(scene, debugCamera);
  }
}
