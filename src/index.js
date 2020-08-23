let roundsPlayed = 0;
let tiesPlayed = 0;
let result = "new-game";
let playerOneChoice = "nothing yet";
let playerTwoChoice = "nothing yet";
const scores = [0, 0];
const pool = [
    "https://the-coinsman-rps.ceagrass.workers.dev",
    "https://rps.andrewgrass.workers.dev",
    "https://the-burger-rps.ceagrass.workers.dev",
    "https://yugiboy-rps.ceagrass.workers.dev"
]
const players = [null, null];
document.addEventListener("DOMContentLoaded", () => {
    newPlayers();
    updateScores(scores);
    let playButton = document.querySelector("button.play");
    playButton.addEventListener("click", async () => {
        await playRound();
        updateScores();
    })
    let newPlayersButton = document.querySelector("button.new-players");
    newPlayersButton.addEventListener("click", async () => {
        newPlayers();
        updateScores();
    });
});

function newPlayers() {
    roundsPlayed = 0;
    tiesPlayed = 0;
    result = "new-players";
    playerOneChoice = "nothing yet";
    playerTwoChoice = "nothing yet";
    scores[0] = 0;
    scores[1] = 0;
    players[0] = pool[Math.floor(Math.random() * pool.length)]
    players[1] = players[0];
    while (players[0] === players[1] && pool.length > 1) {
        players[1] = pool[Math.floor(Math.random() * pool.length)]
    }
    updatePlayerArea();
}

function setPlayerArea(area, bio) {
    const playerName = document.createElement("h2");
    playerName.classList.add("Player-Name");
    playerName.innerText = bio.name;
    area.appendChild(playerName);
    const playerImage = document.createElement("img");
    playerImage.classList.add("Player-Image");
    playerImage.src = bio.image_url;
    area.appendChild(playerImage);
    const playerDescription = document.createElement("p");
    playerDescription.classList.add("Player-Description");
    playerDescription.innerText = bio.strategy;
    area.appendChild(playerDescription);
}

async function updatePlayerArea() {
    const playerOneArea = document.querySelector(".PlayerArea .PlayerOne")
    const playerTwoArea = document.querySelector(".PlayerArea .PlayerTwo")
    Promise.all([
        fetch(players[0] + "/bio.json").then(res => res.json()),
        fetch(players[1] + "/bio.json").then(res => res.json())
    ]).then(([playerOneBio, playerTwoBio]) => {
        playerOneArea.innerHTML = "";
        setPlayerArea(playerOneArea, playerOneBio);

        playerTwoArea.innerHTML = "";
        setPlayerArea(playerTwoArea, playerTwoBio);
    })
        .catch(err => {
            playerOneArea.innerText = "Had trouble fetching the player. Please try again."
            playerTwoArea.innerText = "Had trouble fetching the player. Please try again."
        })
}

function updateScores() {
    document.querySelector(".RoundsArea").innerText = roundsPlayed + " rounds played. " + tiesPlayed + " were ties.";
    document.querySelector(".ScoreArea").innerText = scores.join("-");
    document.querySelector(".ResultArea").innerText = "Player One chose " + playerOneChoice + ". Player Two chose " + playerTwoChoice + ". " + result;
}

async function playRound() {
    const results = await Promise.all([
        fetch(players[0] + "/rps").then(res => res.text()),
        fetch(players[1] + "/rps").then(res => res.text())
    ]);

    playerOneChoice = results[0];
    playerTwoChoice = results[1];

    if (results[0] === "rock" && results[1] === "rock") {
        result = "Tie!";
        tiesPlayed++;
    } else if (results[0] === "rock" && results[1] === "paper") {
        result = "Player Two Wins!";
        scores[1]++;
    } else if (results[0] === "rock" && results[1] === "scissors") {
        result = "Player One Wins!";
        scores[0]++;
    } else if (results[0] === "paper" && results[1] === "paper") {
        result = "Tie!";
        tiesPlayed++;
    } else if (results[0] === "paper" && results[1] === "scissors") {
        result = "Player Two Wins!";
        scores[1]++;
    } else if (results[0] === "paper" && results[1] === "rock") {
        result = "Player One Wins!";
        scores[0]++;
    } else if (results[0] === "scissors" && results[1] === "scissors") {
        result = "Tie!";
        tiesPlayed++;
    } else if (results[0] === "scissors" && results[1] === "rock") {
        result = "Player Two Wins!";
        scores[1]++;
    } else if (results[0] === "scissors" && results[1] === "paper") {
        result = "Player One Wins!";
        scores[0]++;
    }

    roundsPlayed++;
}