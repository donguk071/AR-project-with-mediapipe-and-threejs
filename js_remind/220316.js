function modifyText() {
    const t2 = document.getElementById("mytext");
    t2.textContent = "> <"
}

document.addEventListener("click", modifyText,false);
