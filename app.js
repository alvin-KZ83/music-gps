let currentPosition = null;
let currentHeading = null;

// Function to update the user's location
function updatePosition(position) {
    currentPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
    };
    console.log("Current Position: ", currentPosition);

    // Call a function here to calculate the next step based on position
    updateNavigationSteps();
}

// Function to get the device's orientation (heading)
function updateHeading(event) {
    // Use the alpha value (rotation around the z-axis) as the heading
    currentHeading = event.alpha;
    document.getElementById("heading").innerText = `${Math.round(currentHeading)}°`;

    // Use the heading to adjust the next navigation instruction
    updateNavigationSteps();
}

// Function to update navigation instructions based on current position and heading
function updateNavigationSteps() {
    if (currentPosition && currentHeading !== null) {
        // Example: Mock navigation steps based on heading
        let nextStep = getNextInstruction(currentPosition, currentHeading);
        document.getElementById("steps").innerText = `Next step: ${nextStep}`;
    }
}

// Mock function to get the next instruction based on position and heading
function getNextInstruction(position, heading) {
    // In a real application, you would calculate directions here
    // Example logic to return instructions based on heading
    if (heading >= 0 && heading <= 90) {
        return "Go straight for 100m and turn right";
    } else if (heading > 90 && heading <= 180) {
        return "Turn left in 50m";
    } else if (heading > 180 && heading <= 270) {
        return "Go straight for 200m and turn left";
    } else {
        return "Turn right in 30m";
    }
}

// Track the user's position in real time
navigator.geolocation.watchPosition(updatePosition, (error) => {
    console.error("Geolocation error:", error);
}, {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 5000
});

// Listen for device orientation changes (gyroscope data)
window.addEventListener('deviceorientation', updateHeading, true);
