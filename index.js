const readline = require('readline-sync');

const gridSizes = [4, 5, 6];
const shipsConfig = {
    4: [{ length: 2, count: 1 }, { length: 3, count: 1 }],
    5: [{ length: 2, count: 2 }, { length: 3, count: 1 }],
    6: [{ length: 2, count: 2 }, { length: 3, count: 2 }]
};

const WATER = '~';
const MISS = '❌';
const SHIP_2 = '🔵';
const SHIP_3 = '🟠';

function createGrid(size) {
    return Array.from({ length: size }, () => Array(size).fill(WATER));
}

function printGrid(grid, revealedCells) {
    const size = grid.length;
    const cellWidth = 4; // Width of each cell including padding
    const header = '   ' + Array.from({ length: size }, (_, i) => (i + 1).toString().padStart(cellWidth, ' ')).join(' ');

    // Print the top border
    console.log('  ' + '─'.repeat(header.length));
    console.log(header);

    // Print each row with borders
    grid.forEach((row, i) => {
        const rowLabel = String.fromCharCode(65 + i) + ' ';
        const rowData = row.map((cell, j) => {
            const cellContent = revealedCells.has(`${i},${j}`) ? cell : (cell === MISS ? MISS : WATER);
            return `│ ${cellContent.padStart(cellWidth - 1, ' ')} `;
        }).join('') + '│';
        console.log('│' + rowLabel + rowData);
        console.log('  ' + '─'.repeat(header.length));
    });
    console.log();
}

function canPlaceShip(grid, row, col, length, isHorizontal) {
    const size = grid.length;
    if (isHorizontal) {
        return col + length <= size && grid[row].slice(col, col + length).every(cell => cell === WATER);
    } else {
        return row + length <= size && grid.slice(row, row + length).every(r => r[col] === WATER);
    }
}

function placeShip(grid, length, symbol) {
    const size = grid.length;
    let placed = false;

    while (!placed) {
        const isHorizontal = Math.random() < 0.5;
        const row = Math.floor(Math.random() * (isHorizontal ? size : size - length + 1));
        const col = Math.floor(Math.random() * (isHorizontal ? size - length + 1 : size));

        if (canPlaceShip(grid, row, col, length, isHorizontal)) {
            for (let i = 0; i < length; i++) {
                if (isHorizontal) {
                    grid[row][col + i] = symbol;
                } else {
                    grid[row + i][col] = symbol;
                }
            }
            placed = true;
        }
    }
}

function placeAllShips(grid, ships) {
    ships.forEach(ship => {
        const symbol = ship.length === 2 ? SHIP_2 : SHIP_3;
        for (let i = 0; i < ship.count; i++) {
            placeShip(grid, ship.length, symbol);
        }
    });
}

function printVictoryMessage() {
    console.log(`
========
__   _______ _   _   _    _ _____ _   _
\\ \\ / /  _  | | | | | |  | |_   _| \\ | |
 \\ V /| | | | | | | | |  | | | | |  \\| |
  \\ / | | | | | | | | |/\\| | | | | . ' |
  | | \\ \\_/ / |_| | \\  / \\ /_| |_| |\\  |
  \\_/  \\___/ \\___/   \\/  \\/ \\___/\\_| \\_|
========
`);
}

function main() {
    console.log(`
    _____       ___   _____   _____   _       _____   _____   _   _   _   _____
   |  _  |     /   | |_   _| |_   _| | |     | ____| /  ___/ | | | | | | |  _  |
   | |_| |    / /| |   | |     | |   | |     | |__   | |___  | |_| | | | | |_| |
   |  _ {    / / | |   | |     | |   | |     |  __|  |___    |  _  | | | |  ___/
   | |_| |  / /  | |   | |     | |   | |___  | |___   ___| | | | | | | | | |
   |_____/ /_/   |_|   |_|     |_|   |_____| |_____| /_____/ |_| |_| |_| |_|
   `);

    const size = gridSizes[readline.keyInSelect(gridSizes.map(s => `${s}x${s}`), 'Choose grid size:')];

    if (size === undefined) {
        console.log('Exiting...');
        return;
    }

    const grid = createGrid(size);
    const ships = shipsConfig[size];
    placeAllShips(grid, ships);

    // Create a map to track ship sections and hits
    const shipSections = new Map();
    const shipSymbols = new Set();

    ships.forEach(ship => {
        const symbol = ship.length === 2 ? SHIP_2 : SHIP_3;
        shipSymbols.add(symbol);
        for (let i = 0; i < ship.count; i++) {
            // Find each section of each ship and track hits
            const sections = [];
            for (let row = 0; row < size; row++) {
                for (let col = 0; col < size; col++) {
                    if (grid[row][col] === symbol) {
                        sections.push({ row, col });
                    }
                }
            }
            shipSections.set(symbol + i, { sections, hits: new Set() });
        }
    });

    console.clear();
    console.log('Grid created. Here is your empty grid:');
    printGrid(grid, new Set());

    let remainingShips = new Set(shipSymbols);
    let revealedCells = new Set();
    let message = '';

    console.log('Let\'s start the game!');

    while (remainingShips.size > 0) {
        console.clear();
        printGrid(grid, revealedCells);
        console.log(message);
        message = '';

        const guess = readline.question('Enter coordinates (e.g., A1) or type "exit" to quit: ').toUpperCase();

        if (guess === 'EXIT') {
            console.log('Exiting game...');
            return;
        }

        const row = guess.charCodeAt(0) - 65;
        const col = parseInt(guess.slice(1)) - 1;

        if (row >= 0 && row < size && col >= 0 && col < size) {
            if (grid[row][col] === SHIP_2 || grid[row][col] === SHIP_3) {
                const shipSymbol = grid[row][col];
                const shipKey = Array.from(shipSections.keys()).find(key => key.startsWith(shipSymbol));
                const shipData = shipSections.get(shipKey);

                shipData.hits.add(`${row},${col}`);
                revealedCells.add(`${row},${col}`);
                
                if (shipData.hits.size === shipData.sections.length) {
                    remainingShips.delete(shipSymbol);
                    message = `Hit and sunk!`;
                } else {
                    message = `Hit!`;
                }
            } else if (grid[row][col] === WATER) {
                grid[row][col] = MISS;
                message = 'Miss.';
            } else {
                message = 'Already guessed that location.';
            }
        } else {
            message = 'Invalid coordinates. Try again.';
        }
    }

    console.clear();
    printVictoryMessage();
    printGrid(grid, revealedCells);
}

main();
