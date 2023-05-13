function switchTheme () {
    const v = localStorage.getItem('darkmode') === "true";
    const darkmode = !v;
    localStorage.setItem('darkmode', darkmode);
    if (darkmode)
    {
        document.body.classList.add("dark");
    }
    else
    {
        document.body.classList.remove("dark");
    }
}

function refreshTheme () {
    if (localStorage.getItem('darkmode') === 'true') {
        document.body.classList.add("dark");
    }
    else
    {
        document.body.classList.remove("dark");
    }
}

window.onload = function () {
    refreshTheme()
};

document.addEventListener("turbolinks:load", function() {
    refreshTheme();
  })