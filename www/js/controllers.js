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
    .controller('LoginCtrl', function($scope, $state, $ionicPopup, $interval, AuthService) {
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
        var backImgArr = ["bg1.jpg","bg2.jpg","bg3.jpg","bg4.jpg","bg5.jpg"];
        $scope.backImg = backImgArr[getRandomInt(0, backImgArr.length - 1)];

        $interval(function(){
            $scope.backImg = backImgArr[getRandomInt(0, backImgArr.length - 1)];
        }, 1000, 5);
    })
    .controller('NavController', function($scope, $ionicSideMenuDelegate) {
        $scope.toggleLeft = function() {
            $ionicSideMenuDelegate.toggleLeft();
        };
    })
    .controller('ForgotPasswordCtrl', function($scope, $ionicSideMenuDelegate) {

    })
    .controller('SignUpCtrl', function($scope, $ionicSideMenuDelegate) {

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
            console.log('CTRL - $ionicView.loaded', viewInfo, state);
            angular.element(document.querySelector("#qrcode")).empty();
            new QRCode("qrcode", {
                text: "http://jindo.dev.naver.com/collie",
                width: 128,
                height: 128,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
        });
        $scope.$on('$ionicView.unloaded', function (viewInfo, state) {
            console.log('CTRL - $ionicView.unloaded', viewInfo, state);
        });
    })
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
    .controller('AroundCtrl', function($scope, $ionicLoading) {
        var myLatlng = new google.maps.LatLng(37.3000, -120.4833);

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
        $scope.map = map;
    });

;