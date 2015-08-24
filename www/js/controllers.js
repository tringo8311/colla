/**
 *
 * @type {*|module}
 */
var collaApp = angular.module('collaApp');
    collaApp.controller('AppCtrl', function($rootScope, $scope, $state, $ionicPopup, $ionicLoading, AuthService, AUTH_EVENTS, APP_CONFIG) {
        $rootScope.APP_CONFIG = APP_CONFIG;
        $rootScope.showLoading = function() {
            $ionicLoading.show(); //options default to values in $ionicLoadingConfig
        };
        $rootScope.hideLoading = function() {
            $ionicLoading.hide();
        }

        $scope.userProfile = null;
        $scope.flashMessage = {
            visibility: false,
            className: "",
            message: ''
        }
        if(AuthService.userProfile()){
            $scope.userProfile = AuthService.userProfile();
        }

        $scope.$on(AUTH_EVENTS.notAuthorized, function(event) {
            $ionicPopup.alert({
                title: 'Unauthorized!',
                template: 'You are not allowed to access this resource.'
            });
        });

        $scope.$on(AUTH_EVENTS.notAuthenticated, function(event) {
            $ionicPopup.alert({
                title: 'Session Lost!',
                template: 'Sorry, You have to login again.'
            });
            AuthService.logout();
            $state.go('login');
        });

        // A confirm dialog
        $scope.doShowConfirm = function(yrTitle, yrTemplate) {
            var confirmPopup = $ionicPopup.confirm({
                title: yrTitle,
                template: yrTemplate
            });
            return confirmPopup;
        };
        $scope.doReloadCurrentProfile = function(){
            AuthService.reloadUserProfile().then(function(responseData){
                $scope.userProfile = responseData.data;
            });
            $scope.$broadcast('scroll.refreshComplete');
        }

        $scope.setCurrentProfile = function(profile) {
            $scope.userProfile = profile;
        };

        $scope.logout = function() {
            AuthService.logout();
            $state.go('login');
        };
    })
    .controller('LogoutCtrl', function($location, AuthService){
        AuthService.logout();
        $location.path('/login');
    })
    .controller('LoginCtrl', function($rootScope, $scope, $state, $ionicPopup, $interval, $auth, UtilService, AuthService, USER_ROLES) {
        $scope.data = {};
        $scope.remember = 0;

        $scope.login = function() {
            $rootScope.showLoading();
            var credentials = {
                email: $scope.data.email,
                password: $scope.data.password,
                remember: $scope.remember
            }
            // Use Satellizer's $auth service to login
            AuthService.login(credentials).then(function(data) {
                $rootScope.hideLoading();
                if(AuthService.loadRole()==USER_ROLES.owner){
                    $state.go('owner.dash', {}, {reload: true});
                }else if(AuthService.loadRole()==USER_ROLES.customer){
                    $state.go('customer.dash', {}, {reload: true});
                }else{

                }
                //$state.go('customer.dash', {}, {reload: true});
                $scope.setCurrentProfile(AuthService.userProfile());
            }, function(err){
                $rootScope.hideLoading();
            });
            /*AuthService.login(data.username, data.password).then(function(authenticated) {
                $state.go('customer.dash', {}, {reload: true});
                $scope.setCurrentUsername(data.username);
            }, function(err) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Login failed!',
                    template: 'Please check your credentials!'
                });
            });*/
        };
        $scope.authenticate = function(type){
            if(type=='google'||type=='facebook'||type=='twitter'){
                $auth.authenticate(type).then(function(response) {
                    // Signed In.
                });
            }
        }
    })
    .controller('NavController', function($scope, $ionicSideMenuDelegate) {
        $scope.toggleLeft = function() {
            $ionicSideMenuDelegate.toggleLeft();
        };
    })
    .controller('ForgotPasswordCtrl', function($scope, $ionicPopup, $ionicSideMenuDelegate, ProfileService) {
        $scope.data = { username: "", code: "", haveCode: false};
        $scope.resetPassword = function(data){
            ProfileService.confirmResetPassword(data.username).then(function(answer) {
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
    })
    .controller('SignUpCtrl', function($scope, $state, $ionicSideMenuDelegate, $ionicPopup, $timeout, ProfileService, AuthService) {
        $scope.formData = {}
        /**
         * do validate and save data
         * @param data
         */
        $scope.doSignUp = function(formData) {
            // Go to login page
            $rootScope.showLoading();
            ProfileService.doSignUp(formData).then(function(responseData){
                if(responseData.status=="success"){
                    $scope.flashMessage.className = "success";
                    $scope.flashMessage.message = null;
                    //$timeout(function(){$state.go('login');}, 1000);
                }else{
                    $scope.flashMessage.className = "error";
                    //$timeout(function(){$scope.flashMessage.visibility = false;}, 2000);
                    $scope.flashMessage.message = responseData.message;
                    $scope.flashMessage.visibility = true;
                }
                $rootScope.hideLoading();
            });
        }
        // TODO: check login or yet
        if(AuthService.isAuthenticated()){
            $state.go('customer.dash');
        }
    })
    .controller('ProfileCtrl', function($scope, $state, $http, $ionicPopup, $timeout, AuthService, ProfileService) {
        if(AuthService.isAuthenticated()){
            $scope.formData = AuthService.userProfile();
        }else{
            $scope.go("login");
        }
        $scope.doReset = function(){
            $scope.formData = AuthService.userProfile();
        }
        $scope.updateProfile = function(){
            ProfileService.doUpdate($scope.formData).then(function(response){
                if(response.status=="success"){
                    $scope.flashMessage.className = "success";
                }else{
                    $scope.flashMessage.className = "error";
                }
                $scope.flashMessage.visibility = true;
                $scope.flashMessage.message = response.message;

                $timeout(function() {
                    $scope.flashMessage.visibility = false;
                }, 2000);
            });
        }
    })
    .controller('DashCtrl', function($scope, $state, $http, $ionicPopup, AuthService) {
        /*$scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
        });*/
        $scope.$on('$ionicView.loaded', function (viewInfo, state) {
            //console.log('CTRL - $ionicView.loaded', viewInfo, state);
            if(document.querySelector("#qrcode")){
                angular.element(document.querySelector("#qrcode")).empty();
                new QRCode("qrcode", {
                    text: $scope.userProfile.code,
                    width: 200,
                    height: 200,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });
            }
        });
    })
    .controller('ContactCtrl', ['$scope', "$state", "$http", "$ionicPopup", "AuthService", "API_PARAM", function($scope, $state, $http, $ionicPopup, AuthService, API_PARAM) {
        $scope.formData = {
            fullname: $scope.userProfile.username,
            email: $scope.userProfile.email
        }
        $scope.message = {
            submissionMessage: "",
            submission: false
        }
        var param = function(data) {
            var returnString = '';
            for (d in data){
                if (data.hasOwnProperty(d))
                    returnString += d + '=' + data[d] + '&';
            }
            // Remove last ampersand and return
            return returnString.slice( 0, returnString.length - 1 );
        };
        $scope.doSendContact = function(){
            $http({
                method : 'POST',
                url : API_PARAM.appUrl + 'profile/contact?token=' + AuthService.authToken,
                data : param($scope.formData), // pass in data as strings
                headers : { 'Content-Type': 'application/x-www-form-urlencoded' } // set the headers so angular passing info as form data (not request payload)
            }).success(function(data) {
                if (!data.status == "success") {
                    // if not successful, bind errors to error variables
                    //$scope.message.submissionMessage = data.messageError;
                    $scope.message.submissionMessage = data.message;
                    $scope.message.submission = true; //shows the error message
                } else {
                    // if successful, bind success message to message
                    angular.forEach(data.message, function(value, key) {
                        $scope.message.submissionMessage += '<li>' + value + '</li>';
                    });
                    $scope.message.submission = true; //shows the success message
                    $scope.formData = {
                        fullname: $scope.userProfile.username,
                        email: $scope.userProfile.email
                    }
                }
            });
        }
    }])
    .controller('OfferCtrl', ['$scope', "$state", "$http", "$ionicPopup", "$ionicSlideBoxDelegate", "AuthService", "ProfileService", function($scope, $state, $http, $ionicPopup, $ionicSlideBoxDelegate, AuthService, ProfileService) {
        if($scope.userProfile.store_id){
            ProfileService.doGetOffers({store_id: $scope.userProfile.store_id}).then(function(responseData) {
                $scope.offers = responseData;
                setTimeout(function(){$ionicSlideBoxDelegate.update();}, 500);
            });
        }
        $scope.currentIndex = 0;
        $scope.setCurrentSlideIndex = function (index) {
            $scope.currentIndex = index;
        };
        $scope.isCurrentSlideIndex = function (index) {
            return $scope.currentIndex === index;
        };
        $scope.prevSlide = function () {
            $scope.currentIndex = ($scope.currentIndex < $scope.slides.length - 1) ? ++$scope.currentIndex : 0;
        };
        $scope.nextSlide = function () {
            $scope.currentIndex = ($scope.currentIndex > 0) ? --$scope.currentIndex : $scope.slides.length - 1;
        };
        /* assuming the slides are static cache this to save DOM lookups
        $scope.$on('$ionicView.enter', function(){
            // this is not polling anymore
            var firstSlide = document.querySelectorAll('.container .slider-slide')[0];
            if(firstSlide != undefined){
                var width = firstSlide.clientWidth;
                // only update when the width is wrong
                if(width === 0) {
                    $ionicSlideBoxDelegate.update();
                }
            }
        });*/
    }])
    .controller('CustomerNoteCtrl', ['$scope', "$state", "$http", "$ionicModal", "$timeout", "AuthService", "CustomerNote", function($scope, $state, $http, $ionicModal, $timeout, AuthService, CustomerNote) {
        $scope.data = {showDelete : false};
        $scope.formData = {keyword:""};
        $scope.noteData = {user_id: $scope.userProfile.id};

        $scope.doRefresh = function(){
            CustomerNote.query({user_id: $scope.userProfile.id, keyword: $scope.formData.keyword}, function(notes){
                $scope.customerNotes = notes.data;
                $scope.$broadcast('scroll.refreshComplete');
            }, function(errResponse) {
                $scope.$broadcast('scroll.refreshComplete');
            });
        }
        $scope.doRemove = function(item){
            $scope.doShowConfirm("Delete?", "Are you sure want to remove this item?").then(function(answer){
                if(answer){
                    CustomerNote.remove({user_id: $scope.userProfile.id, id : item.id}, function(responseData){
                        if(responseData.status=="success"){
                            $scope.flashMessage.className = "success";
                        }else{
                            $scope.flashMessage.className = "error";
                        }
                        $scope.flashMessage.visibility = true;
                        $scope.flashMessage.message = responseData.message;

                        $timeout(function(){$scope.flashMessage.visibility = false;}, 2000);
                        $scope.customerNotes.splice( $scope.customerNotes.indexOf(item), 1 );
                    });
                }
            });
        }
        $scope.saveNote = function(){
            $rootScope.showLoading();
            CustomerNote.save($scope.noteData, function(responseData){
                $rootScope.hideLoading();
                if(responseData.status == "success"){
                    $scope.customerNotes.push(responseData.data);
                    $scope.noteData= {user_id: $scope.userProfile.id};
                }else{
                    console.log("failure");
                }
                $scope.closeModal();
            });
        }
        $scope.doRefresh();

        $ionicModal.fromTemplateUrl('templates/partial/note-tmp.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.modal = modal;
        });
        $scope.openModal = function() {
            $scope.modal.show();
        };
        $scope.closeModal = function() {
            $scope.modal.hide();
        };
    }])
    .controller('CustomerFeedbackCtrl', ['$scope', "$state", "$http", "$ionicModal", "AuthService", "CustomerFeedback", "RATING", function($scope, $state, $http, $ionicModal, AuthService, CustomerFeedback, RATING) {
        // Feedback
        $scope.customerFeedbacks = [];
        $scope.doRefresh = function(){
            CustomerFeedback.query({user_id: 1}, function(feedbacks){
                $scope.customerFeedbacks = feedbacks.data;
                $scope.$broadcast('scroll.refreshComplete');
            }, function(errResponse) {
                $scope.$broadcast('scroll.refreshComplete');
            });
        }
        $scope.doRefresh();

        // set class for
        $scope.ratingClass = "";
        $scope.$watch('feedbackData.rate', function (oldValue, newValue) {
            angular.forEach(RATING, function(item, key) {
                if(parseInt($scope.feedbackData.rate) == item.value){
                    $scope.ratingClass = item.className;
                    return;
                }
            });
        });
        $scope.feedbackData = { user_id: 1, rate: 1, service: "", employee: "", content: ""};
        $scope.saveFeedback = function(){
            CustomerFeedback.save($scope.feedbackData, function(responseData){
                if(responseData.status=="success"){
                    $scope.customerFeedbacks.push(responseData.data);
                    $scope.feedbackData={ user_id: 1, rate: 1, service: "", employee: "", content: ""};
                }else{

                }
                $scope.closeModal();
            });
        }

        $ionicModal.fromTemplateUrl('templates/partial/feedback-tmp.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.modal = modal;
        });
        $scope.openModal = function() {
            $scope.modal.show();
        };
        $scope.closeModal = function() {
            $scope.modal.hide();
        };
    }])
    .controller('PlaceCtrl', ['$scope', "$state", "$http", "$ionicPopup", "AuthService", "ProfileService", "UtilService", function($scope, $state, $http, $ionicPopup, AuthService, ProfileService, UtilService) {
        $scope.store = {};
        ProfileService.doGetPlace().then(function(myStore) {
            var firstChar = myStore.title.charAt(0) ? myStore.title.charAt(0) : "0";
            angular.extend($scope.store, myStore, {
                phone: UtilService.phoneFormat(myStore.phone),
                website: UtilService.addHttp(myStore.website),
                firstChar: firstChar
            });
        });
        $scope.slides = [
            {
                src:'/img/sample/sample1.jpg',
                sub: 'This is a <b>subtitle</b>'
            },{
                src:'/img/sample/sample2.jpg',
                sub: 'Heo moi ' /* Not showed */
            },{
                src:'/img/sample/sample3.jpg'
            }
        ]
        $scope.currentIndex = 0;
        $scope.setCurrentSlideIndex = function (index) {
            $scope.currentIndex = index;
        };
        $scope.isCurrentSlideIndex = function (index) {
            return $scope.currentIndex === index;
        };
        $scope.prevSlide = function () {
            $scope.currentIndex = ($scope.currentIndex < $scope.slides.length - 1) ? ++$scope.currentIndex : 0;
        };
        $scope.nextSlide = function () {
            $scope.currentIndex = ($scope.currentIndex > 0) ? --$scope.currentIndex : $scope.slides.length - 1;
        };
    }])
    .controller('AroundCtrl', ['$scope', "$q", "$state", "$http", "$interval", "$ionicPopup", "$ionicModal", "$ionicPopover", "$window", "GeoCoder", "UtilService", "AuthService", "MapService", "ProfileService", "_",function($scope, $q, $state, $http, $interval, $ionicPopup, $ionicModal, $ionicPopover, $window, GeoCoder, UtilService, AuthService, MapService, ProfileService, _) {
        var currentMap = null, currentPositionMarker = null, currentInfoWindow = null;
        $scope.dimenstion = {
            dev_width : $window.innerWidth,
            dev_height : $window.innerHeight
        }
        $scope.addressInput = "";
        $scope.currentPosition = {coords:{lat:37.7749295,lng:-122.41941550000001}, heading:"",address:""};
        $scope.markerList = [];
        $scope.mapDirection = {};
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
            updateInfoWindow(currentPositionMarker.getPosition(), currentInfoWindow).then(function(result){
                $scope.addressInput = result.result;
            });
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
                $scope.searchLocationsNear();
            });
            MapService.directionService.init(currentMap, "directionsPanel", [{"name": 'directions_changed', "callback": function(total){
               $scope.mapDirection.path_length = total;
            }}]);
            MapService.directionService.run();

            /**
             * Search near store
             */
            var showPopup = function (marker) {
                $scope.dataPopup = marker.storeObj;
                var directionClick = function () {
                    //$scope.openPopoverDirection();
                    MapService.directionService.calcRoute(currentPositionMarker.getPosition(), $scope.dataPopup.latlng);
                }
                $ionicPopup.show({
                    title: "Information",
                    cssClass: '',
                    subTitle: '',
                    template: '',
                    templateUrl: '/templates/partial/place-tmp.html',
                    scope: $scope,
                    buttons: [{
                        text: 'Direction',
                        type: 'button-calm button-outline',
                        onTap: function (e) {
                            directionClick();
                        }
                    }, {
                        text: 'Favourite',
                        type: 'button-positive button-outline',
                        onTap: function (e) {
                            var storeId = $scope.dataPopup.id;
                            ProfileService.doFavourite(storeId).then(function(responseData) {
                                console.log(responseData);
                            }, function(error){
                                console.log(error);
                            });
                            return true;
                        }
                    }, {
                        text: 'Close',
                        type: 'button-positive button-outline'
                    }]
                });
            }
            MapService.markerService.init(currentMap, [{name: "click", callback: function(storeObj){
                showPopup(storeObj);
            }}]);
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
        $scope.setCenterMap = function(evt){
            evt.preventDefault();
            currentMap.setCenter(currentPositionMarker.getPosition());
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
        $scope.searchLocationsNear = function(){
            var needleLatLng = currentPositionMarker.getPosition();
            $scope.markerList = [];
            MapService.locationService.searchLocationsNear(needleLatLng, parseInt($scope.myRadius)).then(function(markerNodes){
                if( 0 < markerNodes.length){
                    var makerNode, firstChar = 'A', bounds = new google.maps.LatLngBounds();
                    for (var i = 0; i < markerNodes.length; i++) {
                        makerNode = markerNodes[i];
                        var id = makerNode.getAttribute("id"),
                            title = makerNode.getAttribute("title"),
                            firstChar = title.charAt(0) ? title.charAt(0) : "0",
                            address = makerNode.getAttribute("address"),
                            distance = parseFloat(makerNode.getAttribute("distance"));

                        var latlng = new google.maps.LatLng(parseFloat(makerNode.getAttribute("lat")),
                            parseFloat(makerNode.getAttribute("lng")));

                        var extra = {
                            id: id,
                            zipcode: makerNode.getAttribute("zipcode"),
                            phone: makerNode.getAttribute("phone"),
                            fax: makerNode.getAttribute("fax"),
                            email: makerNode.getAttribute("email"),
                            website: makerNode.getAttribute("website"),
                            business_hour: makerNode.getAttribute("business_hour"),
                            distance: UtilService.toFixed(distance, 2), firstChar: firstChar
                        }
                        $scope.markerList.push(angular.extend({title: title, address: address}, extra));
                        MapService.markerService.createMarker(latlng, title, address, extra);
                    }
                    bounds.extend(latlng);
                    currentMap.setZoom(14);
                }
            });
        }
        /**
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
        /**
         *
         * @type {null}
         */
        $scope.radiusList = [
            {name:'3 miles', value: '3'},
            {name:'5 miles', value: '5'},
            {name:'10 miles', value: '10'},
            {name:'25 miles', value: '25'},
            {name:'50 miles', value: '50'}
        ];
        $scope.myRadius = '3';
        $scope.popoverRadius = null;
        $scope.selectRadius = function(ev, radius){
            ev.preventDefault();
            $scope.myRadius = radius.value;
            $scope.closePopoverRadius();
            return;
        };
        $scope.selectedRadius = function(radius){
            return $scope.myRadius === radius.value;
        };
        $ionicPopover.fromTemplateUrl('/templates/partial/radius-tmp.html', {
            scope: $scope
        }).then(function(popover) {
            $scope.popoverRadius = popover;
        });
        $scope.openPopoverRadius = function($event) {
            $scope.popoverRadius.show($event);
        };
        $scope.closePopoverRadius = function() {
            $scope.popoverRadius.hide();
        };

        $ionicPopover.fromTemplateUrl('/templates/partial/result-tmp.html', {
            scope: $scope
        }).then(function(popover) {
            $scope.popoverResult = popover;
        });
        $scope.openPopoverResult = function($event) {
            $scope.popoverResult.show($event);
        };
        $scope.closePopoverResult = function() {
            $scope.popoverResult.hide();
        };

        $ionicPopover.fromTemplateUrl('/templates/partial/direction-tmp.html', {
            scope: $scope
        }).then(function(popover) {
            $scope.popoverDirection = popover;
        });
        $scope.openPopoverDirection = function($event) {
            $scope.popoverDirection.show($event);
        };
        $scope.closePopoverDirection = function() {
            $scope.popoverDirection.hide();
        };
        /*var myLatlng = new google.maps.LatLng(37.3000, -120.4833);
        /*$scope.$on('viewState.viewEnter', function(e, d) {
            var mapEl = angular.element(document.querySelector('.angular-google-map'));
            var iScope = mapEl.isolateScope();
            var map = iScope.map;
            google.maps.event.trigger(map, "resize");
        });*/
    }])
    .controller('OwnerProfileCtrl', function($scope, $state, $http, $ionicPopup, $timeout, AuthService, ProfileService) {
        if(AuthService.isAuthenticated()){
            $scope.formData = AuthService.userProfile();
        }else{
            $scope.go("login");
        }
        $scope.updateProfile = function(){
            ProfileService.doUpdate($scope.data).then(function(response){
                if(response.status=="success"){
                    $scope.flashMessage.className = "success";
                }else{
                    $scope.flashMessage.className = "error";
                }
                $scope.flashMessage.visibility = true;
                $scope.flashMessage.message = response.message;

                $timeout(function() {
                    $scope.flashMessage.visibility = false;
                }, 2000);
            });
        }
    })
    .controller('OwnerBusinessCtrl', function($rootScope, $scope, $state, $http, $ionicPopup, $timeout, AuthService, StoreService) {
        var doRefresh = function(){
            StoreService.getStore($scope.userProfile.store_id).then(function(responseData){
                $scope.formData = responseData;
                $scope.$broadcast('scroll.refreshComplete');
            });
        }
        if(AuthService.isAuthenticated()){
            doRefresh();
        }else{
            $scope.go("login");
        }
        $scope.doReset = function(){
            doRefresh();
        }
        $scope.updateBusiness = function(){
            $rootScope.showLoading();
            StoreService.doUpdate($scope.data, $scope.userProfile.store_id).then(function(response){
                $rootScope.hideLoading();
                if(response.status=="success"){
                    $scope.flashMessage.className = "success";
                }else{
                    $scope.flashMessage.className = "error";
                }
                $scope.flashMessage.visibility = true;
                $scope.flashMessage.message = response.message;

                $timeout(function() {
                    $scope.flashMessage.visibility = false;
                }, 3000);

            });
        }
    })
    .controller('OwnerDashCtrl', function($scope, $state, $http, $ionicPopup, AuthService, OwnerService) {
		$scope.data = {'customerSize': '0', 'rateAverage' : '0','offerSize' : '0'};
		var store_id = $scope.userProfile.store_id;
        if(store_id){
            $scope.doRefresh = function(){
                OwnerService.doGetCount(store_id).then(function(responseData) {
                    $scope.data = responseData;
                    $scope.$broadcast('scroll.refreshComplete');
                }, function(errResponse) {
                    $scope.$broadcast('scroll.refreshComplete');
                });
            }
            $scope.doRefresh();
        }
    })
    .controller('OwnerFollowerCtrl', function($scope, $state, $http, $ionicPopup, AuthService, StoreService) {
		$scope.formData = {keyword:""};
        if($scope.userProfile.store_id){
            $scope.doRefresh = function(){
                StoreService.getFollower($scope.userProfile.store_id, $scope.formData.keyword).then(function(responseData) {
                    $scope.customers = responseData;
                    $scope.$broadcast('scroll.refreshComplete');
                }, function(errResponse) {
                    $scope.$broadcast('scroll.refreshComplete');
                });
            }
            $scope.doRefresh();
        }
		$scope.searchCustomer = function(){
			$scope.doRefresh();
		}
    })
    .controller('OwnerOfferCtrl', function($rootScope, $scope, $state, $http, $ionicPopup, $ionicModal, $timeout, $ionicSlideBoxDelegate, $filter, AuthService, ProfileService, StoreOffer, API_PARAM) {
        $scope.data = {showDelete : false};
        $scope.formData = {keyword:""};
        $scope.offerData = {user_id: $scope.userProfile.id, store_id: $scope.userProfile.store_id};
        $scope.doRefresh = function(){
            ProfileService.doGetOffers({store_id: $scope.userProfile.store_id, keyword: $scope.formData.keyword}).then(function(responseData){
                $scope.storeOffers = responseData;
                $scope.$broadcast('scroll.refreshComplete');
            }, function(errResponse) {
                $scope.$broadcast('scroll.refreshComplete');
            });
        }
        $scope.doRemove = function(evt, item){
            evt.preventDefault();
            $scope.doShowConfirm("Delete?", "Are you sure want to remove this item?").then(function(answer){
                if(answer){
                    StoreOffer.remove({id: item.id, store_id: $scope.offerData.store_id}, function(responseData){
                        if(responseData.status=="success"){
                            $scope.flashMessage.className = "success";
                        }else{
                            $scope.flashMessage.className = "error";
                        }
                        $scope.flashMessage.visibility = true;
                        $scope.flashMessage.message = responseData.message;

                        $timeout(function(){$scope.flashMessage.visibility = false;}, 2000);
                        $scope.storeOffers.splice( $scope.storeOffers.indexOf(item), 1 );
                    });
                }
            });
        }

        //an array of files selected
        $scope.files = [];

        //listen for the file selected event
        $scope.$on("fileSelected", function (event, args) {
            $scope.$apply(function () {
                //add the file object to the scope's files collection
                $scope.files.push(args.file);
            });
        });
        //the save method
        /*$scope.saveOffer = function() {
            $http({
                method: 'POST',
                url: API_PARAM.apiUrl + "store_offer?token=" + AuthService.authToken,
                //IMPORTANT!!! You might think this should be set to 'multipart/form-data'
                // but this is not true because when we are sending up files the request
                // needs to include a 'boundary' parameter which identifies the boundary
                // name between parts in this multi-part request and setting the Content-type
                // manually will not set this boundary parameter. For whatever reason,
                // setting the Content-type to 'false' will force the request to automatically
                // populate the headers properly including the boundary parameter.
                headers: { 'Content-Type': false },
                //This method will allow us to change how the data is sent up to the server
                // for which we'll need to encapsulate the model data in 'FormData'
                transformRequest: function (data) {
                    var formData = new FormData();
                    //need to convert our json object to a string version of json otherwise
                    // the browser will do a 'toString()' on the object which will result
                    // in the value '[Object object]' on the server.
                    formData.append("model", angular.toJson(data.model));
                    //now add all of the assigned files
                    for (var i = 0; i < data.files; i++) {
                        //add each file to the form data and iteratively name them
                        formData.append("file" + i, data.files[i]);
                    }
                    return formData;
                },
                //Create an object that contains the model and files which will be transformed
                // in the above transformRequest method
                data: { model: $scope.offerData, files: $scope.files }
            }).
            success(function (data, status, headers, config) {
                alert("success!");
            }).
            error(function (data, status, headers, config) {
                alert("failed!");
            });
        };*/
        $scope.saveOffer = function(){
            $rootScope.showLoading();
            StoreOffer.save($scope.offerData, function(responseData){
                $rootScope.hideLoading();
                if(responseData.status == "success"){
                    $scope.storeOffers.unshift(responseData.data);
                    $scope.offerData = {user_id: $scope.userProfile.id, store_id: $scope.userProfile.store_id};
                }else{
                    console.log("fail");
                }
                $scope.closeModal();
            });
        }
        $scope.doRefresh();

        $scope.modalTitle = "Create offer";
        $ionicModal.fromTemplateUrl('templates/partial/offer-tmp.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.modal = modal;
        });
        $scope.openModal = function() {
            $scope.modal.show();
        };
        $scope.closeModal = function() {
            $scope.modal.hide();
        };

        $scope.createOffer = function(){
            $scope.modalTitle = "Create offer";
            $scope.offerData = {user_id: $scope.userProfile.id, store_id: $scope.userProfile.store_id};
            $scope.openModal();
        }
        $scope.detailOffer = function(item){
            $scope.modalTitle = "Update offer";
            if(item.start_time){
                item.start_time = new Date(item.start_time);
            }
            if(item.end_time){
                item.end_time = new Date(item.end_time);
            }
            $scope.offerData = item;
            $scope.openModal();
        }
        /*$scope.toggleGroup = function(item) {
            if ($scope.isGroupShown(item)) {
                $scope.shownGroup = null;
            } else {
                $scope.shownGroup = item;
            }
        }
        $scope.isGroupShown = function(item){
            return $scope.shownGroup === item;
        }*/
    })
    .controller('OwnerContactCtrl', ['$scope', "$state", "$http", "$ionicPopup", "AuthService", "API_PARAM", function($scope, $state, $http, $ionicPopup, AuthService, API_PARAM) {
        $scope.formData = {
            fullname: $scope.userProfile.username,
            email: $scope.userProfile.email
        }
        $scope.message = {
            submissionMessage: "",
            submission: false
        }
        var param = function(data) {
            var returnString = '';
            for (d in data){
                if (data.hasOwnProperty(d))
                    returnString += d + '=' + data[d] + '&';
            }
            // Remove last ampersand and return
            return returnString.slice( 0, returnString.length - 1 );
        };
        $scope.doSendContact = function(){
            $http({
                method : 'POST',
                url : API_PARAM.appUrl + 'profile/contact?token=' + AuthService.authToken,
                data : param($scope.formData), // pass in data as strings
                headers : { 'Content-Type': 'application/x-www-form-urlencoded' } // set the headers so angular passing info as form data (not request payload)
            }).success(function(data) {
                if (!data.status == "success") {
                    // if not successful, bind errors to error variables
                    //$scope.message.submissionMessage = data.messageError;
                    $scope.message.submissionMessage = data.message;
                    $scope.message.submission = true; //shows the error message
                } else {
                    // if successful, bind success message to message
                    angular.forEach(data.messages, function(value, key) {
                        $scope.message.submissionMessage += '<li>' + value + '</li>';
                    });
                    $scope.message.submission = true; //shows the success message
                    $scope.formData = {
                        fullname: $scope.userProfile.username,
                        email: $scope.userProfile.email
                    }
                }
            });
        }
    }]);

