export function renderLightField1() {
  document.getElementById("PC2").classList.remove("clicked");
  document.getElementById("PC1").classList.add("clicked");
}

export function renderLightField2() {
  document.getElementById("PC2").classList.add("clicked");
  document.getElementById("PC1").classList.remove("clicked");
}
