const INTRO_PAGE = 'intro-page';
const MEMORY_GAME = 'memory-game';
const MOSAIC_LOADER = 'mosaic-loader';
const PICSUM_URL = 'https://picsum.photos';
const TOAST = 'toast-message';

loadCustomElement(INTRO_PAGE);

const store = {
    gridToggled: true,
    gridBoxSize: null,
    userScore: 0,
    userAttempts: 0,
    gridSize: 0,
    deviceWidth: 0,
    cellWidth: 0,
    excludeFlip: []
};

// Used to load any defined custom html element. Takes two params name, container to query upon
function loadCustomElement(name, attributes, container = document.body) {
    const game = document.createElement(name);
    attributes?.forEach(attribute => {
        game.setAttribute(attribute.key, attribute.value);
    })
    container.appendChild(game);
}

// Used to remove the custom element from DOM
function removeCustomElement(name, container = document.body) {
    const element = container.getElementsByTagName(name)[0];
    element.remove();
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
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

function randomNumbersInRange(start, end) {
    let nums = Array.from(Array(end).keys(), n => n + 1);
    for (let i = start; i < nums.length; i++) {
        // Generate random number
        let j = Math.floor(Math.random() * (i));
        [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    return nums;
}

class ToastMessage extends HTMLElement {
    constructor() {
        super();
    };

    connectedCallback() {
        let flipButton = document.getElementsByClassName('flip-button')[0];
        flipButton?.remove()
        let toast = document.createElement('div');
        toast.innerHTML = this.getAttribute('message');
        toast.classList.add('toast-success');
        const memoryGame = document.getElementsByTagName(MEMORY_GAME)[0];
        document.body.insertBefore(toast, memoryGame);

        const end = Date.now() + (5 * 1000);
        const colors = ['#fff', '#ff0000', '#f3f3f3', '#008000'];
        (function frame() {
            confetti({
                particleCount: 4,
                angle: -90,
                spread: 180,
                origin: {
                    x: 0.5,
                    y: -0.2
                },
                colors: colors
            });
            // confetti({
            //     particleCount: 4,
            //     angle: -45,
            //     spread: 85,
            //     origin: {
            //         x: 0,
            //         y: 0
            //     },
            //     colors: colors
            // });
            // confetti({
            //     particleCount: 4,
            //     angle: -135,
            //     spread: 85,
            //     origin: {
            //         x: 1,
            //         y: 0
            //     },
            //     colors: colors
            // });
            // confetti({
            //     particleCount: 4,
            //     angle: 45,
            //     spread: 85,
            //     origin: {
            //         x: 0,
            //         y: 1
            //     },
            //     colors: colors
            // });
            // confetti({
            //     particleCount: 4,
            //     angle: 135,
            //     spread: 85,
            //     origin: {
            //         x: 1,
            //         y: 1
            //     },
            //     colors: colors
            // });
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }
}

class MosaicLoader extends HTMLElement {
    constructor() {
        super();
    };

    connectedCallback() {
        let {
            gridSize,
            cellWidth
        } = store;
        let loader = document.createElement('div');
        loader.className = MOSAIC_LOADER;
        let cellSize = cellWidth,
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
        this.updateScoring();
        this.createImageGrid();
    }

    updateScoring() {
        const score = document.body.querySelector('.score');
        const scoreAttempts = document.body.querySelector('.score-attempt');
        if (!scoreAttempts || !score) {
            let scoringContainer = document.createElement('div');
            scoringContainer.classList.add('scoring-container');
            scoringContainer.innerHTML = `
            <div>Score: <span class="score">${store.userScore}</span></div>
             <div>Attempts: <span class="score-attempt">${store.userAttempts}</span></div>
             <div>
            <button onclick="window.location.reload()">Replay &#x21BA;</button>
            <button class="flip-button">Flip All Cards</button>
            </div>
            `;
            this.appendChild(scoringContainer);
        } else {
            scoreAttempts.innerHTML = `${store.userAttempts}`;
            score.innerHTML = `${store.userScore}`;
        }
    }

    async fetchImages(images) {
        return Promise.all(images).then(async (response) => {
            let blobs = []
            response.forEach(result => {
                blobs.push(result.blob())
            });
            let blobImages = await this.fetchImagesBlob(blobs);
            return blobImages;
        })
    }

    async fetchImagesBlob(blobs) {
        return Promise.all(blobs).then(result => result)
    }

    async createImageGrid() {
        const {
            gridSize,
            cellWidth
        } = store;
        // Prepare images array for promise.all
        let images = [];
        for (let i = 0; i < gridSize * gridSize / 2; i++) {
            images.push(fetch(`${PICSUM_URL}/${cellWidth}/${cellWidth}`));
        }

        // Fetch images with blobs
        let imagesData = await this.fetchImages(images);

        let shuffledArray = randomNumbersInRange(1, gridSize * gridSize);

        let gridData = [];
        shuffledArray.map(value => {
            let val = {
                shuffledIndex: value,
                matchIndex: value % imagesData.length,
                blob: imagesData[value % imagesData.length]
            }
            gridData.push(val);
        })
        let gridDimensions = '';
        for (let i = 0; i < gridSize; i++) {
            gridDimensions += `${cellWidth}px `;
        }

        const imageContainer = document.createElement('div');
        imageContainer.style.display = 'grid';
        imageContainer.style.gridTemplateColumns = gridDimensions;
        imageContainer.style.gridTemplateRows = gridDimensions;
        imageContainer.className = 'image-container';

        let selectionOne = 0,
            selectionTwo = 0,
            flipCount = 0,
            oldImageIndex = null,
            dontFlipList = [];

        imageContainer.onclick = (event) => {
            const parentCard = event.target.parentElement;
            const {
                userScore,
                userAttempts
            } = store;
            if (parentCard.classList.contains('is-flipped')) {
                let selectedMatchIndex = parseInt(event.target.getAttribute("data-match-index"));
                let selectedShuffledIndex = parseInt(event.target.getAttribute("data-shuffled-index"));
                if (!oldImageIndex) {
                    oldImageIndex = selectedShuffledIndex;
                }
                if (flipCount < 2) {
                    selectionOne ? selectionTwo = selectedMatchIndex : selectionOne = selectedMatchIndex;
                    flipCount++;
                    parentCard.classList.toggle('is-flipped');
                    if (selectionOne === selectionTwo && flipCount === 2) {
                        dontFlipList.push(selectedShuffledIndex);
                        dontFlipList.push(oldImageIndex);
                        flipCount = selectionTwo = selectionOne = 0;
                        oldImageIndex = null;
                        store.userScore = userScore + 1;
                        this.updateScoring();
                        store.excludeFlip = dontFlipList;
                    } else if (flipCount === 2) {
                        store.userAttempts = userAttempts + 1;
                        this.updateScoring();
                        setTimeout(() => {
                            toggleSelectedCards();
                        }, 1000);

                    }
                } else {
                    toggleSelectedCards();
                }
                if (dontFlipList.length === gridSize * gridSize) {
                    loadCustomElement(TOAST, [{
                        key: 'message',
                        value: 'Congrats! You made it...'
                    }])
                }
            }
        }

        function toggleSelectedCards(flipAll = false) {
            selectionTwo = selectionOne = 0;
            oldImageIndex = null;
            flipCount = 0;
            let imageContainer = document.querySelectorAll('.card');
            if (flipAll) {
                for (let card of imageContainer) {
                    card.classList.remove('is-flipped');
                }
            } else {
                for (let i = 0; i < imageContainer.length; i++) {
                    if (!dontFlipList.includes(parseInt(imageContainer[i].getAttribute("data-shuffled-index")))) {
                        imageContainer[i].classList.add('is-flipped');
                    }
                }
            }

        }

        gridData.map(imageBlob => {
            const cardContainer = document.createElement('div');
            cardContainer.className = 'card';
            cardContainer.dataset.matchIndex = imageBlob.matchIndex;
            cardContainer.dataset.shuffledIndex = imageBlob.shuffledIndex;

            setTimeout(() => {
                cardContainer.classList.toggle('is-flipped');
            }, 5000)

            const backFlip = document.createElement('div');
            backFlip.className = 'card__face card__face--back';
            backFlip.dataset.matchIndex = imageBlob.matchIndex;
            backFlip.dataset.shuffledIndex = imageBlob.shuffledIndex;

            let imgObjectURL = URL.createObjectURL(imageBlob.blob);
            let image = new Image();
            image.src = imgObjectURL;
            image.className = 'card__face card__face--front';

            cardContainer.appendChild(image);
            cardContainer.appendChild(backFlip);
            imageContainer.appendChild(cardContainer);
        });

        let flip = document.querySelector('.flip-button');
        flip.onclick = () => {
            toggleSelectedCards(true);
            setTimeout(() => {
                toggleSelectedCards();
            }, 2000)
        }

        this.appendChild(imageContainer);
        removeCustomElement(MOSAIC_LOADER);
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
        intro.classList.add('intro-page');
        intro.innerHTML = introHTML;
        this.appendChild(intro);

        const enterGame = document.querySelector('#enter-game');
        const gridSizeElement = document.querySelector('#grid-size');

        enterGame.onclick = function () {
            store.deviceWidth = window.innerWidth - 36;
            store.gridSize = parseInt(gridSizeElement.value) % 2 === 0 ? parseInt(gridSizeElement.value) : parseInt(gridSizeElement.value) + 1;

            store.cellWidth = Math.floor(store.deviceWidth / store.gridSize) > 150 ? 150 : Math.floor(store.deviceWidth / store.gridSize);
            removeCustomElement(INTRO_PAGE);
            loadCustomElement(MEMORY_GAME);
            loadCustomElement(MOSAIC_LOADER);
        }
    };
}



// Define all the custom elements that are in use
customElements.define(MEMORY_GAME, MemoryGame);
customElements.define(INTRO_PAGE, IntroPage);
customElements.define(MOSAIC_LOADER, MosaicLoader);
customElements.define(TOAST, ToastMessage);