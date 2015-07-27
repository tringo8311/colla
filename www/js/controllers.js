/**
 *
 * @type {*|module}
 */
var collaApp = angular.module('collaApp');
collaApp.controller('AppCtrl', function($scope, $state, $ionicPopup, AuthService, AUTH_EVENTS) {
        $scope.username = AuthService.username();

        $scope.$on(AUTH_EVENTS.notAuthorized, function(event) {
            var alertPopup = $ionicPopup.alert({
                title: 'Unauthorized!',
                template: 'You are not allowed to access this resource.'
            });
        });

        $scope.$on(AUTH_EVENTS.notAuthenticated, function(event) {
            AuthService.logout();
            $state.go('login');
            var alertPopup = $ionicPopup.alert({
                title: 'Session Lost!',
                template: 'Sorry, You have to login again.'
            });
        });

        $scope.setCurrentUsername = function(name) {
            $scope.username = name;
        };
    })
    .controller('LoginCtrl', function($scope, $state, $ionicPopup, $interval, UtilService, AuthService) {
        $scope.data = {};

        $scope.login = function(data) {
            AuthService.login(data.username, data.password).then(function(authenticated) {
                $state.go('customer.dash', {}, {reload: true});
                $scope.setCurrentUsername(data.username);
            }, function(err) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Login failed!',
                    template: 'Please check your credentials!'
                });
            });
        };
    })
    .controller('NavController', function($scope, $ionicSideMenuDelegate) {
        $scope.toggleLeft = function() {
            $ionicSideMenuDelegate.toggleLeft();
        };
    })
    .controller('ForgotPasswordCtrl', function($scope, $ionicPopup, $ionicSideMenuDelegate, ProfileService) {
        $scope.data = { username: "", code: ""};
        $scope.securityCode = false;
        $scope.resetPassword = function(data){
            ProfileService.confirmResetPassword(data.username).then(function(answer) {
                //var alertPopup = null;
                if("success"==answer){
                    $scope.securityCode = true;
                    $ionicPopup.alert({
                        title: 'Reset password!',
                        template: 'Please check your email!'
                    });
                }else{
                    $ionicPopup.alert({
                        title: 'Reset password!',
                        template: 'Your email/user is not exist. Please type another!'
                    });
                }
            }, function(err) {

            });
        }
        $scope.isSecurityCodeShown = function(){
            return $scope.securityCode;
        }
    })
    .controller('SignUpCtrl', function($scope, $state, $ionicSideMenuDelegate, $ionicPopup, ProfileService, AuthService) {
        $scope.data = {}
        /**
         * do validate and save data
         * @param data
         */
        $scope.doSignUp = function(data) {
            // Go to login page
            ProfileService.doSignUp(data).then(function(answer){
                if(answer=="success"){
                    $ionicPopup.alert({
                        title: 'Sign up',
                        template: 'Please check your email!'
                    });
                }else{
                    $ionicPopup.alert({
                        title: 'Sign up',
                        template: 'Your email/user is not exist. Please type another!'
                    });
                }
            }, function(err) {
                console.error(err);
            });
        }
        if(AuthService.isAuthorized){
            $state.go('customer.dash');
        }
    })
    .controller('ProfileCtrl', function($scope, $state, $http, $ionicPopup, AuthService) {
        if(AuthService.isAuthenticated()){
            $scope.data = AuthService.loadUserProfile();
            console.log($scope.data);
        }else{
            $scope.go("login");
        }
    })
    .controller('DashCtrl', function($scope, $state, $http, $ionicPopup, AuthService) {
        $scope.logout = function() {
            AuthService.logout();
            $state.go('login');
        };

        $scope.performValidRequest = function() {
            $http.get('http://localhost:8100/valid').then(
                function(result) {
                    $scope.response = result;
                });
        };

        $scope.performUnauthorizedRequest = function() {
            $http.get('http://localhost:8100/notauthorized').then(
                function(result) {
                    // No result here..
                }, function(err) {
                    $scope.response = err;
                });
        };

        $scope.performInvalidRequest = function() {
            $http.get('http://localhost:8100/notauthenticated').then(
                function(result) {
                    // No result here..
                }, function(err) {
                    $scope.response = err;
                });
        };
        /*$scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
        });*/
        $scope.$on('$ionicView.loaded', function (viewInfo, state) {
            //console.log('CTRL - $ionicView.loaded', viewInfo, state);
            if(document.querySelector("#qrcode")){
                angular.element(document.querySelector("#qrcode")).empty();
                new QRCode("qrcode", {
                    text: "http://jindo.dev.naver.com/collie",
                    width: 220,
                    height: 220,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });
            }
        });
    })
    .controller('ReceiptCtrl', ['$scope', "$state", "$http", "$ionicPopup", "AuthService", "Receipt", function($scope, $state, $http, $ionicPopup, AuthService, Receipt) {
        $scope.groups = Receipt.query();
        $scope.toggleGroup = function(group) {
            if ($scope.isGroupShown(group)) {
                $scope.shownGroup = null;
            } else {
                $scope.shownGroup = group;
            }
        }
        $scope.isGroupShown = function(group){
            return $scope.shownGroup === group;
        }
    }])
    .controller('PlaceCtrl', ['$scope', "$state", "$http", "$ionicPopup", "AuthService", "Store", function($scope, $state, $http, $ionicPopup, AuthService, Store) {
        $scope.store = Store.get({id:1});
        $scope.heomoi = [
            {
                src:'/img/bg1.jpg',
                sub: 'This is a <b>subtitle</b>'
            },{
                src:'/img/bg2.jpg',
                sub: 'Heo moi ' /* Not showed */
            },{
                src:'/img/bg3.jpg'
            }
        ]
    }])
    .controller('AroundCtrl', ['$scope', "$q", "$state", "$http", "$interval", "$ionicPopup", "$window", "GeoCoder", "UtilService", "AuthService", "MapService", "_",
        function($scope, $q, $state, $http, $interval, $ionicPopup, $window, GeoCoder, UtilService, AuthService, MapService, _) {
            var currentMap = null, currentPositionMarker = null, currentInfoWindow = null;
            $scope.dimenstion = {
                dev_width : $window.innerWidth,
                dev_height : $window.innerHeight
            }
            $scope.addressInput = "";
            $scope.currentPosition = {coords:{lat:37.7749295,lng:-122.41941550000001}, heading:"",address:""};
            $scope.$on('mapInitialized', function(evt, evtMap) {
                currentMap = evtMap;
                currentPositionMarker = currentMap.markers[0];
                currentInfoWindow = new google.maps.InfoWindow();
                google.maps.event.addListener(currentPositionMarker, 'dragend', function (event) {
                    updateInfoWindow(currentPositionMarker.getPosition(), currentInfoWindow).then(function(answer){
                        if(answer.status == "success"){
                            $scope.addressInput = answer.result;
                        }
                        currentInfoWindow.open(currentMap, currentPositionMarker);
                    });
                });
                updateInfoWindow(currentPositionMarker.getPosition(), currentInfoWindow);
                currentInfoWindow.open(currentMap, currentPositionMarker);
                /**
                 *
                 * Init autocomplete
                 *
                  */
                var addressInput = document.getElementById("addressInput");
                var autocomplete = new google.maps.places.Autocomplete(addressInput, {
                    types: ["geocode"]
                });
                autocomplete.bindTo('bounds', currentMap);

                google.maps.event.addListener(autocomplete, 'place_changed', function () {
                    currentInfoWindow.close();
                    var place = autocomplete.getPlace();
                    if (place.geometry.viewport) {
                        currentMap.fitBounds(place.geometry.viewport);
                    } else {
                        currentMap.setCenter(place.geometry.location);
                    }
                    $scope.currentPosition.coords = place.geometry.location;
                    currentPositionMarker.setPosition($scope.currentPosition.coords);
                    //d.searchLocations(place.geometry.location);
                    $scope.searchLocationsNear();
                });
            });

            $scope.clearAddressInput = function(){
                $scope.addressInput = "";
            }
            // Get current address
            $scope.getCurrentAddress = function(evt) {
                if(evt != undefined){
                    var self = this;
                    if (self.getAnimation() != null) {
                        self.setAnimation(null);
                    } else {
                        self.setAnimation(google.maps.Animation.BOUNCE);
                        $interval(function () {
                            self.setAnimation(null);
                        }, 2000, 1);
                    }
                    currentInfoWindow.open(currentMap, currentPositionMarker);
                }
                updateInfoWindow(currentPositionMarker.getPosition(), currentInfoWindow);
            }
            $scope.detectLocationClick = function() {
                MapService.detectCurrentLocation().then(function (answer) {
                    if (answer.status == "success") {
                        var newLatLng = answer.result;
                        $scope.currentPosition.coords = newLatLng;
                        currentPositionMarker.setPosition($scope.currentPosition.coords);
                        currentMap.setCenter(newLatLng);
                        currentInfoWindow.close();
                    } else {
                        $ionicPopup.alert({
                            title: 'Detect Location',
                            template: answer.result
                        });
                    }
                });
            }
            /**
             *
             * Search near store
             *
             */
            $scope.searchLocationsNear = function(){
                var needleLatLng = currentPositionMarker.getPosition();
                MapService.locationService.searchLocationsNear(needleLatLng).then(function(markerNodes){
                    if( 0 < markerNodes.length){
                        var  makerNode, bounds = new google.maps.LatLngBounds();
                        //$(".nav-found .number", "#accordionBasicMap").text("(" + markerNodes.length + ")");
                        for (var i = 0; i < markerNodes.length; i++) {
                            makerNode = markerNodes[i];
                            var name = makerNode.getAttribute("name");
                            var address = makerNode.getAttribute("address");
                            var distance = parseFloat(makerNode.getAttribute("distance"));
                            var latlng = new google.maps.LatLng(parseFloat(makerNode.getAttribute("lat")),
                                parseFloat(makerNode.getAttribute("lng")));
                            var extra = {
                                zipcode: makerNode.getAttribute("zipcode"),
                                phone: makerNode.getAttribute("phone"),
                                fax: makerNode.getAttribute("fax"),
                                email: makerNode.getAttribute("email"),
                                website: makerNode.getAttribute("website"),
                                business_hour: makerNode.getAttribute("business_hour")
                            }
                            //d.createOption(name, distance, i, latlng, address);
                            createMarker(latlng, name, address, extra);
                            bounds.extend(latlng);
                        }
                        //capriMap.fitBounds(bounds);
                        /*locationSelect.style.visibility = "visible";
                        locationSelect.onchange = function () {
                            var markerNum = locationSelect.options[locationSelect.selectedIndex].value;
                            google.maps.event.trigger(capriMarkers[markerNum], 'click');
                        };*/
                    }
                });
            }
            /**
             *
             * @param infoWindow
             * @param addresInput
             */
            var updateInfoWindow = function(newLatLng, infoWindow){
                return $q(function(resolve, reject) {
                    GeoCoder.geocode({latLng: newLatLng}).then(function (results) {
                        infoWindow.setContent(results[0].formatted_address);
                        resolve({ status: "success", result: results[0].formatted_address });
                    });
                });
            }

            var pinMapUrl = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=";
            var paletteColor = [
                "4e67c8", "5eccf3", "a7ea52", "5dceaf", "ff8021", "f14124",
                "b8c2e9", "beeafa", "dbf6b9", "beebdf", "ffcca6", "f9b3a7",
                "94a3de", "9ee0f7", "caf297", "9de1cf", "ffb279", "f68d7b",
                "31479f", "11b2eb", "81d319", "34ac8b", "d85c00", "c3260c",
                "202f6a", "0b769c", "568c11", "22725c", "903d00", "821908"
            ];
            var serviceIcon = {
                url: "/img/beachflag.png",
                // This marker is 20 pixels wide by 32 pixels tall.
                size: new google.maps.Size(28, 40),
                // The origin for this image is 0,0.
                origin: new google.maps.Point(0,0),
                // The anchor for this image is the base of the flagpole at 0,32.
                anchor: new google.maps.Point(0, 32)
            };
            /**
             *
             * @param latlng
             * @param name
             * @param address
             */
            var createMarker = function (latlng, name, address, extra) {
                var placeItemTmp = _.template(document.getElementById("placeItemTmp").innerHTML);
                var imgPath = typeof extra.imgPath == "undefined" ? "/img/icon.jpg" : extra.imgPath;
                //var html = "store content";
                var html = placeItemTmp({imgPath: imgPath, name:name, address: address, zipcode: extra.zipcode,
                    phone: UtilService.phoneFormat(extra.phone), email:extra.email, website: UtilService.addHttp(extra.website)});
                var firstChar = name.charAt(0) ? name.charAt(0) : "0",
                    randomPalette = Math.floor(Math.random() * (paletteColor.length - 1));
                    serviceIcon.url = pinMapUrl + firstChar + "|" + paletteColor[randomPalette] + "|000000";

                var marker = new google.maps.Marker({
                    icon: serviceIcon,
                    map: currentMap,
                    position: latlng,
                    storeContent: html,
                    animation: google.maps.Animation.DROP
                });
                google.maps.event.addListener(marker, 'click', function (evt) {
                    currentInfoWindow.setContent(marker.storeContent);
                    currentInfoWindow.open(currentMap, marker);
                    /*$(".js-btn-direction").off("click").on("click", function(evt){
                        directionModule.calcRoute(myLatlng, latlng);
                        return false;
                    });
                    $(".js-btn-favourite").off("click").on("click", function(evt){
                        var myTitle = $(this).attr("title");
                        var l = Ladda.create(this);
                        l.start();
                        favouriteModule.addFavourite(null, {title: myTitle, lat: latlng.lat(), lng: latlng.lng()});
                        setTimeout(function(){l.stop();}, 500);
                        return false;
                    });*/
                });
                var menuItems=[],contextMenuOptions={};
                contextMenuOptions.classNames={menu:'context_menu', menuSeparator:'context_menu_separator'};
                menuItems.push({className:'context_menu_item', eventName:'directions_destination_click', id:'directionsDestinationItem', label:'Directions to here'});
                contextMenuOptions.menuItems=menuItems;
                //var contextMenu = new ContextMenu(capriMap, contextMenuOptions);

                /*google.maps.event.addListener(contextMenu, 'menu_item_selected', function(latLng, eventName){
                    directionModule.calcRoute(myLatlng, latLng);
                });*/

                /*google.maps.event.addListener(marker, 'rightclick', function (evt) {
                    //d.contextMenuMarker(evt, marker, latlng);
                    contextMenu.show(evt.latLng);
                    return false;
                });*/
                /*capriMarkers.push(marker);*/
            }
        /*var myLatlng = new google.maps.LatLng(37.3000, -120.4833);
        /*$scope.$on('viewState.viewEnter', function(e, d) {
            var mapEl = angular.element(document.querySelector('.angular-google-map'));
            var iScope = mapEl.isolateScope();
            var map = iScope.map;
            google.maps.event.trigger(map, "resize");
        });*/
    }]);

;