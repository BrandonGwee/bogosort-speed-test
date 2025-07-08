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

    // Box shaking variables
    const initialShakeFactor = 5; // Pixels to shake
    let shakeFactor = initialShakeFactor;

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
        ctx.fillStyle = isShuffled ? '#FFC107' : '#2196F3'; // Orange when sorting, Blue when shuffling
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(buttonText, buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);
    }

    // In game.js

    function animate() {
        if (!isSorted(array)) {
            shakeFactor += 0.2;
            // Apply shake effect using transform
            const shakeX = (Math.random() > 0.5 ? 1 : -1) * shakeFactor;
            const shakeY = (Math.random() > 0.5 ? 1 : -1) * shakeFactor;
            gameContainer.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
        } else {
            // Reset position by removing the transform
            gameContainer.style.transform = 'none';
            shakeFactor = 0;
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

    function resetGameState() {
        array = [...initialArray];
        isShuffled = false;
        stopTimer();
        timerDisplay.textContent = "0.000s";
        buttonText = "Shuffle!";
        lastInputTime = 0; // Reset debounce
        // Ensure container is back to original position
        gameContainer.style.left = `${boxOriginalX}px`;
        gameContainer.style.top = `${boxOriginalY}px`;
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

            if (!isShuffled) {
                // Initial shuffle
                shuffleArray(array);
                isShuffled = true;
                buttonText = "Sort!";
                startTimer();
            } else if (isSorted(array)) {
                // If sorted and button is clicked (after winning), reset
                resetGameState();
            } else {
                // If already shuffled and not sorted, treat as an input
                handlePlayerInput();
            }
        } else if (isShuffled && !isSorted(array)) {
            // Click outside button, but game is active
            handlePlayerInput();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (isInputDown) {
            return;
        }

        if (isShuffled && !isSorted(array)) {
            isInputDown = true;
            handlePlayerInput();
        }
    });

    document.addEventListener('keyup', (event) => {
        isInputDown = false;
        shakeFactor = initialShakeFactor; // Reset shake factor when a new input is detected

    });

    function handlePlayerInput() {
        const currentTime = performance.now();
        if (currentTime - lastInputTime < inputDebounceTime) {
            return; // Debounce: ignore rapid inputs
        }
        lastInputTime = currentTime;
        shuffleArray(array);

        if (isSorted(array)) {
            stopTimer();
            buttonText = initButtonText;
            winSound.play();
        }
    }

    // --- Initialization ---

    // Set initial array
    array = [...initialArray];

    // Get initial position of gameContainer
    // This is often best done after a short delay or within the initial animate call if needed for precise initial positioning.
    // For now, we'll get it when the shuffle button is clicked, as that's when shaking begins.
    // If you need it immediately on load, you might need a slight timeout or ensure the element's position is fixed/absolute.

    animate(); // Start the animation loop
});