(function () {
  const saved = localStorage.getItem("gtk_theme");
  if (saved === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();

function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";
  if (isDark) {
    html.removeAttribute("data-theme");
    localStorage.setItem("gtk_theme", "light");
  } else {
    html.setAttribute("data-theme", "dark");
    localStorage.setItem("gtk_theme", "dark");
  }
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = document.getElementById("theme-icon");
  if (!icon) return;
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  icon.textContent = isDark ? "brightness_5" : "dark_mode";
}

document.addEventListener("DOMContentLoaded", updateThemeIcon);
