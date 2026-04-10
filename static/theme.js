(function () {
    const STORAGE_KEY = "study_tracker_theme";

    function getPreferredTheme() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "light" || stored === "dark") {
            return stored;
        }
        return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        const isLight = theme === "light";
        const text = isLight ? "Dark Mode" : "Light Mode";

        const dashboardToggle = document.getElementById("themeToggle");
        const authToggle = document.getElementById("authThemeToggle");

        if (dashboardToggle) {
            dashboardToggle.innerText = text;
        }
        if (authToggle) {
            authToggle.innerText = text;
        }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        const next = current === "dark" ? "light" : "dark";
        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
    }

    document.addEventListener("DOMContentLoaded", function () {
        applyTheme(getPreferredTheme());

        const dashboardToggle = document.getElementById("themeToggle");
        const authToggle = document.getElementById("authThemeToggle");

        if (dashboardToggle) {
            dashboardToggle.addEventListener("click", toggleTheme);
        }
        if (authToggle) {
            authToggle.addEventListener("click", toggleTheme);
        }
    });
})();
