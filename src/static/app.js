document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML
        let participantsHTML = `
          <div class="activity-card-participants">
            <div class="activity-card-participants-title">Participants</div>
            <ul class="activity-card-participants-list" style="padding-left:0;">
              ${
                details.participants.length > 0
                  ? details.participants
                      .map(
                        (participant) =>
                          `<li title="${participant}" style="list-style-type:none; display:flex; align-items:center;">
                              <span style="flex:1;">${participant}</span>
                              <button title="Unregister participant" style="margin-left:8px; background:none; border:none; cursor:pointer; font-size:1em;" onclick="window.unregisterParticipant && window.unregisterParticipant('${encodeURIComponent(participant)}', '${encodeURIComponent(name)}')">🗑️</button>
                          </li>`
                      )
                      .join("")
                  : '<li style="color:#aaa;font-style:italic; list-style-type:none;">No participants yet</li>'
              }
            </ul>
          </div>
        `;
// Unregister participant function (global for inline onclick)
window.unregisterParticipant = async function(participant, activity) {
  const decodedParticipant = decodeURIComponent(participant);
  const decodedActivity = decodeURIComponent(activity);
  try {
    const response = await fetch(`/activities/${encodeURIComponent(decodedActivity)}/unregister?email=${encodeURIComponent(decodedParticipant)}`, {
      method: 'POST',
    });
    if (!response.ok) {
      const result = await response.json();
      alert(result.detail || 'Failed to unregister participant');
      return;
    }
    // Refresh activities list
    if (typeof fetchActivities === 'function') fetchActivities();
  } catch (error) {
    alert('Failed to unregister participant.');
  }
}

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();


      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list to show new participant
        if (typeof fetchActivities === 'function') fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
