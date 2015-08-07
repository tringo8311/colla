// Set up environment
var env = "dev";
if(env == "dev"){
    var baseUrl = "http://localhost:8000/v1/api/";
    angular.module('collaApp').constant('ENV_PARAM', {
        baseUrl : baseUrl,
        basePath : "/",
        searchUrl : baseUrl + "stores/near",
        favouriteUrl : baseUrl + "stores/favourite",
        imgNotFound : "http://localhost:8100/images/place_item.jpg"
    });
}else if(env == "staging"){
    var baseUrl = "http://gmap.capri14.com/";
    angular.module('collaApp').constant('ENV_PARAM', {
        baseUrl : baseUrl,
        basePath : "/sximo/themes/gmap/",
        searchUrl : baseUrl + "place/search",
        favouriteUrl : baseUrl + "place/favourite",
        imgNotFound : baseUrl + "images/place_item.jpg"
    });
}else if(env == "product"){
    var baseUrl = "http://www.nails-finder.com/";
    angular.module('collaApp').constant('ENV_PARAM', {
        baseUrl : baseUrl,
        basePath :  "/gmap/",
        searchUrl : "/gmap/place/search.php",
        favouriteUrl : "/gmap/place/favourite.php",
        imgNotFound : baseUrl + "gmap/images/place_item.jpg"
    });
}
angular.module('collaApp').factory('MapService', function($q, $http, $ionicPopup, UtilService, ENV_PARAM) {
    var detectCurrentLocation = function(){
        return $q(function(resolve, reject) {
            // Try HTML5 geolocation
            if (navigator.geolocation) {
                var content = "", currentLatLng;
                navigator.geolocation.getCurrentPosition(function (position) {
                    currentLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    resolve({status: "success", result: currentLatLng});
                }, function () {
                    content = handleNoGeolocation(true);
                    resolve({status: "failure", result: content});
                });
            } else {
                // Browser doesn't support Geolocation
                content = handleNoGeolocation(false);
                resolve({status: "failure", result: content});
            }

            var handleNoGeolocation = function (errorFlag) {
                if (errorFlag) {
                    var content = 'Error: The Geolocation service failed.';
                } else {
                    var content = "Error: Your browser doesn\'t support geolocation.";
                }
                return content;
            }
        });
    }
    /**
     * Get location service
     */
    var locationService = function(){
        var g = {
            /**
             *
             * @param bCenter
             * @param radiusVal Int
             */
            searchLocationsNear: function(bCenter, radiusVal) {
                var d = this;
                var searchUrl = ENV_PARAM.searchUrl + '?lat=' + bCenter.lat() + '&lng=' + bCenter.lng() + '&radius=' + radiusVal;
                return $q(function(resolve, reject) {
                    d.downloadUrl(searchUrl).then(function(answerXML){
                        var xml = d.parseXml(answerXML);
                        var markerNodes = xml.documentElement.getElementsByTagName("marker");
                        resolve(markerNodes);
                    });
                });
            },
            /**
             *
             * @param url
             * @param callback
             */
            downloadUrl: function (url) {
                var deferred = $q.defer();
                var request = window.ActiveXObject ? new ActiveXObject('Microsoft.XMLHTTP') : new XMLHttpRequest;
                request.onreadystatechange = function () {
                    if (request.readyState == 4) {
                        //request.onreadystatechange = d.doNothing;
                        deferred.resolve(request.responseText, request.status);
                    }else{

                    }
                };
                request.open('GET', url, true);
                request.send(null);
                /*$http.get(url).success(function(data){
                        deferred.resolve(data);
                    }).error(function(err){
                        console.log('Error retrieving markets');
                        deferred.reject(err);
                    });*/
                return deferred.promise;
            },
            /**
             *
             * @param str
             * @returns {*}
             */
            parseXml: function (str) {
                if (window.ActiveXObject) {
                    var doc = new ActiveXObject('Microsoft.XMLDOM');
                    doc.loadXML(str);
                    return doc;
                } else if (window.DOMParser) {
                    return (new DOMParser).parseFromString(str, 'text/xml');
                }
            }
        }
        return g;
    }();
    /**
     * Get direction service
     */
    var directionService = function(){
        var directionsDisplay, directionsService;
        var g = {
            init: function(map, directionsPanel, events){
                this.seflMap = map;
                this.directionsPanel = document.getElementById(directionsPanel);
                this.events = events;
            },
            run: function(){
                var d = this;
                directionsDisplay = new google.maps.DirectionsRenderer({ draggable: true, map: d.seflMap });
                directionsService = new google.maps.DirectionsService();
            },
            calcRoute: function(start, end) {
                var d = this, request = {
                    origin:start,
                    destination:end,
                    travelMode: google.maps.TravelMode.DRIVING
                };
                directionsService.route(request, function(response, status) {
                    if (status == google.maps.DirectionsStatus.OK) {
                        directionsDisplay.setDirections(response);
                        directionsDisplay.setPanel(document.getElementById("directionsPanel"));
                        if(d.events != undefined) {
                            d.events.forEach(function (event, index, ar) {
                                if (event.name == 'directions_changed') {
                                    var totalDistance = d.computeTotalDistance(directionsDisplay.getDirections());
                                    event.callback(totalDistance);
                                }
                            });
                        }
                    }
                });
                google.maps.event.addListener(directionsDisplay, 'directions_changed', function() {
                    directionsDisplay.setPanel(document.getElementById("directionsPanel"));
                    if(d.events != undefined) {
                        d.events.forEach(function (event, index, ar) {
                            if (event.name == 'directions_changed') {
                                var totalDistance = d.computeTotalDistance(directionsDisplay.getDirections());
                                event.callback(totalDistance);
                            }
                        });
                    }
                });

            },
            computeTotalDistance : function(result) {
                var total = 0;
                var myroute = result.routes[0];
                for (var i = 0; i < myroute.legs.length; i++) {
                    total += myroute.legs[i].distance.value;
                }
                total = total / 1000.0;
                return total;
            }
        }
        return g;
    }();
    /**
     *  create marker
     */
    var markerService = function(){
        var pinMapUrl = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=";
        var paletteColor = [
            "4e67c8", "5eccf3", "a7ea52", "5dceaf", "ff8021", "f14124",
            "b8c2e9", "beeafa", "dbf6b9", "beebdf", "ffcca6", "f9b3a7",
            "94a3de", "9ee0f7", "caf297", "9de1cf", "ffb279", "f68d7b",
            "31479f", "11b2eb", "81d319", "34ac8b", "d85c00", "c3260c",
            "202f6a", "0b769c", "568c11", "22725c", "903d00", "821908"
        ];
        var serviceIcon = {};
        var g = {
            init: function(map, events){
                this.seflMap = map;
                this.events = events;
                serviceIcon = {
                    url: "/img/map/beachflag.png",
                    size: new google.maps.Size(28, 40),
                    origin: new google.maps.Point(0,0),
                    anchor: new google.maps.Point(0, 32)
                }
            },
            /**
             *
             * @param latlng
             * @param name
             * @param address
             */
            createMarker : function (latlng, title, address, extra) {
                var d= this, imgPath = typeof extra.imgPath == "undefined" || extra.imgPath == "" ? "/img/icon.jpg" : extra.imgPath;
                var storeObj = {
                    latlng: latlng,
                    imgPath: imgPath,
                    title: title,
                    address: address,
                    zipcode: extra.zipcode,
                    business_hour: extra.business_hour,
                    phone: UtilService.phoneFormat(extra.phone),
                    email: extra.email,
                    website: UtilService.addHttp(extra.website),
                    distance: extra.distance,
                    firstChar: extra.firstChar
                };

                var firstChar = title.charAt(0) ? title.charAt(0) : "0",
                    randomPalette = Math.floor(Math.random() * (paletteColor.length - 1));
                serviceIcon.url = pinMapUrl + firstChar + "|" + paletteColor[randomPalette] + "|000000";

                var marker = new google.maps.Marker({
                    icon: serviceIcon,
                    map: this.seflMap,
                    position: latlng,
                    storeObj: storeObj,
                    animation: google.maps.Animation.DROP
                });
                google.maps.event.addListener(marker, 'click', function (evt) {
                    if(d.events != undefined) {
                        d.events.forEach(function (event, index, ar) {
                            if (event.name == 'click') {
                                event.callback(marker);
                            }
                        });
                    }
                });
                return marker;
            }
        }
        return g;
    }();

    return {
        detectCurrentLocation: detectCurrentLocation,
        locationService: locationService,
        directionService: directionService,
        markerService: markerService
    };
});