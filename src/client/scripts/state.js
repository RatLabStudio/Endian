// This file manages the state of the game, to let the program know what
// has and has not been loaded or taken care of.

export let currentState = "start";

export let states = {
    "start": 0, // Start of the program
    "loading": 1, // Initial Loading (should never be seen unless there's an error)
    "loading_simulation": 2, // Loading objects from the simulation (this takes the longest)
    "ready": 3 // Ready to play
};

export function getStateTitle(stateId) {
    return Object.keys(states)[stateId];
}

export function getStateId(state) {
    return states[state];
}

export function setState(state) {
    if (states[state])
        currentState = states[state];
}