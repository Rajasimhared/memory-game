const INTRO_PAGE = 'intro-page';
const MEMORY_GAME = 'memory-game';
const MOSAIC_LOADER = 'mosaic-loader';
const PICSUM_URL = 'https://picsum.photos/150/150';

let store = {
    gridToggled: true
};

loadCustomElement(INTRO_PAGE);

// Used to load any defined custom html element. Takes two params name, container to query upon
function loadCustomElement(name, container = document.body) {
    const game = document.createElement(name);
    container.appendChild(game);
}

// Used to remove the custom element from DOM
function removeCustomElement(name, container = document.body) {
    const element = container.getElementsByTagName(name)[0];
    element.remove();
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function updateStore({
    key,
    value
}) {
    let newStore = {
        ...store,
        [key]: value,
    }
    store = newStore;
}

function flipCards(time, excludeFlip = []) {
    const {
        gridToggled
    } = store;
    let cards = document.querySelectorAll('.card');
    for (let card of cards) {

        gridToggled ? card.classList.remove('is-flipped') : card.classList.add('is-flipped');
    }
    updateStore({
        key: 'gridToggled',
        value: !gridToggled
    });
}

function randomNumbers() {
    const {
        gridSize
    } = store;
    let nums = Array.from(Array(gridSize * gridSize).keys(), n => n + 1);
    for (var i = nums.length - 1; i > 0; i--) {
        // Generate random number
        var j = Math.floor(Math.random() * (i + 1));

        var temp = nums[i];
        nums[i] = nums[j];
        nums[j] = temp;
    }
    return nums;
}

function createImageGrid() {
    const {
        gridSize
    } = store;
    let images = [];
    for (let i = 0; i < gridSize * gridSize / 2; i++) {
        images.push(fetch(PICSUM_URL));
    }
    Promise.all(images).then((response) => {
        let blobs = []
        response.forEach(result => {
            blobs.push(result.blob())
        });
        Promise.all(blobs).then(result => {
            let shuffledArray = randomNumbers(1, gridSize * gridSize);
            let gridData = [];
            shuffledArray.map(value => {
                let val = {
                    shuffledIndex: value,
                    matchIndex: value % result.length,
                    blob: result[value % result.length]
                }
                gridData.push(val);
            })
            console.log(gridData);
            let gridDimensions = '';
            for (let i = 0; i < gridSize; i++) {
                gridDimensions += '150px ';
            }
            const imageContainer = document.createElement('div');
            imageContainer.style.display = 'grid';
            imageContainer.style.gridTemplateColumns = gridDimensions;
            imageContainer.style.gridTemplateRows = gridDimensions;
            imageContainer.className = 'image-container';

            let selectionOne = 0,
                selectionTwo = 0,
                flipCount = 0;
            let oldImageIndex = null;
            let dontFlipList = [];
            gridData.map(imageBlob => {
                const cardContainer = document.createElement('div');
                cardContainer.className = 'card';
                cardContainer.dataset.matchIndex = imageBlob.matchIndex;
                cardContainer.dataset.shuffledIndex = imageBlob.shuffledIndex;

                setTimeout(() => {
                    cardContainer.classList.toggle('is-flipped');
                    cardContainer.onclick = (event) => {
                        let selectedMatchIndex = parseInt(event.currentTarget.getAttribute("data-match-index"));
                        let selectedShuffledIndex = parseInt(event.currentTarget.getAttribute("data-shuffled-index"));
                        if (!oldImageIndex) {
                            oldImageIndex = selectedShuffledIndex;
                        }
                        if (flipCount < 2) {
                            if (selectionOne) {
                                selectionTwo = selectedMatchIndex;
                            } else {
                                selectionOne = selectedMatchIndex;
                            }
                            flipCount++;
                            cardContainer.classList.toggle('is-flipped');
                            if (selectionOne === selectionTwo && flipCount === 2) {
                                dontFlipList.push(selectedShuffledIndex);
                                dontFlipList.push(oldImageIndex);
                                flipCount = selectionTwo = selectionOne = 0;
                                oldImageIndex = null;
                            } else if (flipCount === 2) {
                                setTimeout(() => {
                                    toggleSelectedCards();
                                }, 1000)
                            }
                        } else {
                            toggleSelectedCards();
                        }
                        if (dontFlipList.length === gridSize * gridSize) {
                            console.log('Game over')
                        }
                        console.log(dontFlipList.length)

                        function toggleSelectedCards() {
                            selectionTwo = selectionOne = 0;
                            oldImageIndex = null;
                            flipCount = 0;
                            let imageContainer = document.querySelectorAll('.card');
                            for (let i = 0; i < imageContainer.length; i++) {
                                if (!dontFlipList.includes(parseInt(imageContainer[i].getAttribute("data-match-index")))) {
                                    imageContainer[i].classList.add('is-flipped');
                                }
                            }
                        }
                    }
                }, 5000)
                const backFlip = document.createElement('div');
                backFlip.className = 'card__face card__face--back';

                let imgObjectURL = URL.createObjectURL(imageBlob.blob);
                let image = new Image();
                image.src = imgObjectURL;
                image.className = 'card__face card__face--front';

                cardContainer.appendChild(image);
                cardContainer.appendChild(backFlip);
                imageContainer.appendChild(cardContainer);
            })
            document.body.appendChild(imageContainer);
            removeCustomElement(MOSAIC_LOADER);
        })
    })
}

class MosaicLoader extends HTMLElement {
    constructor() {
        super();
    };

    connectedCallback() {
        let {
            gridSize
        } = store;

        let loader = document.createElement('div');
        loader.className = MOSAIC_LOADER;
        let cellSize = 150,
            cellSpacing = 1;
        let totalSize = gridSize * (cellSize + (2 * cellSpacing));
        loader.style.width = totalSize + 'px';
        loader.style.height = totalSize + 'px';

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                let box = document.createElement('div');
                box.className = `cell d-${i + j}`;
                let randomColor = getRandomColor()
                box.style.width = cellSize + 'px';
                box.style.border = `1px solid ${randomColor}`;
                box.style.color = randomColor;
                box.style.setProperty('--cell-color', randomColor);
                box.style.setProperty('--animation-time', `${gridSize/3}s`);
                box.style.animationDelay = `${100 * i}ms`;
                loader.appendChild(box);
            }
        }
        this.appendChild(loader);
    }
}

class MemoryGame extends HTMLElement {
    constructor() {
        super();
    };
    connectedCallback() {
        createImageGrid();
        let flipButton = document.createElement('button')
        flipButton.className = 'flip-button'
        flipButton.textContent = 'Flip Cards';
        flipButton.onclick = () => flipCards();
        document.body.appendChild(flipButton);
    }
}

// Render the initial screen that user sees
class IntroPage extends HTMLElement {
    constructor() {
        super();
        const introHTML = `
         Please enter even grid size for the memory game <br/>
         <div class="intro-page__input-div">
             <input id="grid-size" type="number" aria-label="number input"/>
             <button id="enter-game"> Enter Game! </button>
        </div>
         `;
        // let intro = document.createDocumentFragment();
        let intro = document.createElement('div');
        intro.innerHTML = introHTML;
        this.appendChild(intro);

        const enterGame = document.querySelector('#enter-game');
        const gridSizeElement = document.querySelector('#grid-size');

        enterGame.onclick = function () {
            updateStore({
                key: 'gridSize',
                value: parseInt(gridSizeElement.value) % 2 === 0 ? parseInt(gridSizeElement.value) : parseInt(gridSizeElement.value) + 1
            });
            removeCustomElement(INTRO_PAGE);
            loadCustomElement(MOSAIC_LOADER);
            loadCustomElement(MEMORY_GAME);
        }
    };
}



// Define all the custom elements that are in use
customElements.define(MEMORY_GAME, MemoryGame);
customElements.define(INTRO_PAGE, IntroPage);
customElements.define(MOSAIC_LOADER, MosaicLoader);