[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/H6lPFq0J)
# Computing 2 Coursework Submission.
**CID**: [02560700]

This is the submission template for your Computing 2 Applications coursework submission.

## Checklist
### Install dependencies locally
This template relies on a a few packages from the Node Package Manager, npm.
To install them run the following commands in the terminal.
```properties
npm install
```
These won't be uploaded to your repository because of the `.gitignore`.
I'll run the same commands when I download your repos.

### Game Module – API
*You will produce an API specification, i.e. a list of function names and their signatures, for a Javascript module that represents the state of your game and the operations you can perform on it that advances the game or provides information.*

- [x] Include a `.js ` module file in `/web-app` containing the API using `jsdoc`.
- [x] Update `/jsdoc.json` to point to this module in `.source.include` (line 7)
- [x] Compile jsdoc using the run configuration `Generate Docs`
- [x] Check the generated docs have compiled correctly.

### Game Module – Implementation
*You will implement, in Javascript, the module you specified above. Such that your game can be simulated in code, e.g. in the debug console.*

- [x] The file above should be fully implemented.

### Unit Tests – Specification
*For the Game module API you have produced, write a set of unit tests descriptions that specify the expected behaviour of one aspect of your API, e.g. you might pick the win condition, or how the state changes when a move is made.*

The tests specify the behaviour of all exported functions across the full game lifecycle:

**`createGameState`** — initial state is correct:
- Starts with no cells fired, player 1's turn, and no sunken ships
- Node counts are computed from the placed ships rather than hardcoded

**`hasBeenFired`** — cell fired tracking:
- Returns false for unfired cells and true after a cell has been fired at
- Does not affect adjacent cells

**`getCurrentPlayer`** — turn management:
- Starts on player 1, advances after each shot, and alternates correctly

**`fireAt`** — the core shot mechanic:
- A miss reports `hit: false`, records the cell, and switches the active player
- A hit reports `hit: true`, reduces the target player's node count, and switches the active player
- A shot that completes a ship reports `sunk: true`
- A previously sunk ship is not reported as sunk again on subsequent hits
- A winning shot reports the correct winner
- Does not mutate the original state object (pure function guarantee)

**`countShipsPlaced`** — placement tracking:
- Correctly counts ships on each player's grid, including zero and multiple ships

- [x] Write unit test definitions in `/web-app/tests`.
- [x] Check the headings appear in the Testing sidebar.

### Unit Tests – Implementation
*Implement in code the unit tests specified above.*

- [x] Implement the tests above.
- [x] Run with `npm test` from the project root.

### Web Application
*Produce a web application that allows a user to interface with your game module.*

- Implement in `/web-app`
  - [x] `index.html`
  - [x] `default.css`
  - [x] `main.js`
  - [x] `BattleShips.js` – pure game logic module
  - [x] `ramda.js` – functional programming library
  - [x] `assets/` – SVG ship graphics, audio files and favicon

### Finally
- [ ] Push to GitHub.
- [ ] Sync the changes.
- [ ] Check submission on GitHub website.
