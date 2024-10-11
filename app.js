let currentPosition = null;
let currentHeading = null;
let startPosition = null;
let distanceCovered = 0;

// Prebuilt directions: List of steps (heading in degrees and distance to walk)
const directions = [
    { heading: 0, distance: 50 },   // Head north and walk 50 meters
    { heading: 90, distance: 100 },  // Head east and walk 100 meters
    { heading: 180, distance: 75 }   // Head south and walk 75 meters
];
let currentStep = 0;

// Function to request motion sensor permission (for iOS)
function requestSensorPermission() {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', updateHeading, true);
                } else {
                    alert("Permission to access motion sensors was denied.");
                }
            })
            .catch(console.error);
    } else {
        window.addEventListener('deviceorientation', updateHeading, true);
    }
}

// Function to update the user's location
function updatePosition(position) {
    if (!startPosition) {
        startPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        };
    }

    currentPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
    };

    // Calculate distance covered from the starting point
    distanceCovered = calculateDistance(startPosition, currentPosition);

    // Update the progress
    updateNavigationProgress();
}

// Function to get the device's orientation (heading)
function updateHeading(event) {
    currentHeading = event.alpha; // Alpha is the z-axis rotation (0° is north)
    document.getElementById("heading").innerText = `${Math.round(currentHeading)}`;

    // Check if the user is facing the correct heading
    checkDirection();
}

// Function to calculate distance between two GPS coordinates
function calculateDistance(start, end) {
    const R = 6371e3; // Radius of the Earth in meters
    const φ1 = start.latitude * Math.PI / 180;
    const φ2 = end.latitude * Math.PI / 180;
    const Δφ = (end.latitude - start.latitude) * Math.PI / 180;
    const Δλ = (end.longitude - start.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

// Function to update the user's progress (distance remaining for current step)
function updateNavigationProgress() {
    const targetDistance = directions[currentStep].distance;
    const distanceLeft = Math.max(0, targetDistance - distanceCovered);

    document.getElementById("distance-left").innerText = `${Math.round(distanceLeft)}`;

    // If the user has covered the required distance, move to the next step
    if (distanceLeft <= 0) {
        currentStep++;
        if (currentStep < directions.length) {
            startPosition = currentPosition; // Reset the starting position for the next step
            distanceCovered = 0; // Reset distance covered
            updateStepInfo();
        } else {
            alert("Navigation complete!");
        }
    }
}

// Function to check if the user is facing the correct direction
function checkDirection() {
    if (currentHeading !== null && directions[currentStep]) {
        const requiredHeading = directions[currentStep].heading;
        const tolerance = 15; // Allow some tolerance in degrees

        if (Math.abs(currentHeading - requiredHeading) <= tolerance) {
            document.getElementById("step").innerText = `Good! Facing correct direction (${requiredHeading}°). Walk ${directions[currentStep].distance} meters.`;
        } else {
            document.getElementById("step").innerText = `Turn to face ${requiredHeading}°.`;
        }
    }
}

// Function to display the current step information
function updateStepInfo() {
    const stepInfo = directions[currentStep];
    document.getElementById("step").innerText = `Face ${stepInfo.heading}° and walk ${stepInfo.distance} meters.`;
}

// Track the user's position in real time
navigator.geolocation.watchPosition(updatePosition, (error) => {
    console.error("Geolocation error:", error);
}, {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 5000
});

// Request motion sensor permission when the button is clicked
document.getElementById('sensor-permission').addEventListener('click', requestSensorPermission);

// Initialize the first step
updateStepInfo();
