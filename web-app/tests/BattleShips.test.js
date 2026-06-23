import assert from "assert";
import {
    createGameState,
    hasBeenFired,
    fireAt,
    countShipsPlaced,
    getCurrentPlayer
} from "../BattleShips.js";

// ---------------------------------------------------------------------------
// Fixtures
// Two minimal ships — one per player — keeps tests easy to reason about.
// ---------------------------------------------------------------------------
const p1Ship = ["Player1Grid_A1", "Player1Grid_A2"];
const p2Ship = ["Player2Grid_B1", "Player2Grid_B2"];
const allShips = [p1Ship, p2Ship];
const allOccupied = [
    "Player1Grid_A1", "Player1Grid_A2",
    "Player2Grid_B1", "Player2Grid_B2"
];

function freshState() {
    return createGameState(allOccupied, allShips);
}

// ---------------------------------------------------------------------------
// createGameState
// ---------------------------------------------------------------------------
describe("createGameState", function () {
    it("starts with no cells having been fired at", function () {
        assert.deepStrictEqual(freshState().firedCells, []);
    });

    it("starts on player 1's turn", function () {
        assert.strictEqual(freshState().currentPlayer, 1);
    });

    it("counts player 1's nodes from the placed ships rather than a fixed value", function () {
        // p1Ship has 2 cells, so p1NodesRemaining should be 2
        assert.strictEqual(freshState().p1NodesRemaining, 2);
    });

    it("counts player 2's nodes from the placed ships rather than a fixed value", function () {
        assert.strictEqual(freshState().p2NodesRemaining, 2);
    });

    it("reflects a larger fleet in the node count", function () {
        const bigP1Ship = ["Player1Grid_C1", "Player1Grid_C2", "Player1Grid_C3"];
        const state = createGameState(
            [...allOccupied, ...bigP1Ship],
            [p1Ship, p2Ship, bigP1Ship]
        );
        assert.strictEqual(state.p1NodesRemaining, 5); // 2 + 3
    });

    it("starts with no sunken ships", function () {
        assert.deepStrictEqual(freshState().sunkenShips, []);
    });
});

// ---------------------------------------------------------------------------
// hasBeenFired
// ---------------------------------------------------------------------------
describe("hasBeenFired", function () {
    it("returns false for a cell that has not yet been fired at", function () {
        assert.strictEqual(hasBeenFired(freshState(), "Player2Grid_B1"), false);
    });

    it("returns true for a cell that was fired at in a previous turn", function () {
        const { state } = fireAt(freshState(), "Player2Grid_B1");
        assert.strictEqual(hasBeenFired(state, "Player2Grid_B1"), true);
    });

    it("returns false for a cell adjacent to a fired cell", function () {
        const { state } = fireAt(freshState(), "Player2Grid_B1");
        assert.strictEqual(hasBeenFired(state, "Player2Grid_B2"), false);
    });
});

// ---------------------------------------------------------------------------
// getCurrentPlayer
// ---------------------------------------------------------------------------
describe("getCurrentPlayer", function () {
    it("is player 1 at the start of the game", function () {
        assert.strictEqual(getCurrentPlayer(freshState()), 1);
    });

    it("becomes player 2 after player 1 takes a shot", function () {
        const { state } = fireAt(freshState(), "Player2Grid_C5"); // miss
        assert.strictEqual(getCurrentPlayer(state), 2);
    });

    it("returns to player 1 after player 2 takes a shot", function () {
        const { state: s1 } = fireAt(freshState(), "Player2Grid_C5"); // p1 miss
        const { state: s2 } = fireAt(s1, "Player1Grid_D3");           // p2 miss
        assert.strictEqual(getCurrentPlayer(s2), 1);
    });
});

// ---------------------------------------------------------------------------
// fireAt — miss
// ---------------------------------------------------------------------------
describe("fireAt on an unoccupied cell (miss)", function () {
    it("reports hit as false", function () {
        const result = fireAt(freshState(), "Player2Grid_C5");
        assert.strictEqual(result.hit, false);
    });

    it("reports sunk as false", function () {
        const result = fireAt(freshState(), "Player2Grid_C5");
        assert.strictEqual(result.sunk, false);
    });

    it("reports no winner", function () {
        const result = fireAt(freshState(), "Player2Grid_C5");
        assert.strictEqual(result.winner, null);
    });

    it("records the missed cell so it cannot be fired at again", function () {
        const { state } = fireAt(freshState(), "Player2Grid_C5");
        assert.strictEqual(hasBeenFired(state, "Player2Grid_C5"), true);
    });

    it("passes the turn to the other player", function () {
        const { state } = fireAt(freshState(), "Player2Grid_C5");
        assert.strictEqual(state.currentPlayer, 2);
    });
});

// ---------------------------------------------------------------------------
// fireAt — hit (ship not yet sunk)
// ---------------------------------------------------------------------------
describe("fireAt on an occupied cell (hit, ship survives)", function () {
    it("reports hit as true", function () {
        const result = fireAt(freshState(), "Player2Grid_B1");
        assert.strictEqual(result.hit, true);
    });

    it("reports sunk as false when only part of a ship has been hit", function () {
        // p2Ship has two cells; hitting only the first should not sink it
        const result = fireAt(freshState(), "Player2Grid_B1");
        assert.strictEqual(result.sunk, false);
    });

    it("reports no winner when the game is still ongoing", function () {
        const result = fireAt(freshState(), "Player2Grid_B1");
        assert.strictEqual(result.winner, null);
    });

    it("records the hit cell as fired", function () {
        const { state } = fireAt(freshState(), "Player2Grid_B1");
        assert.strictEqual(hasBeenFired(state, "Player2Grid_B1"), true);
    });

    it("reduces the correct player's node count by one", function () {
        // Hitting a Player2Grid cell reduces p2NodesRemaining
        const { state } = fireAt(freshState(), "Player2Grid_B1");
        assert.strictEqual(state.p2NodesRemaining, 1);
    });

    it("passes the turn to the other player after a hit", function () {
        const { state } = fireAt(freshState(), "Player2Grid_B1");
        assert.strictEqual(state.currentPlayer, 2);
    });

    it("does not mutate the original state", function () {
        const state = freshState();
        const before = JSON.stringify(state);
        fireAt(state, "Player2Grid_B1");
        assert.strictEqual(JSON.stringify(state), before);
    });
});

// ---------------------------------------------------------------------------
// fireAt — ship sunk
// ---------------------------------------------------------------------------
describe("fireAt — sinking a ship", function () {
    it("reports sunk as true when the last remaining cell of a ship is hit", function () {
        const { state: s1 } = fireAt(freshState(), "Player2Grid_B1");
        const result = fireAt(s1, "Player2Grid_B2");
        assert.strictEqual(result.sunk, true);
    });

    it("does not report sunk when only the first cell of a ship has been hit", function () {
        const result = fireAt(freshState(), "Player2Grid_B1");
        assert.strictEqual(result.sunk, false);
    });

    it("does not report a previously sunk ship as sunk again on a later hit", function () {
        // Give player 2 a second ship so we can hit it after sinking the first
        const p2Ship2 = ["Player2Grid_C1", "Player2Grid_C2"];
        const state = createGameState(
            [...p1Ship, ...p2Ship, ...p2Ship2],
            [p1Ship, p2Ship, p2Ship2]
        );
        const { state: s1 } = fireAt(state, "Player2Grid_B1"); // hit ship 1
        const { state: s2 } = fireAt(s1, "Player2Grid_B2");    // sink ship 1
        const result = fireAt(s2, "Player2Grid_C1");            // hit ship 2, not a sink
        assert.strictEqual(result.sunk, false);
    });

    it("records the sunk ship so subsequent hits do not retrigger a sink", function () {
        const p2Ship2 = ["Player2Grid_C1", "Player2Grid_C2"];
        const state = createGameState(
            [...p1Ship, ...p2Ship, ...p2Ship2],
            [p1Ship, p2Ship, p2Ship2]
        );
        const { state: s1 } = fireAt(state, "Player2Grid_B1");
        const { state: s2 } = fireAt(s1, "Player2Grid_B2");    // ship 1 sunk
        const { state: s3 } = fireAt(s2, "Player2Grid_C1");    // hit ship 2
        const result = fireAt(s3, "Player2Grid_C2");            // sink ship 2
        assert.strictEqual(result.sunk, true); // ship 2 sunk, not ship 1 again
    });
});

// ---------------------------------------------------------------------------
// fireAt — winning shot
// ---------------------------------------------------------------------------
describe("fireAt — game won", function () {
    it("reports player 1 as winner when all of player 2's nodes are destroyed", function () {
        const { state: s1 } = fireAt(freshState(), "Player2Grid_B1"); // hit
        const result = fireAt(s1, "Player2Grid_B2");                   // sink → win
        assert.strictEqual(result.winner, "Player 1");
    });

    it("reports player 2 as winner when all of player 1's nodes are destroyed", function () {
        const { state: s1 } = fireAt(freshState(), "Player1Grid_A1"); // hit
        const result = fireAt(s1, "Player1Grid_A2");                   // sink → win
        assert.strictEqual(result.winner, "Player 2");
    });

    it("reports no winner when the game is not yet over", function () {
        const { state } = fireAt(freshState(), "Player2Grid_B1"); // one node hit, one remains
        assert.strictEqual(fireAt(state, "Player2Grid_C9").winner, null);
    });
});

// ---------------------------------------------------------------------------
// countShipsPlaced
// ---------------------------------------------------------------------------
describe("countShipsPlaced", function () {
    it("returns 0 when no ships have been placed on the given grid", function () {
        const placed = [["Player1Grid_A1", "Player1Grid_A2"]];
        assert.strictEqual(countShipsPlaced(placed, "Player2Grid"), 0);
    });

    it("counts a single ship on the given grid", function () {
        const placed = [
            ["Player1Grid_A1", "Player1Grid_A2"],
            ["Player2Grid_B1", "Player2Grid_B2"]
        ];
        assert.strictEqual(countShipsPlaced(placed, "Player1Grid"), 1);
    });

    it("counts multiple ships on the same grid", function () {
        const placed = [
            ["Player1Grid_A1", "Player1Grid_A2"],
            ["Player1Grid_B1", "Player1Grid_B2", "Player1Grid_B3"],
            ["Player2Grid_C1", "Player2Grid_C2"]
        ];
        assert.strictEqual(countShipsPlaced(placed, "Player1Grid"), 2);
    });

    it("does not count ships belonging to the other grid", function () {
        const placed = [
            ["Player1Grid_A1", "Player1Grid_A2"],
            ["Player2Grid_B1", "Player2Grid_B2"]
        ];
        assert.strictEqual(countShipsPlaced(placed, "Player2Grid"), 1);
    });
});
