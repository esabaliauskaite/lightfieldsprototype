export function onAni() {
  if (document.getElementById("Ani").checked == true) {
    let id = null;
    const elem = document.getElementById("FocusInput");
    let pos = document.getElementById("FocusInput").value;
    clearInterval(id);
    id = setInterval(frame, 240);
    function frame() {
      if (pos == -16) {
        clearInterval(id);
      } else {
        pos--;
        elem.value = pos;
        console.log(pos);
        console.log(elem.value);
        pos = document.getElementById("FocusInput").value;
        document.getElementById("FocusInput").style.setProperty("--value", pos);
        document.getElementById("Focusamount").value =
          document.getElementById("FocusInput").value;
      }
    }
  }
}
