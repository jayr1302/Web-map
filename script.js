let map = L.map('map').setView([14.617776, 121.102570], 13); // Default center

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let userLocationMarker, destinationMarker, routingControl;

// Display messages in UI
function showMessage(message, type = "error") {
    let messageBox = document.getElementById("message-box");
    if (!messageBox) {
        messageBox = document.createElement("div");
        messageBox.id = "message-box";
        document.body.appendChild(messageBox);
    }
    messageBox.textContent = message;
    messageBox.style.color = type === "error" ? "red" : "green";
    messageBox.style.fontWeight = "bold";
}

// Get User Location
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                let lat = position.coords.latitude;
                let lng = position.coords.longitude;
                userLocationMarker = L.marker([lat, lng]).addTo(map)
                    .bindPopup("Your Location").openPopup();
                map.setView([lat, lng], 14);
                showMessage("Location found!", "success");
            },
            error => showMessage("Geolocation failed: " + error.message)
        );
    } else {
        showMessage("Geolocation is not supported by your browser.");
    }
}

// Fetch place suggestions
function fetchPlaceSuggestions(query) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
        .then(response => response.json())
        .then(data => displaySuggestions(data))
        .catch(error => showMessage("Error fetching suggestions."));
}

function displaySuggestions(data) {
    let suggestionsBox = document.getElementById("suggestions");
    suggestionsBox.innerHTML = "";
    suggestionsBox.style.display = "block";

    data.forEach(place => {
        let suggestion = document.createElement("div");
        suggestion.textContent = place.display_name;
        suggestion.dataset.lat = place.lat;
        suggestion.dataset.lon = place.lon;
        suggestion.addEventListener("click", () => selectLocation(place.lat, place.lon, place.display_name));
        suggestionsBox.appendChild(suggestion);
    });
}

function selectLocation(lat, lon, name) {
    document.getElementById("place-input").value = name;
    document.getElementById("suggestions").style.display = "none";
    getRouteToLocation(lat, lon);
}

// Generate Route
function getRouteToLocation(destLat, destLon) {
    if (!userLocationMarker) {
        showMessage("User location not found. Please enable location services.");
        return;
    }

    let userLatLng = userLocationMarker.getLatLng();
    let destinationLatLng = L.latLng(destLat, destLon);

    if (destinationMarker) map.removeLayer(destinationMarker);
    if (routingControl) map.removeControl(routingControl);

    destinationMarker = L.marker(destinationLatLng).addTo(map)
        .bindPopup("Destination: " + document.getElementById("place-input").value)
        .openPopup();

    routingControl = L.Routing.control({
        waypoints: [userLatLng, destinationLatLng],
        routeWhileDragging: true
    }).addTo(map);
}

// Event Listeners
document.getElementById("place-input").addEventListener("input", function () {
    let query = this.value;
    if (query.length >= 3) fetchPlaceSuggestions(query);
});

document.getElementById("search-btn").addEventListener("click", function () {
    let query = document.getElementById("place-input").value;
    if (!query) {
        showMessage("Please enter a location.");
        return;
    }
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                selectLocation(data[0].lat, data[0].lon, data[0].display_name);
            } else {
                showMessage("Location not found.");
            }
        })
        .catch(error => showMessage("Error fetching location data."));
});

// Initialize map with user location
getUserLocation();
