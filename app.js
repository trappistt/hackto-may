const defaults = {
  name: "PitchForge",
  pitch:
    "Turn a rough hackathon idea into a crisp product pitch, demo plan, and judge-ready story.",
  wow: "Instant summary",
  steps: [
    {
      title: "Capture the problem",
      body: "Start with the user, their pain, and the moment where the current workaround breaks down."
    },
    {
      title: "Show the magic",
      body: "Walk through the shortest path from input to outcome. Keep the delightful part obvious."
    },
    {
      title: "Close with impact",
      body: "Tie the demo back to time saved, money unlocked, stress removed, or access improved."
    }
  ]
};

const saved = JSON.parse(localStorage.getItem("hackto-may-demo") || "null");
let state = { ...defaults, ...saved };

const productName = document.querySelector("#productName");
const productPitch = document.querySelector("#productPitch");
const pitchLength = document.querySelector("#pitchLength");
const wowMoment = document.querySelector("#wowMoment");
const demoSteps = document.querySelector("#demoSteps");
const form = document.querySelector("#demoForm");
const nameInput = document.querySelector("#nameInput");
const pitchInput = document.querySelector("#pitchInput");
const wowInput = document.querySelector("#wowInput");
const resetButton = document.querySelector("#resetButton");

function estimatePitchLength(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const seconds = Math.max(20, Math.round((words / 2.4 + 45) / 5) * 5);
  return `${seconds} sec`;
}

function render() {
  productName.textContent = state.name;
  productPitch.textContent = state.pitch;
  pitchLength.textContent = estimatePitchLength(state.pitch);
  wowMoment.textContent = state.wow;

  nameInput.value = state.name;
  pitchInput.value = state.pitch;
  wowInput.value = state.wow;

  demoSteps.innerHTML = state.steps
    .map(
      (step, index) => `
        <li>
          <span>${index + 1}</span>
          <div>
            <strong>${step.title}</strong>
            <p>${step.body}</p>
          </div>
        </li>
      `
    )
    .join("");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  state = {
    ...state,
    name: nameInput.value.trim() || defaults.name,
    pitch: pitchInput.value.trim() || defaults.pitch,
    wow: wowInput.value.trim() || defaults.wow
  };
  localStorage.setItem("hackto-may-demo", JSON.stringify(state));
  render();
});

resetButton.addEventListener("click", () => {
  localStorage.removeItem("hackto-may-demo");
  state = { ...defaults };
  render();
});

render();

