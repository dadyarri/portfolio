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

window.onload = function () {
    if (localStorage.getItem('darkmode') === 'true') {
        document.body.classList.add("dark");
    }
    else
    {
        document.body.classList.remove("dark");
    }
};