import R from "./ramda.js";

if (!sessionStorage.getItem('gameReload')) {
    localStorage.setItem('p1Wins', '0');
    localStorage.setItem('p2Wins', '0');
}
sessionStorage.removeItem('gameReload');

/*_________________Button CLicking____________*/
const startButton = document.querySelector('.ButtonWrap button');
const Player1Grid = document.getElementById('Player1Grid');
let currentHelpIndex = 0;

startButton.addEventListener('click', function() {
    document.querySelector('.TitleScreen').classList.add('hidden');
    document.querySelector('.PlaceScreen1').classList.remove('hidden');
    Player1Grid.classList.remove('hidden');
    document.querySelector('.HelpBtn').classList.remove('hidden');
});

const SelectDone1Button = document.querySelector('.done1 button');
const Player2Grid = document.getElementById('Player2Grid');

SelectDone1Button.addEventListener('click', function() {
    document.querySelector('.PlaceScreen1').classList.add('hidden');
    document.querySelector('.PlaceScreen2').classList.remove('hidden');
    Player1Grid.classList.add('hidden');
    Player2Grid.classList.remove('hidden');
    shipCells.forEach(function(cells, ship) {
        if (cells[0].startsWith('Player1Grid')) ship.classList.add('hidden');
    });
});

const SelectDone2Button = document.querySelector('.done2 button');

SelectDone2Button.addEventListener('click', function() {
    document.querySelector('.PlaceScreen2').classList.add('hidden');
    document.querySelector('.PlayScreen').classList.remove('hidden');
    currentHelpIndex = 1;
    shipCells.forEach(function(cells, ship) {
        if (cells[0].startsWith('Player2Grid')) ship.classList.add('hidden');
    });
    document.getElementById('Player1Grid').classList.add('play-grid');
    document.getElementById('Player2Grid').classList.add('play-grid');
    Player1Grid.classList.remove('hidden');
    Player2Grid.classList.remove('hidden');
    setupGame();
});

/*_____________________Game________________*/
function setupGame() {
    const firedCells = new Set();
    let currentPlayer = 1;
    let p1NodesRemaining = 17;
    let p2NodesRemaining = 17;

    const p1Grid = document.getElementById('Player1Grid');
    const p2Grid = document.getElementById('Player2Grid');

    function updateActiveGrid() {
        p1Grid.classList.toggle('inactive-grid', currentPlayer === 1);
        p2Grid.classList.toggle('inactive-grid', currentPlayer === 2);
        document.getElementById('turnIndicator').textContent = 'Player ' + currentPlayer + '\'s Turn';
    }

    function showVictory(winner) {
        const p1Wins = parseInt(localStorage.getItem('p1Wins') || '0');
        const p2Wins = parseInt(localStorage.getItem('p2Wins') || '0');
        const newP1 = winner === 'Player 1' ? p1Wins + 1 : p1Wins;
        const newP2 = winner === 'Player 2' ? p2Wins + 1 : p2Wins;
        localStorage.setItem('p1Wins', newP1);
        localStorage.setItem('p2Wins', newP2);

        document.querySelector('.PlayScreen').classList.add('hidden');
        document.querySelector('.HelpBtn').classList.add('hidden');
        document.querySelectorAll('.Help').forEach(el => el.classList.add('hidden'));
        p1Grid.classList.add('hidden');
        p2Grid.classList.add('hidden');

        document.getElementById('winnerText').textContent = winner + ' Wins!';
        document.getElementById('winRatio').textContent = newP1 + ':' + newP2;
        document.querySelector('.VictoryScreen').classList.remove('hidden');
        const reloadTimeout = setTimeout(function() { sessionStorage.setItem('gameReload', '1'); location.reload(); }, 5000);
        document.querySelector('.VictoryScreen').addEventListener('click', function() {
            clearTimeout(reloadTimeout);
            sessionStorage.setItem('gameReload', '1');
            location.reload();
        }, { once: true });
    }

    function fireAt(cell) {
        if (firedCells.has(cell.id)) return;
        firedCells.add(cell.id);

        if (occupiedCells.has(cell.id)) {
            cell.classList.add('hit');
            if (cell.id.startsWith('Player1Grid')) {
                p1NodesRemaining--;
                if (p1NodesRemaining === 0) { showVictory('Player 2'); return; }
            } else {
                p2NodesRemaining--;
                if (p2NodesRemaining === 0) { showVictory('Player 1'); return; }
            }
        } else {
            cell.classList.add('miss');
        }

        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateActiveGrid();
    }

    function onGridClick(firingPlayer) {
        return function(e) {
            if (currentPlayer !== firingPlayer) return;
            const cell = e.target;
            if (!cell.classList.contains('cell') || cell.classList.contains('header')) return;
            fireAt(cell);
        };
    }

    document.getElementById('Player2Grid').addEventListener('click', onGridClick(1));
    document.getElementById('Player1Grid').addEventListener('click', onGridClick(2));
    updateActiveGrid();
}
/*Instead of storing a const variable this code cycles through the two 
different buttons with the same class and assigns btn as a temporary variable */

const helpButtons = document.querySelectorAll('.HelpBtn');
const helpBoxes = document.querySelectorAll('.Help');


helpButtons.forEach(function(btn) {
    btn.addEventListener('mouseover', function() {
        helpBoxes[currentHelpIndex].classList.remove('hidden');
    });
    btn.addEventListener('mouseout', function() {
        helpBoxes[currentHelpIndex].classList.add('hidden');
    });
});
/*_____________________Grid________________*/
function createGrid(gridID) {
    const grid = document.getElementById(gridID);
    const rows = ['A','B','C','D','E','F','G','H','I','J'];
    const cols = ['1','2','3','4','5','6','7','8','9','10'];

    const corner = document.createElement('div');
    corner.classList.add('cell', 'header');
    grid.appendChild(corner);


    cols.forEach(col => {
        const header = document.createElement('div');
        header.classList.add('cell', 'header');
        header.textContent = col;
        grid.appendChild(header);
    });

    for (let r = 0; r < rows.length; r++) {
        const rowHeader = document.createElement('div');
        rowHeader.classList.add('cell', 'header');
        rowHeader.textContent = rows[r];
        grid.appendChild(rowHeader);

        for (let c = 0; c < cols.length; c++) {
            const cell = document.createElement('div');
            cell.id = gridID + '_' + rows[r] + cols[c];
            cell.classList.add('cell');
            grid.appendChild(cell);
        }
    }
}
createGrid('Player1Grid');
createGrid('Player2Grid');

/*_____________________Drag and Drop________________*/
const shipSVGs = {
    'GunBoat':  './assets/GunBoat.svg',
    'Brig':     './assets/Brig.svg',
    'Schooner': './assets/Schooner.svg',
    'Frigate':  './assets/Frigate.svg',
    'ManOWar':  './assets/Man o War.svg'
};

let draggedShip = null;
let dragClone = null;
let previousCells = [];
let rotation = 0;
const occupiedCells = new Set();
const shipCells = new Map();
const rows = ['A','B','C','D','E','F','G','H','I','J'];

function checkAllShipsPlaced() {
    let p1Count = 0, p2Count = 0;
    shipCells.forEach(function(cells) {
        if (cells[0].startsWith('Player1Grid')) p1Count++;
        else p2Count++;
    });
    document.querySelector('.done1').classList.toggle('hidden', p1Count < 5);
    document.querySelector('.done2').classList.toggle('hidden', p2Count < 5);
}

function endDrag(placed) {
    document.body.style.userSelect = '';
    if (dragClone && dragClone.parentNode) document.body.removeChild(dragClone);
    dragClone = null;
    rotation = 0;

    if (draggedShip) {
        draggedShip.style.pointerEvents = '';
        if (!placed) {
            previousCells.forEach(id => occupiedCells.add(id));
            if (previousCells.length > 0) shipCells.set(draggedShip, previousCells);
            draggedShip.style.opacity = '1';
        }
    }
    previousCells = [];
    draggedShip = null;
    checkAllShipsPlaced();
}

document.addEventListener('keydown', function(e) {
    if ((e.key === 'r' || e.key === 'R') && draggedShip && dragClone) {
        rotation = (rotation - 90) % 360;
        dragClone.style.transform = 'rotate(' + rotation + 'deg)';
    }
});

document.querySelectorAll('.ship').forEach(function(ship) {
    ship.draggable = false;

    ship.addEventListener('pointerdown', function(e) {
        if (draggedShip) return;
        draggedShip = ship;
        ship.style.pointerEvents = 'none';

        if (shipCells.has(ship)) {
            previousCells = shipCells.get(ship);
            previousCells.forEach(id => occupiedCells.delete(id));
            shipCells.delete(ship);
            checkAllShipsPlaced();
        } else {
            previousCells = [];
        }

        const nodeCount = ship.querySelectorAll('.ShipNode').length;
        const cellW = window.innerWidth * 0.6 / 11;
        const cellH = window.innerHeight * 0.6 / 11;
        const cloneW = cellW * nodeCount;
        const cloneH = cellH;

        dragClone = new Image();
        dragClone.src = shipSVGs[ship.id];
        dragClone.style.position = 'fixed';
        dragClone.style.width = cloneW + 'px';
        dragClone.style.height = cloneH + 'px';
        dragClone.style.pointerEvents = 'none';
        dragClone.style.zIndex = '100';
        dragClone.style.left = (e.clientX - cloneW / 2) + 'px';
        dragClone.style.top = (e.clientY - cloneH / 2) + 'px';
        document.body.appendChild(dragClone);

        ship.style.opacity = '0.3';
        document.body.style.userSelect = 'none';
    });
});

document.addEventListener('pointermove', function(e) {
    if (!dragClone) return;
    dragClone.style.left = (e.clientX - dragClone.offsetWidth / 2) + 'px';
    dragClone.style.top = (e.clientY - dragClone.offsetHeight / 2) + 'px';
});

document.addEventListener('pointerup', function(e) {
    if (!draggedShip || !dragClone) return;

    const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
    let placed = false;

    if (elementBelow && elementBelow.classList.contains('cell') && !elementBelow.classList.contains('header')) {
        const nodeCount = draggedShip.querySelectorAll('.ShipNode').length;
        const cellRect = elementBelow.getBoundingClientRect();
        const cellW = cellRect.width;
        const cellH = cellRect.height;

        const idParts = elementBelow.id.split('_');
        const gridId = idParts[0];
        const row = idParts[1][0];
        const col = parseInt(idParts[1].slice(1));

        const isVertical = rotation % 180 !== 0;

        if (!isVertical) {
            const startCol = col - Math.floor(nodeCount / 2);
            const endCol = startCol + nodeCount - 1;

            if (startCol >= 1 && endCol <= 10) {
                const cells = [];
                let hasOverlap = false;
                for (let i = 0; i < nodeCount; i++) {
                    const cellId = gridId + '_' + row + (startCol + i);
                    if (occupiedCells.has(cellId)) { hasOverlap = true; break; }
                    cells.push(cellId);
                }
                if (!hasOverlap) {
                    cells.forEach(id => occupiedCells.add(id));
                    shipCells.set(draggedShip, cells);
                    const startRect = document.getElementById(gridId + '_' + row + startCol).getBoundingClientRect();
                    draggedShip.style.position = 'fixed';
                    draggedShip.style.left = startRect.left + 'px';
                    draggedShip.style.top = cellRect.top + 'px';
                    draggedShip.style.width = (cellW * nodeCount) + 'px';
                    draggedShip.style.height = cellH + 'px';
                    draggedShip.style.transform = 'rotate(' + rotation + 'deg)';
                    draggedShip.style.zIndex = '5';
                    draggedShip.style.opacity = '1';
                    document.body.appendChild(draggedShip);
                    placed = true;
                }
            }
        } else {
            const rowIndex = rows.indexOf(row);
            const startRowIndex = rowIndex - Math.floor(nodeCount / 2);
            const endRowIndex = startRowIndex + nodeCount - 1;

            if (startRowIndex >= 0 && endRowIndex <= 9) {
                const cells = [];
                let hasOverlap = false;
                for (let i = 0; i < nodeCount; i++) {
                    const cellId = gridId + '_' + rows[startRowIndex + i] + col;
                    if (occupiedCells.has(cellId)) { hasOverlap = true; break; }
                    cells.push(cellId);
                }
                if (!hasOverlap) {
                    cells.forEach(id => occupiedCells.add(id));
                    shipCells.set(draggedShip, cells);
                    const startRect = document.getElementById(gridId + '_' + rows[startRowIndex] + col).getBoundingClientRect();
                    const W = cellH * nodeCount;
                    const H = cellW;
                    draggedShip.style.position = 'fixed';
                    draggedShip.style.width = W + 'px';
                    draggedShip.style.height = H + 'px';
                    draggedShip.style.transform = 'rotate(' + rotation + 'deg)';
                    draggedShip.style.left = (startRect.left + H / 2 - W / 2) + 'px';
                    draggedShip.style.top = (startRect.top + W / 2 - H / 2) + 'px';
                    draggedShip.style.zIndex = '5';
                    draggedShip.style.opacity = '1';
                    document.body.appendChild(draggedShip);
                    placed = true;
                }
            }
        }
    }

    endDrag(placed);
});

document.addEventListener('pointercancel', function() { endDrag(false); });
window.addEventListener('blur', function() { if (draggedShip) endDrag(false); });



