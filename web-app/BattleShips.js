/**
 * @module BattleShips
 * Pure game logic for Battleships.
 * Contains no DOM manipulation or side effects.
 * All functions take state and return new values without mutation.
 */

import R from "./ramda.js";

/**
 * @typedef {object} GameState
 * @property {string[]} firedCells        - Cell IDs that have been fired at.
 * @property {number}   currentPlayer     - Whose turn it is: 1 or 2.
 * @property {number}   p1NodesRemaining  - Ship nodes still alive for player 1.
 * @property {number}   p2NodesRemaining  - Ship nodes still alive for player 2.
 * @property {string[]} occupiedCells     - Cell IDs that contain a ship node.
 * @property {string[][]} shipCells       - One cell-ID array per placed ship.
 * @property {string[]} sunkenShips       - First cell ID of each fully sunk ship.
 */

/**
 * @typedef {object} FireResult
 * @property {GameState}    state  - Updated game state after the shot.
 * @property {boolean}      hit    - True if the shot struck a ship node.
 * @property {boolean}      sunk   - True if the shot sank a whole ship.
 * @property {string|null}  winner - "Player 1", "Player 2", or null.
 */

/**
 * Counts the total ship nodes for a given grid by summing each ship's length.
 * Uses R.pipe to compose filtering, mapping to lengths, and summing.
 * @param {string[][]} shipCells - All placed ships' cell arrays.
 * @param {string} prefix - Grid prefix to filter by (e.g. "Player1Grid").
 * @returns {number} Total node count for that grid.
 */
function countNodesForGrid(shipCells, prefix) {
    return R.pipe(
        R.filter(function (cells) { return cells[0].startsWith(prefix); }),
        R.map(R.length),
        R.sum
    )(shipCells);
}

/**
 * Creates the initial game state from the two players' placed ships.
 * Node counts are computed from shipCells rather than hardcoded.
 * @param {string[]} occupiedCells - Cell IDs that contain ship nodes.
 * @param {string[][]} shipCells   - One cell-ID array per placed ship.
 * @returns {GameState} The starting game state.
 */
function createGameState(occupiedCells, shipCells) {
    return {
        firedCells: [],
        currentPlayer: 1,
        p1NodesRemaining: countNodesForGrid(shipCells, "Player1Grid"),
        p2NodesRemaining: countNodesForGrid(shipCells, "Player2Grid"),
        occupiedCells: occupiedCells,
        shipCells: shipCells,
        sunkenShips: []
    };
}

/**
 * Returns whether a cell has already been fired at.
 * Uses R.includes to test membership in the fired-cells array.
 * @param {GameState} state  - Current game state.
 * @param {string}    cellId - Cell ID to test.
 * @returns {boolean} True if the cell has been fired at.
 */
function hasBeenFired(state, cellId) {
    return R.includes(cellId, state.firedCells);
}

/**
 * Returns whether a cell is occupied by a ship node.
 * Uses R.includes to test membership in the occupied-cells array.
 * @param {GameState} state  - Current game state.
 * @param {string}    cellId - Cell ID to test.
 * @returns {boolean} True if the cell contains a ship node.
 */
function isOccupied(state, cellId) {
    return R.includes(cellId, state.occupiedCells);
}

/**
 * Alternates the player number between 1 and 2.
 * @param {number} player - Current player (1 or 2).
 * @returns {number} The other player.
 */
function otherPlayer(player) {
    return player === 1 ? 2 : 1;
}

/**
 * Determines the winner from remaining node counts, or null if undecided.
 * @param {number} p1Nodes - Player 1 nodes remaining after the shot.
 * @param {number} p2Nodes - Player 2 nodes remaining after the shot.
 * @returns {string|null} "Player 1", "Player 2", or null.
 */
function determineWinner(p1Nodes, p2Nodes) {
    if (p1Nodes === 0) {
        return "Player 2";
    }
    if (p2Nodes === 0) {
        return "Player 1";
    }
    return null;
}

/**
 * Finds the cell array of a ship newly sunk by the latest hit, or undefined.
 * A ship is newly sunk when its first cell is not already in sunkenShips,
 * it contains the hit cell, and R.all of its cells are now in firedCells.
 * Uses R.find so no index tracking is required.
 * @param {GameState} state         - Game state before the shot.
 * @param {string[]}  newFiredCells - Fired cells including the current shot.
 * @param {string}    cellId        - The cell that was just hit.
 * @returns {string[]|undefined} The sunk ship's cell array, or undefined.
 */
function findNewlySunkShip(state, newFiredCells, cellId) {
    return R.find(
        function (cells) {
            return (
                !R.includes(cells[0], state.sunkenShips) &&
                R.includes(cellId, cells) &&
                R.all(function (id) { return R.includes(id, newFiredCells); }, cells)
            );
        },
        state.shipCells
    );
}

/**
 * Processes a shot fired at a cell and returns the updated state and outcome.
 * The caller must check hasBeenFired before calling this function.
 * On a miss the active player switches; on a hit it stays until victory.
 * @param {GameState} state  - Current game state.
 * @param {string}    cellId - The cell ID being fired at.
 * @returns {FireResult} The shot result and updated state.
 */
function fireAt(state, cellId) {
    const newFiredCells = R.append(cellId, state.firedCells);
    const hit = isOccupied(state, cellId);

    if (!hit) {
        return {
            state: Object.assign({}, state, {
                firedCells: newFiredCells,
                currentPlayer: otherPlayer(state.currentPlayer)
            }),
            hit: false,
            sunk: false,
            winner: null
        };
    }

    const sunkShip = findNewlySunkShip(state, newFiredCells, cellId);
    const sunk = sunkShip !== undefined;
    const newSunkenShips = sunk
        ? R.append(sunkShip[0], state.sunkenShips)
        : state.sunkenShips;

    const isP1Cell = cellId.startsWith("Player1Grid");
    const newP1Nodes = isP1Cell
        ? state.p1NodesRemaining - 1
        : state.p1NodesRemaining;
    const newP2Nodes = isP1Cell
        ? state.p2NodesRemaining
        : state.p2NodesRemaining - 1;

    const winner = determineWinner(newP1Nodes, newP2Nodes);
    const nextPlayer = winner
        ? state.currentPlayer
        : otherPlayer(state.currentPlayer);

    return {
        state: Object.assign({}, state, {
            firedCells: newFiredCells,
            p1NodesRemaining: newP1Nodes,
            p2NodesRemaining: newP2Nodes,
            sunkenShips: newSunkenShips,
            currentPlayer: nextPlayer
        }),
        hit: true,
        sunk: sunk,
        winner: winner
    };
}

/**
 * Counts ships placed on a specific player's grid.
 * Uses R.pipe to compose R.filter and R.length.
 * @param {string[][]} shipCellsArray - All placed ships' cell arrays.
 * @param {string}     gridPrefix     - Grid prefix to filter by.
 * @returns {number} Number of ships on that grid.
 */
function countShipsPlaced(shipCellsArray, gridPrefix) {
    return R.pipe(
        R.filter(function (cells) { return cells[0].startsWith(gridPrefix); }),
        R.length
    )(shipCellsArray);
}

/**
 * Returns the current player number from state.
 * @param {GameState} state - Current game state.
 * @returns {number} Current player (1 or 2).
 */
function getCurrentPlayer(state) {
    return state.currentPlayer;
}

export {
    createGameState,
    hasBeenFired,
    fireAt,
    countShipsPlaced,
    getCurrentPlayer
};
