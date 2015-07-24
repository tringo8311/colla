angular.module('collaApp').factory('ServiceMap', ['$resource', function($resource) {
    var env = "dev";
    var envArr = {
        lat: 44.7032,
        lng: -74.0052,
        zoom: 9
    };
    if (env == "dev") {
        envArr.baseUrl = "http://devgmap.capri14.com/";
        envArr.basePath = "/";
        envArr.searchUrl = envArr.baseUrl + "place/search";
        envArr.favouriteUrl = envArr.baseUrl + "place/favourite";
        envArr.imgNotFound = "http://localhost:9000/images/place_item.jpg";
    } else if (env == "staging") {
        envArr.baseUrl = "http://gmap.capri14.com/";
        envArr.basePath = "/sximo/themes/gmap/";
        envArr.searchUrl = envArr.baseUrl + "place/search";
        envArr.favouriteUrl = envArr.baseUrl + "place/favourite";
        envArr.imgNotFound = envArr.baseUrl + "images/place_item.jpg";
    } else if (env == "product") {
        envArr.baseUrl = "http://www.nails-finder.com/";
        envArr.basePath = "/gmap/";
        envArr.searchUrl = "/gmap/place/search.php";
        envArr.favouriteUrl = "/gmap/place/favourite.php";
        envArr.imgNotFound = envArr.baseUrl + "gmap/images/place_item.jpg";
    }

    // Direction module
    var directionModule = function () {
        var directionsDisplay, directionsService, defaultOptions = {};
        var g = {
            init: function (options, map) {
                this._options = angular.extend({}, defaultOptions, options);
                this._map = map;
            },
            run: function () {
                var d = this;
                directionsDisplay = new google.maps.DirectionsRenderer({draggable: true, map: d._map});
                directionsService = new google.maps.DirectionsService();
                $("body").on("direction_clean", function () {
                    directionsDisplay.setMap(null);
                });
            },
            calcRoute: function (start, end) {
                var d = this, request = {
                    origin: start,
                    destination: end,
                    travelMode: google.maps.TravelMode.DRIVING
                };
                directionsService.route(request, function (response, status) {
                    if (status == google.maps.DirectionsStatus.OK) {
                        directionsDisplay.setDirections(response);
                        directionsDisplay.setPanel(document.getElementById('directionContent'));
                    }
                });
                google.maps.event.addListener(directionsDisplay, 'directions_changed', function () {
                    d.computeTotalDistance(directionsDisplay.getDirections());
                });

            },
            computeTotalDistance: function (result) {
                var total = 0;
                var myroute = result.routes[0];
                for (var i = 0; i < myroute.legs.length; i++) {
                    total += myroute.legs[i].distance.value;
                }
                total = total / 1000.0;
                document.getElementById('directionTotal').innerHTML = total + ' km';
            }
        }
        return g;
    }

    //currentLocation
    currentLocationModule = function () {
        var capriInfoWindow, defaultOptions = {
            title: 'Hello World!',
            draggable: true,
            animation: google.maps.Animation.DROP,
            icon: "//www.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png"
        }, geocoder;
        var g = {
            init: function (options, map) {
                this._options = angular.extend({}, defaultOptions, options);
                this._map = map;
            },
            run: function (latlng) {
                var d = this;
                capriInfoWindow = new google.maps.InfoWindow();
                var marker = new google.maps.Marker($.extend({}, this._options, {
                    position: latlng,
                    map: d._map
                }));

                var geocodeContentPosition = function (newMap, newLatLng, placeName) {
                    marker.setPosition(newLatLng);
                    geocoder = new google.maps.Geocoder();
                    geocoder.geocode({
                            latLng: newLatLng
                        }, function (results, status) {
                            if (status == google.maps.GeocoderStatus.OK) {
                                capriInfoWindow.setContent(results[0].formatted_address);
                                capriInfoWindow.open(newMap, marker);
                                if (typeof placeName == "undefined" || placeName == null || placeName == "") {
                                    document.querySelector("#addressInput").val(results[0].formatted_address);
                                    document.querySelector("#mapErrorMsg").hide(100);
                                }
                            } else {
                                document.querySelector("#mapErrorMsg").html('Cannot determine address at this location.' + status).show(100);
                            }
                        }
                    );
                }
                // Bind event on click
                google.maps.event.addListener(marker, 'click', function (event) {
                    geocodeContentPosition(d._map, marker.getPosition(), null);
                });
                // Move location icon to new position
                google.maps.event.addListener(marker, 'dragend', function (event) {
                    geocodeContentPosition(d._map, marker.getPosition(), null);
                });
                // Set GEO content default
                //geocodeContentPosition(d._map, latlng, null);
                // generate get current location's icon
                d.initCurrentIcon();

                /*$("body").on("location_closed", function (evt, latLng) {
                    capriInfoWindow.close();
                });*/
                /**
                 * TODO:
                 *  init trigger location_updated
                 */
                /*$("body").on("location_updated", function (evt, newLatLng, placeName) {
                    geocodeContentPosition(d._map, newLatLng, placeName);
                });*/
            },
            /**
             * @returns {*}
             */
            detectCurrentLocation: function () {
                var deferred = $.Deferred();
                // Try HTML5 geolocation
                if (navigator.geolocation) {
                    var content = "";
                    navigator.geolocation.getCurrentPosition(function (position) {
                        currentLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                        deferred.resolve({status: "success", result: currentLatLng});
                    }, function () {
                        content = handleNoGeolocation(true);
                        deferred.resolve({status: "failure", result: content});
                    });
                } else {
                    // Browser doesn't support Geolocation
                    content = handleNoGeolocation(false);
                    deferred.resolve({status: "failure", result: content});
                }

                var handleNoGeolocation = function (errorFlag) {
                    if (errorFlag) {
                        var content = 'Error: The Geolocation service failed.';
                    } else {
                        var content = 'Error: Your browser doesn\'t support geolocation.';
                    }
                    return content;
                }
                return deferred.promise();
            },
            /**
             *  Show current at the edge screen
             *    User must share location
             */
            initCurrentIcon: function () {
                var d = this, currentLocationEle = $("<div class='current-location'></div>"),
                    iconCurrentLocation = $("<button class='btn btn-default' data-toggle='tooltip' data-placement='top' title='Get current location'><span class='glyphicon glyphicon-record'></span></button>");

                $(iconCurrentLocation).on("click", function (evt) {
                    evt.stopImmediatePropagation();
                    var self = this;
                    $(self).addClass('disabled');
                    $(self).addClass('animated flash');
                    // Lock click function
                    d.detectCurrentLocation().then(function (answer) {
                        if (answer.status == "success") {
                            var newLatLng = answer.result;
                            $("body").trigger("location_updated", newLatLng, null);
                            d._map.setCenter(newLatLng);
                        } else {
                            alert(answer.result);
                        }
                        $(self).removeClass('disabled');
                        $(self).removeClass('animated flash');
                    });
                    return false;
                });
                currentLocationEle.append(iconCurrentLocation);
                document.querySelector(".main-container").append(currentLocationEle);
            }
        }
        return g;
    }(window.jQuery);

    var baseUrl = envArr.baseUrl;
    var capriMap, capriMarkers = [], myLatlng,
        locationSelect, infoWindow,
        imgMarkerA = "//www.google.com/intl/en_ALL/mapfiles/markerA.png",
        imgMarkerB = "//www.google.com/intl/en_ALL/mapfiles/markerB.png",
        serviceIcon = {
            url: envArr.basePath + "images/beachflag.png",
            // This marker is 20 pixels wide by 32 pixels tall.
            size: new google.maps.Size(28, 40),
            // The origin for this image is 0,0.
            origin: new google.maps.Point(0,0),
            // The anchor for this image is the base of the flagpole at 0,32.
            anchor: new google.maps.Point(0, 32)
        };
    var pinMapUrl = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=";
    var paletteColor = [
        "4e67c8", "5eccf3", "a7ea52", "5dceaf", "ff8021", "f14124",
        "b8c2e9", "beeafa", "dbf6b9", "beebdf", "ffcca6", "f9b3a7",
        "94a3de", "9ee0f7", "caf297", "9de1cf", "ffb279", "f68d7b",
        "31479f", "11b2eb", "81d319", "34ac8b", "d85c00", "c3260c",
        "202f6a", "0b769c", "568c11", "22725c", "903d00", "821908"
    ];
    var mapOptions = {
        zoom: envArr.zoom,
        panControl: false,
        mapTypeControl:true,
        scaleControl:true,
        streetViewControl:false,
        overviewMapControl:true,
        rotateControl:true,
        zoomControl:true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.LARGE,
            position: google.maps.ControlPosition.LEFT_BOTTOM
        }
        //mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU}
    }
    var markerOptions = {
        map : null,
        position : new google.maps.LatLng(0, 0),
        draggable : true
    };

    var myService = {
        initialize : function(eleId) {
            myLatlng = new google.maps.LatLng(envArr.lat, envArr.lng);
            infoWindow = new google.maps.InfoWindow();
            capriMap = new google.maps.Map(document.getElementById(eleId),
                angular.extend({center: myLatlng}, mapOptions)
            );
        }
    }
    return myService;
}]);