let currentPosition = null;
let currentHeading = null;
let startPosition = null;
let distanceCovered = 0;

let audioCtx = null;
let oscillator = null;
let isPlaying = false;  // Track if sound is currently playing

// Prebuilt directions: List of steps (heading in degrees and distance to walk)
const directions = [
    { heading: 0, distance: 50 },   // Head north and walk 50 meters
    { heading: 90, distance: 100 },  // Head east and walk 100 meters
    { heading: 180, distance: 75 }   // Head south and walk 75 meters
];
let currentStep = 0;

// Ensure the Tone.js context is resumed after user interaction
document.getElementById('sensor-permission').addEventListener('click', async function() {
    await Tone.start();
    console.log('Tone.js Audio context resumed');
    requestSensorPermission();
});

// Function to request motion sensor permission and enable audio on user interaction
function requestSensorPermission() {
    // Create the audio context and oscillator after user interaction
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Request motion sensor permission (for iOS)
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

// Function to start the oscillator (sound generation) for dynamic pitch
function startOscillator(frequency) {
    if (audioCtx && !isPlaying) {
        oscillator = audioCtx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        oscillator.connect(audioCtx.destination);
        oscillator.start();
        isPlaying = true;
    }
}

// Function to stop the oscillator
function stopOscillator() {
    if (oscillator && isPlaying) {
        oscillator.stop();
        oscillator.disconnect();
        isPlaying = false;
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

        // Calculate the difference between the current heading and the required heading
        let headingDifference = Math.abs(currentHeading - requiredHeading);

        // Adjust for wrapping around 360 degrees
        if (headingDifference > 180) {
            headingDifference = 360 - headingDifference;
        }

        // Adjust pitch based on heading difference
        adjustPitch(headingDifference, tolerance);

        // Check if the difference is within the tolerance range
        if (headingDifference <= tolerance) {
            document.getElementById("step").innerText = `Good! Facing correct direction (${requiredHeading}°). Walk ${directions[currentStep].distance} meters.`;
            stopOscillator();  // Stop sound when facing the correct direction
        } else {
            document.getElementById("step").innerText = `Turn to face ${requiredHeading}°.`;
        }
    }
}

// Function to adjust pitch based on heading difference
function adjustPitch(headingDifference, tolerance) {
    // If the audio context is not initialized, exit
    if (!audioCtx) return;

    // Map the heading difference to pitch: greater difference = lower pitch
    const minPitch = Tone.Frequency("C2").toFrequency();
    const maxPitch = Tone.Frequency("C4").toFrequency();
    
    // Calculate the new frequency based on how far the user is from the correct heading
    const normalizedDifference = Math.min(headingDifference / tolerance, 1); // 0 to 1
    const frequency = maxPitch - (normalizedDifference * (maxPitch - minPitch));

    // Start or update the oscillator with the new frequency
    if (headingDifference > tolerance) {
        startOscillator(frequency);
    } else {
        stopOscillator();
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

// Initialize the first step
updateStepInfo();
