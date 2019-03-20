const searchInput = document.querySelector('.searchInput')
const searchButton = document.querySelector('#searchButton')


searchButton.addEventListener('click', ()=>{
    const idToFind = searchInput.value
    console.log(idToFind)
    window.location.href = `?id=${idToFind}`
})
