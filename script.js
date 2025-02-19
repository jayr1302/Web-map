let map = L.map('map').setView([14.617776, 121.102570], 13); // Default center (ICCT)

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let userLocationMarker, destinationMarker, routingControl;

// Display messages in UI instead of alerts
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

// Get User's Current Location
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                let lat = position.coords.latitude;
                let lng = position.coords.longitude;

                console.log("User Location:", lat, lng);

                userLocationMarker = L.marker([lat, lng]).addTo(map)
                    .bindPopup("Your Location").openPopup();
                
                map.setView([lat, lng], 14);
                showMessage("Location found!", "success");
            },
            error => {
                console.error("Geolocation error:", error);
                showMessage("Geolocation failed: " + error.message);
            },
            { enableHighAccuracy: true }
        );
    } else {
        showMessage("Geolocation is not supported by your browser.");
    }
}

// Autocomplete Search
document.getElementById("place-input").addEventListener("input", function () {
    let query = this.value;
    if (query.length < 3) return;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
        .then(response => response.json())
        .then(data => {
            let suggestionsBox = document.getElementById("suggestions");
            suggestionsBox.innerHTML = "";
            suggestionsBox.style.display = "block";

            if (data.length === 0) {
                showMessage("No results found. Try another search.");
                return;
            }

            data.forEach(place => {
                let suggestion = document.createElement("div");
                suggestion.textContent = place.display_name;
                suggestion.setAttribute("data-lat", place.lat);
                suggestion.setAttribute("data-lon", place.lon);
                suggestion.addEventListener("click", function () {
                    let selectedLat = this.getAttribute("data-lat");
                    let selectedLon = this.getAttribute("data-lon");
                    document.getElementById("place-input").value = this.textContent;
                    suggestionsBox.style.display = "none";
                    getRouteToLocation(selectedLat, selectedLon);
                });
                suggestionsBox.appendChild(suggestion);
            });
        })
        .catch(error => {
            console.error("Error fetching place suggestions:", error);
            showMessage("Error fetching place suggestions. Try again later.");
        });
});

// Search Button Click
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
                let lat = data[0].lat;
                let lon = data[0].lon;
                getRouteToLocation(lat, lon);
            } else {
                showMessage("Location not found.");
            }
        })
        .catch(error => {
            console.error("Error fetching location data:", error);
            showMessage("Error fetching location data. Try again later.");
        });
});

// Function to Generate Route
function getRouteToLocation(destLat, destLon) {
    if (!userLocationMarker) {
        showMessage("User location not found. Please enable location services.");
        return;
    }

    let userLatLng = userLocationMarker.getLatLng();
    let destinationLatLng = L.latLng(destLat, destLon);

    // Remove previous markers
    if (destinationMarker) map.removeLayer(destinationMarker);
    if (routingControl) map.removeControl(routingControl);

    // Add new destination marker
    destinationMarker = L.marker(destinationLatLng).addTo(map)
        .bindPopup("Destination: " + document.getElementById("place-input").value)
        .openPopup();

    // Add Routing Control
    routingControl = L.Routing.control({
        waypoints: [userLatLng, destinationLatLng],
        routeWhileDragging: true
    }).addTo(map);
}

// Initialize map with user location
getUserLocation();

// Show the loading indicator
function showLoadingIndicator() {
    document.getElementById("loading-indicator").style.display = "block";
}

// Hide the loading indicator
function hideLoadingIndicator() {
    document.getElementById("loading-indicator").style.display = "none";
}

// Autocomplete Search
document.getElementById("place-input").addEventListener("input", function () {
    let query = this.value;
    if (query.length < 3) return;

    showLoadingIndicator();  // Show loading

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
        .then(response => response.json())
        .then(data => {
            hideLoadingIndicator();  // Hide loading

            let suggestionsBox = document.getElementById("suggestions");
            suggestionsBox.innerHTML = "";
            suggestionsBox.style.display = "block";

            data.forEach(place => {
                let suggestion = document.createElement("div");
                suggestion.textContent = place.display_name;
                suggestion.setAttribute("data-lat", place.lat);
                suggestion.setAttribute("data-lon", place.lon);
                suggestion.addEventListener("click", function () {
                    let selectedLat = this.getAttribute("data-lat");
                    let selectedLon = this.getAttribute("data-lon");
                    document.getElementById("place-input").value = this.textContent;
                    suggestionsBox.style.display = "none";
                    getRouteToLocation(selectedLat, selectedLon);
                });
                suggestionsBox.appendChild(suggestion);
            });
        })
        .catch(err => {
            hideLoadingIndicator();  // Hide loading
            console.error('Error:', err);
            alert('Failed to fetch data');
        });
});