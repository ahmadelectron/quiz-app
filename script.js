// Constants
const amountInput = document.getElementById("amount");
const difficultyInput = document.getElementById("difficulty");
const categorySelect = document.getElementById("category-select");
const startBtn = document.getElementById("start-btn");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const nextBtn = document.getElementById("next-btn");

// Variables
let currentQuestionIndex = 0;
let score = 0;
let timerInterval;
let selectedQuestions = []; // Store queries received from the API.
let reviewData = [];

// Local Storage
if (localStorage.getItem("quiz_amount")) {
  amountInput.value = localStorage.getItem("quiz_amount");
}
if (localStorage.getItem("quiz_difficulty")) {
  difficultyInput.value = localStorage.getItem("quiz_difficulty");
}

// Get categories from the API.
const getCategories = async () => {
  try {
    // const response = await fetch("https://opentdb.com");
    const response = await fetch("https://opentdb.com/api_category.php");

    const data = await response.json();
    renderCategories(data.trivia_categories);
  } catch (error) {
    console.error("Error in receiving categories:", error);
  }
};

const renderCategories = (list) => {
  categorySelect.innerHTML = "";
  list.forEach((item) => {
    const option = document.createElement("option");
    option.textContent = item.name;
    option.value = item.id;
    categorySelect.appendChild(option);
  });
};

getCategories();

// Function to receive queries from API based on user settings.
const getQuestionsFromAPI = async (amount, category, difficulty) => {
  showSkeleton();
  try {
    const url = `https://opentdb.com/api.php?amount=${amount}&category=${category}&difficulty=${difficulty}&type=multiple`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.response_code === 0) {
      selectedQuestions = data.results;
      setTimeout(() => {
        showQuestion(0);
      }, 1000);
    } else {
      alert(
        "No question found with this settings! Please change category or difficulty.",
      );
      location.reload();
    }
  } catch (error) {
    alert(
      "Communication error! Make sure you are connected to the internet or use a VPN.",
    );
  }
};

const showSkeleton = () => {
  questionText.innerHTML = '<div class="skeleton skeleton-text"></div>';
  optionsContainer.innerHTML = `
        <div class="skeleton skeleton-option"></div>
        <div class="skeleton skeleton-option"></div>
        <div class="skeleton skeleton-option"></div>
        <div class="skeleton skeleton-option"></div>
    `;
  nextBtn.disabled = true;
};

// Start Button
startBtn.addEventListener("click", () => {
  const amount = amountInput.value;
  const category = categorySelect.value;
  const difficulty = difficultyInput.value;

  localStorage.setItem("quiz_amount", amount);
  localStorage.setItem("quiz_difficulty", difficulty);

  document.getElementById("settings-screen").classList.add("hidden");
  document.getElementById("quiz-screen").classList.remove("hidden");

  // Call teh API
  getQuestionsFromAPI(amount, category, difficulty);
});

// Show Question
const showQuestion = (index) => {
  const questionData = selectedQuestions[index];

  // Use innerHTML to correctly display API-specific characters.
  questionText.innerHTML = questionData.question;
  document.getElementById("progress").innerText =
    `Question: ${index + 1}/${selectedQuestions.length}`;

  const choices = [
    questionData.correct_answer,
    ...questionData.incorrect_answers,
  ];

  choices.sort(() => Math.random() - 0.5);
  optionsContainer.innerHTML = "";

  choices.forEach((choice) => {
    const button = document.createElement("button");
    button.innerHTML = choice;
    button.classList.add("option-btn");

    button.onclick = () => handleAnswer(choice, questionData.correct_answer);
    optionsContainer.appendChild(button);
  });

  nextBtn.disabled = true;
  clearInterval(timerInterval);
  startTimer();
};

const handleAnswer = (selected, correct) => {
  clearInterval(timerInterval);
  const allOptions = optionsContainer.querySelectorAll(".option-btn");

  // Save the result for the Review section.
  reviewData.push({
    question: selectedQuestions[currentQuestionIndex].question,
    correct: correct,
    selected: selected ? selected : "Time Out",
    isCorrect: selected === correct,
  });

  allOptions.forEach((button) => {
    button.disabled = true;

    // If the text of the button is the same as the correct answer -> it will turn green.
    if (button.innerHTML === correct) {
      // button.classList.add("correct");
      if (selected === null) {
        // If time was up -> orange
        button.classList.add("timeout");
      } else {
        // If the user answered by himself (correct or incorrect) -> green for guidance.
        button.classList.add("correct");
      }
    } else if (selected !== null && button.innerHTML === selected) {
      // If the user gave the wrong answer -> red
      button.classList.add("wrong");
    }
  });

  // if (selected === correct) {
  //   score++;
  //   document.getElementById("score").innerText = `Score: ${score}`;
  // }
  if (selected !== null && selected === correct) {
    score++;
    document.getElementById("score").innerText = `Score: ${score}`;
  }

  nextBtn.disabled = false;
};

// Next Button
nextBtn.addEventListener("click", () => {
  currentQuestionIndex++;
  if (currentQuestionIndex < selectedQuestions.length) {
    showQuestion(currentQuestionIndex);
  } else {
    showResult();
  }
});

const showResult = () => {
  document.getElementById("quiz-screen").classList.add("hidden");
  document.getElementById("result-screen").classList.remove("hidden");

  const finalScoreText = document.getElementById("final-score");
  finalScoreText.innerText = `Your Score: ${score} of ${selectedQuestions.length}`;

  // Review list of questions after completion.
  const reviewContainer = document.getElementById("review-container");
  reviewContainer.innerHTML = "<h3>Review Your Answers:</h3>";

  reviewData.forEach((item, index) => {
    const reviewItem = document.createElement("div");
    reviewItem.className = "review-item";
    reviewItem.innerHTML = `
      <p><strong>Q${index + 1}:</strong> ${item.question}</p>
      <p style="color: green">Correct: ${item.correct}</p>
      <p style="color: ${item.isCorrect ? "green" : "red"}">
        Your Answer: ${item.selected ? item.selected : "No Answer"}
      </p>
      <hr>
    `;
    reviewContainer.appendChild(reviewItem);
  });
};

// Restart Button
document.getElementById("restart-btn").addEventListener("click", () => {
  location.reload(); //Restart and clear API state
});

const startTimer = () => {
  let timeLeft = 15;
  const timerDisplay = document.getElementById("timer");
  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.innerText = `Time: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      // handleAnswer(null, null);
      const correct = selectedQuestions[currentQuestionIndex].correct_answer;
      handleAnswer(null, correct); // The user did not answer (null), but we will send the correct answer.
    }
  }, 1000);
};
