var map,
    losAngles;
var markers = [];

function initializeMap() {
    losAngles = new google.maps.LatLng(-32.929927, 151.773169);
    map = new google.maps.Map(document.getElementById('map'), {
        center: losAngles,
        zoom: 15,
        mapTypeControl: false,
        styles: [{
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{
                "color": "#e9e9e9"
            }, {
                "lightness": 17
            }]
        }, {
            "featureType": "landscape",
            "elementType": "geometry",
            "stylers": [{
                "color": "#f5f5f5"
            }, {
                "lightness": 20
            }]
        }, {
            "featureType": "road.highway",
            "elementType": "geometry.fill",
            "stylers": [{
                "color": "#ffffff"
            }, {
                "lightness": 17
            }]
        }, {
            "featureType": "road.highway",
            "elementType": "geometry.stroke",
            "stylers": [{
                "color": "#ffffff"
            }, {
                "lightness": 29
            }, {
                "weight": 0.2
            }]
        }, {
            "featureType": "road.arterial",
            "elementType": "geometry",
            "stylers": [{
                "color": "#ffffff"
            }, {
                "lightness": 18
            }]
        }, {
            "featureType": "road.local",
            "elementType": "geometry",
            "stylers": [{
                "color": "#ffffff"
            }, {
                "lightness": 16
            }]
        }, {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [{
                "color": "#f5f5f5"
            }, {
                "lightness": 21
            }]
        }, {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [{
                "color": "#dedede"
            }, {
                "lightness": 21
            }]
        }, {
            "elementType": "labels.text.stroke",
            "stylers": [{
                "visibility": "on"
            }, {
                "color": "#ffffff"
            }, {
                "lightness": 16
            }]
        }, {
            "elementType": "labels.text.fill",
            "stylers": [{
                "saturation": 36
            }, {
                "color": "#333333"
            }, {
                "lightness": 40
            }]
        }, {
            "elementType": "labels.icon",
            "stylers": [{
                "visibility": "off"
            }]
        }, {
            "featureType": "transit",
            "elementType": "geometry",
            "stylers": [{
                "color": "#f2f2f2"
            }, {
                "lightness": 19
            }]
        }, {
            "featureType": "administrative",
            "elementType": "geometry.fill",
            "stylers": [{
                "color": "#fefefe"
            }, {
                "lightness": 20
            }]
        }, {
            "featureType": "administrative",
            "elementType": "geometry.stroke",
            "stylers": [{
                "color": "#fefefe"
            }, {
                "lightness": 17
            }, {
                "weight": 1.2
            }]
        }]
    });
    ko.applyBindings(new ViewModel());
}

// My ViewModel
var ViewModel = function() {
    // Makes a reference of this in a new variable to avoid its tracking
    var self = this;
    self.searchQuery = ko.observable('');
    self.locations = ko.observableArray(iceCreamLocations);

    // Creates infowindow object for a marker to display information, pics etc.
    var largeInfoWindow = new google.maps.InfoWindow();

    // Limits the map to display all the locations on the screen
    var bounds = new google.maps.LatLngBounds();

    // Styles the markers
    var defaultIconColor = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    var highlightedIconColor = 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';

    // Handles the list of locations/chosen locations
    self.selectLocations = ko.computed(function() {
        var queryString = self.searchQuery().toLowerCase();

        if (queryString === "") {
            return self.locations();
        } else {
            largeInfoWindow.close();
            return ko.utils.arrayFilter(self.locations(), function(location) {
                var creamery = location.creamery.toLowerCase();
                var place = location.iceCreamLocation.toLowerCase();
                return ((creamery.indexOf(queryString) !== -1) || (place.indexOf(queryString) !== -1));
            });
        }
    });

    // Handles the population of full map with markers or searched locations/authors only
    self.showMarkers = ko.computed(function() {
        var queryString = self.searchQuery().toLowerCase();

        if (!queryString) {
            populateMap(queryString);
        } else {
            removeMarkers();
            populateMap(queryString);
        }
    });

    function populateInfoWindow(marker, infowindow) {
        if (infowindow.marker != marker) {
            infowindow.setContent('');
            infowindow.marker = marker;
            infowindow.setContent(`
                <h4>${marker.creamery}</h4>
                <h6>${marker.address}</h6>
                <div yelp-url>
                    <p id="text">
                    <a class="yelp-url">
                        <img src="yelp-logo.png" alt="Yelp-Logo" style="width:70px;">
                        <img id="yelp" class="yelp-url"></p></div>
                    </a> 
                </div>
                <h6 id="review-text">Review Snippet: </h6>
                <div id="sample-text"></div>
                `);
            getYelpData(marker.creamery, marker.address);
            infowindow.open(map, marker);
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
                marker.setIcon(defaultIconColor);
            });
        }
    }

    // Opens the marker when listed location is clicked
    self.listLocationSelected = function(data) {
        populateInfoWindow(data.marker, largeInfoWindow);
        markers.forEach(function(marker) {
          marker.setIcon(defaultIconColor);
        });
        data.marker.setIcon(highlightedIconColor);
    };

    // Filters the map to searched results only and place its markers
    function populateMap(queryString) {
        self.locations().forEach(function(location) {
            var position = location.coordinates;
            var creamery = location.creamery;
            var address = location.iceCreamLocation;
            //var origin = location.origin;
            var searchIceCream = location.creamery.toLowerCase();
            var searchSuburbName = location.iceCreamLocation.toLowerCase();
            if (queryString === "") {
                location.marker = new google.maps.Marker({
                    map: map,
                    position: position,
                    creamery: creamery,
                    address: address,
                    icon: defaultIconColor,
                    animation: google.maps.Animation.DROP,
                    id: location
                });

                // Adds created location marker to marker array
                markers.push(location.marker);

                // Makes infowindow pop up on click of a marker
                location.marker.addListener('click', function() {
                    populateInfoWindow(this, largeInfoWindow);
                    this.setIcon(highlightedIconColor);
                });

                // Adjust the boundaries of the map to fit the markers
                bounds.extend(location.marker.position);

            } else {
                if ((searchIceCream.indexOf(queryString) !== -1) || (searchSuburbName.indexOf(queryString) !== -1)) {

                    // Displays the relevant markers
                    location.marker.setVisible(true);

                    // Adds created location marker to marker array
                    markers.push(location.marker);

                    // Makes infowindow pop up on click of a marker
                    location.marker.addListener('click', function() {
                        populateInfoWindow(this, largeInfoWindow);
                        this.setIcon(highlightedIconColor);
                    });
                }
            }
        });

        // Extend the boundaries of the map for each marker
        map.fitBounds(bounds);
    }

    // Deletes all markers in the array by making them invisible
    function removeMarkers() {
        markers.forEach(function(marker) {
            marker.setVisible(false);
        });
        markers = [];

    }
};


var getYelpData = function(name, addr){
    var httpMethod = 'GET';
    var yelpURL = 'https://api.yelp.com/v2/search/';
    var randomString = function(length) {
        var str = "";
        var possible = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        for(var i = 0; i < length; i++) {
            str += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return str;
    };
    var parameters = {
      oauth_consumer_key: 'S46AQ1iwQtvxw_D1wQLHZA',
      oauth_token: 'TO9rPx1abdPe3lllR5Wo3WFrvz8CV9vw',
      oauth_nonce: randomString(20),
      oauth_timestamp: Math.floor(Date.now() / 1000),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_version: '1.0',
      callback: 'cb',
      term: name,
      location: addr,
      limit: 1
    };
    var consumerSecret = '8hqIHpplfRBLzs6YOqLZFfkx7jg';
    var tokenSecret = 'evb3bjTox8RNlfZ5Ma74hqJjZWo';

    // generates a RFC 3986 encoded, BASE64 encoded HMAC-SHA1 hash
    var signature = oauthSignature.generate(httpMethod, yelpURL, parameters, consumerSecret, tokenSecret);
    parameters.oauth_signature = signature;
    var ajaxSettings = {
      url: yelpURL,
      data: parameters,
      cache: true,
      dataType: 'jsonp',
      success: function(response) {
        console.log(response);
        $('#yelp').attr("src", response.businesses[0].rating_img_url);
        $('.yelp-url').attr("href", response.businesses[0].url);
        console.log(response.businesses[0].snippet_text)
        $('#sample-text').html(response.businesses[0].snippet_text);
      },
      error: function() {
        $('#text').html('Yelp data error!');
        $('#review-text').html('');
      }
    };
    $.ajax(ajaxSettings);
}

var mapsInitError = function() {
    alert("Unable to load map");
};
