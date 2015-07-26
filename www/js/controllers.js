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
    .controller('LoginCtrl', function($scope, $state, $ionicPopup, $interval, Util, AuthService) {
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
    .controller('AroundCtrl', ['$scope', "$q", "$state", "$http", "$interval", "$ionicPopup", "$window", "GeoCoder", "AuthService",
        function($scope, $q, $state, $http, $interval, $ionicPopup, $window, GeoCoder, AuthService) {
            var currentMap = null;
            $scope.dimenstion = {
                dev_width : $window.innerWidth,
                dev_height : $window.innerHeight
            }
            $scope.addressInput = "";
            $scope.currentPosition = {coords:{lat:44.7032,lng:-74.0052}, heading:"",address:""};
            var currentPositionMarker = null, currentInfoWindow = null;
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
                });
        });
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
        /*var myLatlng = new google.maps.LatLng(37.3000, -120.4833);

        var mapOptions = {
            center: myLatlng,
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        var map = new google.maps.Map(document.getElementById("map"), mapOptions);

        navigator.geolocation.getCurrentPosition(function(pos) {
            map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
            var myLocation = new google.maps.Marker({
                position: new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude),
                map: map,
                title: "My Location"
            });
        });
        $scope.map = map;*/
        /*$scope.$on('viewState.viewEnter', function(e, d) {
            var mapEl = angular.element(document.querySelector('.angular-google-map'));
            var iScope = mapEl.isolateScope();
            var map = iScope.map;
            google.maps.event.trigger(map, "resize");
        });*/
    }]);

;