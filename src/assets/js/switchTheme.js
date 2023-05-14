function switchTheme () {
    const v = localStorage.getItem('darkmode') === "true";
    const darkmode = !v;
    localStorage.setItem('darkmode', darkmode);
    refreshTheme();
}

function refreshTheme () {
    if (localStorage.getItem('darkmode') === 'true') {
        document.body.classList.add("dark");
        document.getElementById("themeSwitcherIcon").src = "/assets/img/sun.svg";
    }
    else
    {
        document.body.classList.remove("dark");
        document.getElementById("themeSwitcherIcon").src = "/assets/img/moon.svg";
    }
}

window.onload = function () {
    refreshTheme()
};

document.addEventListener("turbolinks:load", function() {
    refreshTheme();
})