// Set up environment
var env = "dev";
if(env == "dev"){
    var baseUrl = "http://devgmap.capri14.com/";
    angular.module('collaApp').constant('ENV_PARAM', {
        baseUrl : baseUrl,
        basePath : "/",
        searchUrl : baseUrl + "place/search",
        favouriteUrl : baseUrl + "place/favourite",
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
angular.module('collaApp').factory('MapService', function($q, $http, ENV_PARAM) {
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
    var locationService = function(){
        var capriMarkers = [], locationSelect;
        var g = {
            clearLocations: function () {
                //$("body").trigger("location_closed");
                for (var i = 0; i < capriMarkers.length; i++) {
                    capriMarkers[i].setMap(null);
                }
                capriMarkers.length = 0;
                /*locationSelect.innerHTML = "";
                var option = document.createElement("option");
                option.value = "none";
                option.innerHTML = "See all results:";
                locationSelect.appendChild(option);*/
            },
            /**
             *
             * @param bCenter
             */
            searchLocationsNear: function(bCenter) {
                var d = this;
                d.clearLocations();
                //var radius = document.getElementById('radiusSelect').value;
                var radius = 5;
                var searchUrl = ENV_PARAM.searchUrl + '?lat=' + bCenter.lat() + '&lng=' + bCenter.lng() + '&radius=' + radius;
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
    return {
        detectCurrentLocation: detectCurrentLocation,
        locationService: locationService
    };
});