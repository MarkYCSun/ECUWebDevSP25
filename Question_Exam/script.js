// Add this at the top of script.js
const questionPools = {
  Chapter_1: `
1. Zara holds a competitive advantage over its rivals in spite of
 a. refusing to implement technology in its operational model.
 b. conducting business only through online storefronts.
 c. its globally distributed contract manufacturing model.
 d. operating through fewer stores across the world than its closest rivals.
*e. keeping large portions of its production processes in-house.

2. _____ involves outsourcing production to third-party firms.
 a. Vertical integration
 b. Long tailing
 c. Peer production
*d. Contract manufacturing
 e. Viral production

3. In retail in general and fashion in particular, having _____ is considered the kiss of death.
*a. excess inventory
 b. storefronts in expensive districts with costly rents
 c. a large labor force
 d. limited production runs
 e. dispersed production facilities

4. Contract manufacturers used by the apparel industry are often criticized because
 a. they hike up the costs of producing goods.
 b. firms cannot maintain high profit margins by employing them.
 c. they charge exorbitant labor costs that drive down sales.
 d. they are known to grossly overprice their services.
*e. of poor working conditions.

5. _____ is a non-profit organization that shares audit information on contract manufacturers among members of the apparel industry and other industries.
*a. Fair Factories Clearinghouse
 b. PricewaterhouseCoopers
 c. Amnesty International
 d. Klynveld Main Goerdeler
 e. Transparency International
`,

  Chapter_2: `
60. Which of the following factors is responsible for enabling the advance of Moore’s Law?
*a. The distance between pathways inside silicon chips gets smaller with each successive generation.
 b. Silicon is commonly available in the form of sand or silicon dioxide, which helps keep the costs of chip production low.
 c. Constant interaction among three forces—size, heat, and power—makes Moore’s Law practical and ensures that it will endure for decades to come.
 d. The availability of better cooling technologies ensures that chips can continue growing smaller and more power efficient.
 e. With the exponential growth in information technology-enabled businesses, the demand for computers makes Moore’s Law possible.

61. Which of the following sets of interrelated forces threatens to slow down the progression of Moore’s Law?
 a. weight, speed, and capacity
 b. density, clock speed, and wafer thickness
*c. size, heat, and power
 d. silicon availability, efficiency, and energy
 e. memory, cache size, and speed

62. Multicore processors are formed by
 a. connecting identical processors in a parallel combination and drawing power from the same source.
*b. putting two or more lower power processor cores on a single chip.
 c. connecting a series of high-powered processors through a single power source.
 d. slicing a flat chip into pieces and reconnecting the pieces vertically.
 e. connecting a combination of parallel and series-connected processors to a single larger processor to supplement its functioning.

63. What problem is faced by multicore processors running older software written for single-brain chips?
*a. Multicore processors usually run older software by using only one core at a time.
 b. Multicore processors draw more power than single-brain processors to solve the same problem.
 c. Multicore processors require greater cooling to run the same software as single-brain processors.
 d. Individual cores in multicore processors have smaller memories than single-brain chips and are consequently slower.
 e. Multicore processors still have some fair distance to go before going mainstream.

64.  If electronics now travel half the distance to make a calculation, that means the chip is:
 a. half as big
 b. easier to keep cool
*c. twice as fast
 d. very expensive
 e. All of the above are true.

65. _____ are the super tiny on-off switches in a chip that work collectively to calculate or store things in memory.
*a. Transistors
 b. Multicore processors
 c. Single-core processors
 d. Conductors
 e. Inductors
`
};


let questions = [];
let currentQuestionIndex = 0;
let selectedOption = null;
let correctAnswers = 0;
let answeredQuestions = new Set();

// Add this for dropdown handling
document.getElementById("questionSelect").addEventListener("change", (event) => {
  const selectedChapter = event.target.value;
  const pool = questionPools[selectedChapter];

  if (pool) {
    // Save for use on Start click
    window.selectedQuestionContent = pool;

    // Show the Start button
    document.getElementById("startContainer").style.display = "block";

    // Hide everything else for now
    document.getElementById("questionContainer").style.display = "none";
    document.getElementById("navigation").style.display = "none";
    document.getElementById("statistics").style.display = "none";
    document.getElementById("feedback").textContent = "";
  } else {
    document.getElementById("startContainer").style.display = "none";
  }
});

document.getElementById("startBtn").addEventListener("click", () => {
  // Reset all variables
  currentQuestionIndex = 0;
  selectedOption = null;
  correctAnswers = 0;
  answeredQuestions.clear();

  // Clear previous stats
  document.getElementById("totalQuestions").textContent = "0";
  document.getElementById("correctAnswers").textContent = "0";
  document.getElementById("scorePercentage").textContent = "0%";
  document.getElementById("statistics").style.display = "none";

  // Clear any lingering feedback
  document.getElementById("feedback").textContent = "";
  document.getElementById("feedback").className = "feedback";

  // Parse and load new questions
  parseQuestions(window.selectedQuestionContent);
  showQuestion(0);
  updateNavigationButtons();

  // Show quiz UI
  document.getElementById("questionContainer").style.display = "block";
  document.getElementById("navigation").style.display = "flex";
  document.getElementById("startContainer").style.display = "none";
});




document.getElementById("submitBtn").addEventListener("click", checkAnswer);
document
  .getElementById("prevBtn")
  .addEventListener("click", showPreviousQuestion);
document.getElementById("nextBtn").addEventListener("click", showNextQuestion);

function parseQuestions(content) {
  questions = [];
  const lines = content.split("\n");
  let currentQuestion = null;
  let currentOptions = [];
  let correctAnswer = "";

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (/^\d+\./.test(line)) {
      if (currentQuestion) {
        questions.push({
          text: currentQuestion,
          options: currentOptions,
          correctAnswer: correctAnswer,
        });
      }
      currentQuestion = line;
      currentOptions = [];
      correctAnswer = "";
    } else if (/^(\*)?[a-e]\./.test(line)) {
      const isCorrect = line.startsWith("*");
      const optionText = line.substring(isCorrect ? 3 : 2).trim();
      if (isCorrect) {
        correctAnswer = optionText;
        currentOptions.push({ text: optionText, isCorrect: true });
      } else {
        currentOptions.push({ text: optionText, isCorrect: false });
      }
    }
  }

  if (currentQuestion) {
    questions.push({
      text: currentQuestion,
      options: currentOptions,
      correctAnswer: correctAnswer,
    });
  }

  // Shuffle options
  questions.forEach((question) => {
    const shuffledOptions = [...question.options];
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }
    question.shuffledOptions = shuffledOptions;
  });
}


function showQuestion(index) {
  if (index < 0 || index >= questions.length) return;

  currentQuestionIndex = index;
  const question = questions[index];
  document.getElementById("questionText").textContent = question.text;

  const optionsContainer = document.getElementById("optionsContainer");
  optionsContainer.innerHTML = "";

  const labelMap = ["a.", "b.", "c.", "d.", "e."];

  question.shuffledOptions.forEach((option, i) => {
    const optionElement = document.createElement("div");
    optionElement.className = "option";
    optionElement.textContent = `${labelMap[i]} ${option.text}`;
    optionElement.addEventListener("click", () => selectOption(i));
    optionsContainer.appendChild(optionElement);
  });

  document.getElementById("questionCounter").textContent = `Question ${index + 1}/${questions.length}`;
  document.getElementById("submitBtn").disabled = true;
  document.getElementById("feedback").textContent = "";
  selectedOption = null;
}


function selectOption(index) {
  const options = document.querySelectorAll(".option");
  options.forEach((option) => option.classList.remove("selected"));
  options[index].classList.add("selected");
  selectedOption = index;
  document.getElementById("submitBtn").disabled = false;
}

function checkAnswer() {
  if (selectedOption === null) return;

  const question = questions[currentQuestionIndex];
  const feedback = document.getElementById("feedback");

  if (question.shuffledOptions[selectedOption].isCorrect) {
    feedback.textContent = "Correct!";
    feedback.className = "feedback correct";
    if (!answeredQuestions.has(currentQuestionIndex)) {
      correctAnswers++;
      answeredQuestions.add(currentQuestionIndex);
    }
  } else {
    feedback.textContent = "Incorrect. Try again!";
    feedback.className = "feedback incorrect";
  }
}

function showPreviousQuestion() {
  if (currentQuestionIndex > 0) {
    showQuestion(currentQuestionIndex - 1);
  }
}

function showNextQuestion() {
  if (currentQuestionIndex < questions.length - 1) {
    showQuestion(currentQuestionIndex + 1);
  } else {
    showStatistics();
  }
}

function showStatistics() {
  const statistics = document.getElementById("statistics");
  const totalQuestions = document.getElementById("totalQuestions");
  const correctAnswersElement = document.getElementById("correctAnswers");
  const scorePercentage = document.getElementById("scorePercentage");

  totalQuestions.textContent = questions.length;
  correctAnswersElement.textContent = correctAnswers;
  scorePercentage.textContent = `${Math.round(
    (correctAnswers / questions.length) * 100
  )}%`;

  statistics.style.display = "block";
  document.getElementById("questionContainer").style.display = "none";
  document.getElementById("navigation").style.display = "none";
}

document.getElementById("restartBtn").addEventListener("click", () => {
  // Reset all state
  currentQuestionIndex = 0;
  selectedOption = null;
  correctAnswers = 0;
  answeredQuestions.clear();
  questions = [];
  window.selectedQuestionContent = null;

  // Clear dropdown selection
  document.getElementById("questionSelect").value = "";

  // Hide quiz-related elements
  document.getElementById("questionContainer").style.display = "none";
  document.getElementById("navigation").style.display = "none";
  document.getElementById("statistics").style.display = "none";
  document.getElementById("startContainer").style.display = "none";

  // Clear and display feedback message
  const feedback = document.getElementById("feedback");
  feedback.textContent = "Please choose a new chapter to begin.";
  feedback.className = "feedback";
});


function updateNavigationButtons() {
  document.getElementById("prevBtn").disabled = currentQuestionIndex === 0;
  document.getElementById("nextBtn").disabled =
    currentQuestionIndex === questions.length - 1;
}
