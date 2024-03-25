export var element = document.getElementById('console');

export function log(message, color = "white") {
  element.innerHTML += `
        <div class="message">
          <p style="color: ${color};">${message}</p>
        </div>
      `;

  element.scrollTop = element.scrollHeight;

  setTimeout(function () {
    let messages = element.children;
    for (let i = 0; i < messages.length; i++) {
      if (!messages[i].classList.contains("fadeOut")) {
        messages[i].classList.add("fadeOut");
        setTimeout(function () { messages[i].style.visibility = "hidden"; }, 1000);
      }
    }
  }, 7000);
};