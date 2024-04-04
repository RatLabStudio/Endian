// This file manages the state of the game, to let the program know what
// has and has not been loaded or taken care of.

export let currentState = "start";

export let states = {
    "start": 0, // Start of the program
    "loading": 1, // Initial Loading (should never be seen unless there's an error)
    "connecting_to_server": 2,
    "loading_simulation": 3, // Loading objects from the simulation (this takes the longest)
    "ready": 10 // Ready to play
};

export function getStateTitle(stateId) {
    return Object.keys(states)[stateId];
}

export function getStateId(state) {
    return states[state];
}

export function setState(state) {
    if (!states[state])
        return;

    currentState = states[state];
    document.getElementById("loadingState").innerHTML = capitalize(state);

    if (getStateId(state) >= getStateId("ready")) {
        document.getElementById("loadingScreen").style.visibility = "hidden";
    } else {
        document.getElementById("loadingScreen").style.visibility = "unset";
    }
}

function capitalize(string) {
    string = string.replace(" ", "_");
    let words = string.split("_");
    let returnStr = "";
    for (let i = 0; i < words.length; i++)
        returnStr += words[i][0].toUpperCase() + words[i].substring(1) + " ";
    return returnStr;
}