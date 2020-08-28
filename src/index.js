import pool from './pool.js';
import { h, text, patch } from 'superfine';

const initialScoring = {
    playerOneScore: 0,
    playerTwoScore: 0,
    roundsPlayed: 0,
    tiesPlayed: 0,
    result: "new-players",
    playerOneChoice: "nothing yet",
    playerTwoChoice: "nothing yet",
};

const initialState = {
    ...initialScoring,
    playerOneBio: {},
    playerTwoBio: {},
    error: false
};

async function updatePlayers(state) {
    let playerOne = pool[Math.floor(Math.random() * pool.length)]
    let playerTwo = playerOne;
    while (playerOne === playerTwo && pool.length > 1) {
        playerTwo = pool[Math.floor(Math.random() * pool.length)]
    }

    try {
        const [playerOneBio, playerTwoBio] = await Promise.all([
            fetch(playerOne + "/bio.json").then(res => res.json()),
            fetch(playerTwo + "/bio.json").then(res => res.json())
        ]);

        return {
            ...state,
            ...initialScoring,
            players: [playerOne, playerTwo],
            playerOneBio,
            playerTwoBio,
            error: false
        }
    } catch {
        return {
            ...state,
            ...initialScoring,
            players: [null, null],
            playerOneBio: {},
            playerTwoBio: {},
            error: "Had trouble fetching the player. Please try again."
        }
    }
}

async function playRound(state) {
    const results = await Promise.all([
        fetch(state.players[0] + "/rps").then(res => res.text()),
        fetch(state.players[1] + "/rps").then(res => res.text())
    ]);

    let playerOneScore = state.playerOneScore;
    let playerTwoScore = state.playerTwoScore;
    let result = '';
    let tiesPlayed = state.tiesPlayed;

    const wins = {
        "rock": {
            "scissors": true
        },
        "paper": {
            "rock": true
        },
        "scissors": {
            "paper": true
        }
    };

    if (results[0] === results[1]) {
        result = "Tie!";
        tiesPlayed++;
    } else if (wins[results[0]][results[1]]) {
        result = "Player One Wins!";
        playerOneScore++;
    } else {
        result = "Player Two Wins!";
        playerTwoScore++;
    }

    return {
        ...state,
        roundsPlayed: state.roundsPlayed + 1,
        tiesPlayed,
        result,
        playerOneChoice: results[0],
        playerTwoChoice: results[1],
        playerOneScore,
        playerTwoScore
    }
}

class Cel {
    static PlayerArea(state) {
        if (state.error) {
            return h("div", { class: "PlayerArea error" }, text(state.error));
        }

        return h("div", { class: "PlayerArea" }, [
            Cel.Player(state.playerOneBio),
            Cel.Player(state.playerTwoBio)
        ])
    }
    static Player(bio) {
        return h("div", { class: "PlayerArea-Player" }, [
            h("h2", { class: "Player-Name" }, text(bio.name)),
            h("img", { class: "Player-Image", alt: bio.name, src: bio.image_url }),
            h("p", { class: "Player-Description" }, text(bio.strategy))
        ]);
    }
}

const setState = (state) => patch(
    document.getElementById("app"),
    h("main", {}, [
        h("div", { class: "Header" }, [
            h("h1", {}, text("Rock! Paper! Scissors!"))
        ]),
        Cel.PlayerArea(state),
        h("div", { class: "RoundsArea" }, text(state.roundsPlayed + " rounds played. " + state.tiesPlayed + " were ties.")),
        h("div", { class: "ScoreArea" }, text([state.playerOneScore, state.playerTwoScore].join('-'))),
        h("div", { class: "ResultArea" }, text("Player One chose " + state.playerOneChoice + ". Player Two chose " + state.playerTwoChoice + ". " + state.result)),
        h("div", { class: "PlayArea" }, [
            h("button", {
                class: "play",
                onclick: async () => setState(await playRound(state))
            }, text("Rock! Paper! Scissors!")),
            h("button", {
                class: "new-players secondary",
                onclick: async () => setState(await updatePlayers(state))
            }, text("Reset with New Players"))
        ])
    ])
)

document.addEventListener("DOMContentLoaded", async () => {
    setState(await updatePlayers(initialState));
});
