export function renderLightField1() {
  document.getElementById("FOREST").classList.add("clicked");
  document.getElementById("TUTORIAL").classList.remove("clicked");
  document.getElementById("CITY").classList.remove("clicked");
}

export function renderLightField2() {
  document.getElementById("TUTORIAL").classList.add("clicked");
  document.getElementById("FOREST").classList.remove("clicked");
  document.getElementById("CITY").classList.remove("clicked");
}

export function renderLightField3() {
  document.getElementById("CITY").classList.add("clicked");
  document.getElementById("FOREST").classList.remove("clicked");
  document.getElementById("TUTORIAL").classList.remove("clicked");
}
