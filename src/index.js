import pool from './pool.js';
import { h, text, patch } from 'superfine';

const Screens = {
    TitleScreen: Symbol("TitleScreen"),
    GameScreen: Symbol("GameScreen"),
    GameOverScreen: Symbol("GameOverScreen")
};

const initialMoney = 100;

const initialScoring = {
    playerOneScore: 0,
    playerTwoScore: 0,
    roundsPlayed: 0,
    tiesPlayed: 0,
    result: "new-players",
    playerOneChoice: "nothing yet",
    playerTwoChoice: "nothing yet"
};

const initialState = {
    ...initialScoring,
    playerOneBio: {},
    playerTwoBio: {},
    error: false,
    money: initialMoney,
    gameNum: 1,
    screen: Screens.TitleScreen
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

async function betRound(state, playerBet) {
    const results = await Promise.all([
        fetch(state.players[0] + "/rps").then(res => res.text()),
        fetch(state.players[1] + "/rps").then(res => res.text())
    ]);

    let playerOneScore = state.playerOneScore;
    let playerTwoScore = state.playerTwoScore;
    let result = '';
    let tiesPlayed = state.tiesPlayed;
    let money = state.money;

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
        if (playerBet === 2) money += 10;
        else money -= 5;
    } else if (wins[results[0]][results[1]]) {
        result = "Player One Wins!";
        playerOneScore++;
        if (playerBet === 0) money += 10;
        else money -= 5;
    } else {
        result = "Player Two Wins!";
        playerTwoScore++;
        if (playerBet === 1) money += 10;
        else money -= 5;
    }

    let newState = {
        ...state,
        roundsPlayed: state.roundsPlayed + 1,
        tiesPlayed,
        result,
        playerOneChoice: results[0],
        playerTwoChoice: results[1],
        playerOneScore,
        playerTwoScore,
        money
    }

    if (money <= 0) {
        return setGameOver(newState);
    } else if (newState.roundsPlayed >= 10) {
        return setNextRound(newState);
    }

    return newState;
}

async function setGameOver(state) {
    return setScreen(state, Screens.GameOverScreen);
}

async function setNextRound(state) {
    return updatePlayers({
        ...state,
        gameNum: state.gameNum + 1
    });
}

async function setScreen(state, screen) {
    return {
        ...state,
        screen
    }
}

async function newGame(state) {
    return updatePlayers({ ...state, money: initialMoney, gameNum: 1 });
}

class Cel {
    static Screen(state) {
        console.log(state);
        if (state.screen === Screens.TitleScreen) {
            return Cel.TitleScreen(state);
        } else if (state.screen === Screens.GameScreen) {
            return Cel.GameScreen(state);
        } else if (state.screen === Screens.GameOverScreen) {
            return Cel.GameOverScreen(state);
        } else {
            return h("div", { class: "error" }, text("Unknown screen: " + state.screen));
        }
    }

    static TitleScreen(state) {
        return h("div", { class: "TitleScreen" }, [
            h("button", { onclick: async () => setState(await setScreen(await newGame(state), Screens.GameScreen)) }, text("Start game"))
        ])
    }

    static GameScreen(state) {
        return h("div", { class: "GameScreen" }, [
            Cel.PlayerArea(state),
            h("div", { class: "RoundsArea" }, [
                h("p", {}, text("Game " + state.gameNum)),
                h("p", {}, text((10 - state.roundsPlayed) + " rounds left! There were " + state.tiesPlayed + " ties.")),
            ]),
            h("div", { class: "ScoreArea" }, text([state.playerOneScore, state.playerTwoScore].join('-'))),
            h("div", { class: "ResultArea" }, text("Player One chose " + state.playerOneChoice + ". Player Two chose " + state.playerTwoChoice + ". " + state.result)),
            h("div", { class: "StatsArea" }, [
                h("p", {}, text("You have $" + state.money))
            ]),
            h("div", { class: "PlayArea" }, [
                h("button", {
                    class: "bet player-one",
                    onclick: async () => setState(await betRound(state, 0))
                }, text("I bet player one will win!")),
                h("button", {
                    class: "bet player-two",
                    onclick: async () => setState(await betRound(state, 1))
                }, text("No way! I'm betting on player two~")),
                h("button", {
                    class: "bet neither",
                    onclick: async () => setState(await betRound(state, 2))
                }, text("Um, actually! I foresee a tie **")),
                h("button", {
                    class: "new-players secondary",
                    onclick: async () => setState(await updatePlayers({ ...state, money: state.money - 20 }))
                }, text("Reset with New Players (-$20)"))
            ]
            )
        ]
        );
    }

    static GameOverScreen(state) {
        return h("div", { class: "GameOverScreen" }, [
            h("p", {}, text("Game over! You survived " + (state.gameNum - 1) + " games.")),
            h("button", { onclick: async () => setState(await setScreen(await newGame(state), Screens.GameScreen)) }, text("Play Again")),
            h("button", { class: "secondary", onclick: async () => setState(await setScreen(state, Screens.TitleScreen)) }, text("Quit"))
        ])
    }

    static Header() {
        return h("div", { class: "Header" }, [
            h("h1", {}, text("Rock! Paper! Scissors!"))
        ]);
    }

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
        Cel.Header(),
        Cel.Screen(state)
    ])
)

document.addEventListener("DOMContentLoaded", async () => {
    setState(await newGame(initialState));
});
