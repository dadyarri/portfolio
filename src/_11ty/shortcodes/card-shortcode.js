

async function cardShortcode(heading, date, text) {

    return `<div class="card"><h2 class="card-heading"><span class="card-heading-inner">${heading}</span><span class="card-date">${date}</span></h2><p class="card-text">${text}</p></div>`
}

module.exports = cardShortcode;