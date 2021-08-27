const INTRO_PAGE = 'intro-page';
const MEMORY_GAME = 'memory-game';
const MOSAIC_LOADER = 'mosaic-loader';

let store = {};

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
    console.log(store);
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
        let cellSize = 64,
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
        console.log('ran');
    }
}

// Render the initial screen that user sees
class IntroPage extends HTMLElement {
    constructor() {
        super();
        const introHTML = `
         Please enter even grid size for the memory game <br/>
         <div class="intro-page__input-div">
             <input id="grid-size" type="number" />
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
                value: parseInt(gridSizeElement.value)
            })
            console.log(gridSizeElement.value);
            removeCustomElement(INTRO_PAGE);
            loadCustomElement(MOSAIC_LOADER);
        }
    };
}



// Define all the custom elements that are in use
customElements.define(MEMORY_GAME, MemoryGame);
customElements.define(INTRO_PAGE, IntroPage);
customElements.define(MOSAIC_LOADER, MosaicLoader);