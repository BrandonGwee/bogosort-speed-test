document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const timerDisplay = document.getElementById('timer');
    const gameContainer = document.getElementById('game-container');
    const winSound = document.getElementById('ding');

    // Game State Variables
    let array = [];
    const initialArray = [1, 2, 3, 4, 5]; // For resetting
    let isShuffled = false;
    let timerInterval = null;
    let startTime = 0;
    let lastInputTime = 0;
    const inputDebounceTime = 1; // milliseconds to prevent holding inputs
    let isInputDown = false;

    // Box shaking variables (UPDATED)
    let currentShakeOffset = 0; // The current offset applied
    const maxShakeOffset = 10; // Max pixels to push out on input
    const shakeDecayRate = 0.8; // How quickly the shake diminishes (0.9 means 90% remains each frame)
    const ABSOLUTE_MAX_SHAKE = 25; // Define a hard limit for shake intensity

    // Bar drawing constants
    const barWidth = 40;
    const barSpacing = 10;
    const maxBarHeight = 150;
    const canvasPaddingBottom = 50; // Space for the button

    // Button variables
    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonY = canvas.height - buttonHeight - 10; // Position above canvas bottom
    const initButtonText = "Shuffle!"
    let buttonText = initButtonText;

    // --- Utility Functions ---

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    function isSorted(arr) {
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] > arr[i + 1]) {
                return false;
            }
        }
        return true;
    }

    function drawBars() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

        const totalBarsWidth = (barWidth + barSpacing) * array.length - barSpacing;
        const startX = (canvas.width - totalBarsWidth) / 2;

        for (let i = 0; i < array.length; i++) {
            const barHeight = (array[i] / 7) * maxBarHeight;
            const x = startX + i * (barWidth + barSpacing);
            const y = canvas.height - canvasPaddingBottom - barHeight;

            ctx.fillStyle = '#4CAF50'; // Green bars
            ctx.fillRect(x, y, barWidth, barHeight);
            ctx.strokeStyle = '#333';
            ctx.strokeRect(x, y, barWidth, barHeight);
        }
    }

    function drawButton() {
        const buttonX = (canvas.width - buttonWidth) / 2;

        // Determine button color based on buttonText
        if (buttonText === "Shuffle!") {
            ctx.fillStyle = '#2196F3'; // Blue for "Shuffle!"
        } else if (buttonText === "Sort!") {
            ctx.fillStyle = '#FFC107'; // Orange for "Sort!"
        } else {
            ctx.fillStyle = '#CCCCCC'; // Fallback
        }

        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(buttonText, buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);
    }

    function animate() {
        // Apply shake effect based on currentShakeOffset (UPDATED)
        if (currentShakeOffset > 0.5) { // Only apply transform if there's a noticeable shake
            const shakeX = (Math.random() > 0.5 ? 1 : -1) * currentShakeOffset;
            const shakeY = (Math.random() > 0.5 ? 1 : -1) * currentShakeOffset;
            gameContainer.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
            currentShakeOffset *= shakeDecayRate; // Decay the shake
        } else {
            gameContainer.style.transform = 'none'; // Reset transform if shake is minimal
            currentShakeOffset = 0; // Ensure it's exactly zero
        }

        drawBars();
        drawButton();
        requestAnimationFrame(animate);
    }

    function startTimer() {
        startTime = performance.now();
        timerInterval = setInterval(() => {
            const elapsedTime = (performance.now() - startTime) / 1000;
            timerDisplay.textContent = `${elapsedTime.toFixed(3)}s`;
        }, 10); // Update every 10ms for precision
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    function resetGameToInitialState() {
        array = [...initialArray];
        isShuffled = false;
        stopTimer();
        timerDisplay.textContent = "0.000s"; // Clear timer display only on full reset
        buttonText = initButtonText;
        lastInputTime = 0; // Reset debounce
        gameContainer.style.transform = 'none'; // Ensure reset if shaking was active
        currentShakeOffset = 0; // Reset shake offset
    }

    // --- Event Handlers ---

    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const buttonX = (canvas.width - buttonWidth) / 2;

        // Check if button was clicked
        if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
            mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {

            // If the array is currently sorted (this covers both initial state and post-win state)
            if (isSorted(array)) {
                // Now, if it's sorted, we want to START a new game
                resetGameToInitialState(); // This clears the timer and resets the array
                shuffleArray(array);      // Then shuffle it immediately to start the game
                isShuffled = true;
                buttonText = "Sort!";
                startTimer();
                // Apply initial shake on game start
                currentShakeOffset = 1;
            } else {
                // If it's not sorted (game is in progress), treat as a player input
                handlePlayerInput();
            }
        } else if (isShuffled && !isSorted(array)) {
            // Click outside button, but game is active, treat as player input
            handlePlayerInput();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (isInputDown) {
            return;
        }

        // Allow input only if game is shuffled and not yet sorted
        if (isShuffled && !isSorted(array)) {
            isInputDown = true;
            handlePlayerInput();
        }
    });

    document.addEventListener('keyup', (event) => {
        isInputDown = false;
        // No longer need to reset shakeFactor here, as it's handled by decay or input
    });

    function handlePlayerInput() {
        const currentTime = performance.now();
        if (currentTime - lastInputTime < inputDebounceTime) {
            return; // Debounce: ignore rapid inputs
        }
        lastInputTime = currentTime;
        shuffleArray(array);

        // MODIFIED: Increase currentShakeOffset, but cap it
        currentShakeOffset = Math.min(currentShakeOffset + 5, ABSOLUTE_MAX_SHAKE); // Increase by 5, capped at 25

        if (isSorted(array)) {
            stopTimer();
            buttonText = initButtonText; // Revert button text to "Shuffle!"
            winSound.play();
            isShuffled = false; // Stop active game state (stops further inputs and active shaking)
        }
    }

    // --- Initialization ---

    // Set initial array
    array = [...initialArray];
    animate(); // Start the animation loop
});