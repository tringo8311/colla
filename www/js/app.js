// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// bower install angular-mocks --save
// <script src="lib/angular-mocks/angular-mocks.js"></script>
// https://docs.angularjs.org/api/ngMockE2E
angular.module('ionic.utils', []).factory('$localStorage', ['$window', function($window) {
    return {
        set: function(key, value) {
            $window.localStorage[key] = value;
        },
        get: function(key, defaultValue) {
            return $window.localStorage[key] || defaultValue;
        },
        setObject: function(key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function(key) {
            try {
                return JSON.parse($window.localStorage[key] || null);
            } catch (e) {
                return null;
            }
        }
    }
}]);
angular.module('collaApp', ['ionic', 'ionic.utils', 'ngMockE2E', 'ngResource', 'ngAnimate', 'ngMap', 'underscore', 'ui.router', 'satellizer'])
    .run(function($ionicPlatform) {
        $ionicPlatform.ready(function() {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if(window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if(window.StatusBar) {
                StatusBar.styleDefault();
            }
        });
    })
    .config(function ($stateProvider, $ionicConfigProvider, $urlRouterProvider, $authProvider, USER_ROLES, API_PARAM) {
        $authProvider.baseUrl = API_PARAM.baseUrl;
        $authProvider.loginUrl = 'v1/api/authenticate';
        $authProvider.signupUrl = 'v1/api/user/signup';
        $authProvider.loginOnSignup = false;
        $authProvider.facebook({
            clientId: '624059410963642'
        });

        $authProvider.google({
            clientId: '631036554609-v5hm2amv4pvico3asfi97f54sc51ji4o.apps.googleusercontent.com'
        });
        $authProvider.github({
            clientId: '0ba2600b1dbdb756688b'
        });
        $authProvider.linkedin({
            clientId: '77cw786yignpzj'
        });
        $authProvider.yahoo({
            clientId: 'dj0yJmk9dkNGM0RTOHpOM0ZsJmQ9WVdrOVlVTm9hVk0wTkRRbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD0wMA--'
        });
        $authProvider.live({
            clientId: '000000004C12E68D'
        });
        $authProvider.twitter({
            url: '/auth/twitter'
        });
        $authProvider.oauth2({
            name: 'foursquare',
            url: '/auth/foursquare',
            redirectUri: window.location.origin,
            clientId: 'MTCEJ3NGW2PNNB31WOSBFDSAD4MTHYVAZ1UKIULXZ2CVFC2K',
            authorizationEndpoint: 'https://foursquare.com/oauth2/authenticate'
        });

        $ionicConfigProvider.tabs.position('bottom');
        $ionicConfigProvider.navBar.alignTitle('center');

        $stateProvider.
            state('landing', {
                url: '/landing',
                templateUrl: 'templates/landing.html'
            })
            .state('login', {
                url: '/login',
                templateUrl: 'templates/login.html',
                controller: 'LoginCtrl'
            })
            .state('forgotpassword', {
                url: '/forgotpassword',
                templateUrl: 'templates/public/forgot_password.html',
                controller: 'ForgotPasswordCtrl'
            })
            .state('signup', {
                url: '/signup',
                templateUrl: 'templates/public/signup.html',
                controller: 'SignUpCtrl'
            })
            .state('logout', {
                url: '/logout',
                controller: 'LogoutCtrl'
            })
            .state('public', {
                url: '/public',
                templateUrl: 'templates/public.html'
            })
            .state('customer', {
                url: '/customer',
                abstract: true,
                templateUrl: 'templates/customer/main-abstract.html'
            })
            .state('customer.dash', {
                url: 'customer/dash',
                views: {
                    'main-content': {
                        templateUrl: 'templates/customer/dashboard.html',
                        controller: 'DashCtrl'
                    }
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin, USER_ROLES.customer]
                }
            })
            .state('customer.offer', {
                url: 'customer/offer',
                views: {
                    'main-content': {
                        templateUrl: 'templates/customer/offer.html',
                        controller: 'OfferCtrl'
                    }
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin, USER_ROLES.customer]
                }
            })
            .state('customer.around', {
                url: 'customer/around',
                views: {
                    'main-content': {
                        templateUrl: 'templates/customer/around.html',
                        controller: 'AroundCtrl'
                    }
                }
            })
            .state('customer.admin', {
                url: 'customer/admin',
                views: {
                    'main-content': {
                        templateUrl: 'templates/admin.html'
                    }
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin]
                }
            })
            .state('customer.info', {
                url: 'customer/info/:id',
                views: {
                    'main-content': {
                        templateUrl: 'templates/customer/info.html',
                        controller: 'PlaceCtrl'
                    }
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin,USER_ROLES.customer]
                }
            })
            .state('customer.note', {
                url: 'customer/note',
                views: {
                    'main-content': {
                        templateUrl: 'templates/customer/note.html',
                        controller: 'CustomerNoteCtrl'
                    }
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin,USER_ROLES.customer]
                }
            })
			.state('customer.reservation', {
                url: 'customer/reservation',
                views: {
                    'main-content': {
                        templateUrl: 'templates/customer/reservation.html',
                        controller: 'CustomerReservationCtrl'
                    }
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin,USER_ROLES.customer]
                }
            })
            .state('customer.feedback', {
                url: 'customer/feedback/:storeId',
                views: {
                    'main-content': {
                        templateUrl: 'templates/customer/feedback.html',
                        controller: 'CustomerFeedbackCtrl'
                    }
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin,USER_ROLES.customer]
                }
            })
            .state('customer.profile', {
                url: 'customer/profile',
                views: {
                    'main-content': {
                        templateUrl: 'templates/customer/profile.html',
                        controller: 'ProfileCtrl'
                    }
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin,USER_ROLES.customer]
                }
            })
            .state('customer.setting', {
                url: 'customer/setting',
                views: {
                    'main-content': {
                        templateUrl: 'templates/customer/setting.html'
                    }
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin,USER_ROLES.customer]
                }
            })
            .state('customer.help', {
                url: 'customer/help',
                views: {
                    'main-content': {
                        templateUrl: 'templates/customer/help.html'
                    }
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin,USER_ROLES.customer]
                }
            })
            .state('customer.contact', {
                url: 'customer/contact',
                views: {
                    'main-content': {
                        templateUrl: 'templates/customer/contact.html',
                        controller: 'ContactCtrl'
                    }
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin,USER_ROLES.customer]
                }
            })
            .state('customer.policy', {
                url: 'customer/policy',
                views: {
                    'main-content': {
                        templateUrl: 'templates/customer/policy.html'
                    }
                }
            })
            .state('owner', {
                url: '/',
                abstract: true,
                templateUrl: 'templates/owner/main-abstract.html'
            })
            .state('owner.contact', {
                url: 'owner/contact',
                views: {
                    'main-content': {
                        templateUrl: 'templates/owner/contact.html',
                        controller: 'OwnerContactCtrl'
                    }
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin,USER_ROLES.owner]
                }
            })
            .state('owner.help', {
                url: 'owner/help',
                views: {
                    'main-content': {
                        templateUrl: 'templates/owner/help.html'
                    }
                }
            })
            .state('owner.profile', {
                url: 'owner/profile',
                views: {
                    'main-content': {
                        templateUrl: 'templates/owner/profile.html',
                        controller: 'OwnerProfileCtrl'
                    }
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin,USER_ROLES.owner]
                }
            })
            .state('owner.business', {
                url: 'owner/business',
                views: {
                    'main-content': {
                        templateUrl: 'templates/owner/business.html',
                        controller: 'OwnerBusinessCtrl'
                    }
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin,USER_ROLES.owner]
                }
            })
            .state('owner.dash', {
                url: 'owner/dash',
                views: {
                    'main-content': {
                        templateUrl: 'templates/owner/dash.html',
						controller: 'OwnerDashCtrl'
                    }
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin,USER_ROLES.owner]
                }
            })
			.state('owner.reservation', {
                url: 'owner/reservation',
                views: {
                    'main-content': {
                        templateUrl: 'templates/owner/reservation.html',
						controller: 'OwnerReservationCtrl'
                    }
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin,USER_ROLES.owner]
                }
            })
            .state('owner.follower', {
                url: 'owner/follower',
                views: {
                    'main-content': {
                        templateUrl: 'templates/owner/follower.html',
                        controller: 'OwnerFollowerCtrl'
                    }
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin,USER_ROLES.owner]
                }
            })
			.state('owner.policy', {
                url: 'owner/policy',
                views: {
                    'main-content': {
                        templateUrl: 'templates/owner/policy.html'
                    }
                }
            })
            .state('owner.offer', {
                url: 'owner/offer',
                views: {
                    'main-content': {
                        templateUrl: 'templates/owner/offer.html',
                        controller: 'OwnerOfferCtrl'
                    }
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin,USER_ROLES.owner]
                }
            });
            $urlRouterProvider.otherwise('landing');
    })
    .run(function($httpBackend){
        /*$httpBackend.whenGET('http://localhost:8100/valid')
            .respond({message: 'This is my valid response!'});
        $httpBackend.whenGET('http://localhost:8100/notauthenticated')
            .respond(401, {message: "Not Authenticated"});
        $httpBackend.whenGET('http://localhost:8100/notauthorized')
            .respond(403, {message: "Not Authorized"});

        $httpBackend.whenGET(/templates\/\w+.*//*).passThrough();
        $httpBackend.whenPOST(/localhost:8000\/.*//*).passThrough();
        $httpBackend.whenGET(/localhost:8000\/.*//*).passThrough();
        $httpBackend.whenDELETE(/localhost:8000\/.*//*).passThrough();*/
        $httpBackend.whenGET(/templates\/\w+.*/).passThrough();
        $httpBackend.whenGET(/^\w+.*/).passThrough();
        $httpBackend.whenPUT(/^\w+.*/).passThrough();
        $httpBackend.whenPOST(/^\w+.*/).passThrough();
        $httpBackend.whenDELETE(/^\w+.*/).passThrough();
    })
    .run(function($rootScope, $state, AuthService, AUTH_EVENTS, EXCLUDE_PATH) {
        $rootScope.$on('$stateChangeStart', function (event, next, nextParams, fromState) {
            // page required authentication
            //console.log(AuthService.isAuthenticated());
            if(EXCLUDE_PATH.indexOf(next.name) > -1 || $state.current.name == "login") {
                return;
            }else if (!AuthService.isAuthenticated()) {
                if (next.name !== 'login') {
                    event.preventDefault();
                    $state.go('login');
                }
            }else if ('data' in next && 'authorizedRoles' in next.data) {
                var authorizedRoles = next.data.authorizedRoles;
                if (!AuthService.isAuthorized(authorizedRoles)) {
                    event.preventDefault();
                    if($state.abstract || $state.current.abstract){
                        $state.go('landing');
                    }else{
                        $state.go($state.current, {}, {reload: true});
                        $rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
                    }
                }
            }
        });
    }).directive('focusMe', function($timeout) {
        return {
            scope: { trigger: '@focusMe' },
            link: function(scope, element) {
                scope.$watch('trigger', function(value) {
                    if(value === "true") {
                        $timeout(function() {
                            element[0].focus();
                        });
                    }
                });
            }
        };
    }).directive('backImg', function($interval, UtilService){
        return {
            restrict: "A",
            scope:{
                title: "@",
                author: "@",
                content: "@",
                backUrl: "@"
            },
            templateUrl: '',
            link: function(scope, element, attrs) {
                var backImgArr = attrs.backImg.split(',');
                var newBackGround = scope.backUrl + backImgArr[UtilService.getRandomInt(0, backImgArr.length - 1)];
                $interval(function () {
                    newBackGround = scope.backUrl + backImgArr[UtilService.getRandomInt(0, backImgArr.length - 1)];
                    element.css({
                        'background-image': 'url(' + newBackGround + ')',
                        'background-size': 'cover'
                    });
                }, 2000, 5);

                element.css({
                    'background-image': 'url(' + newBackGround + ')',
                    'background-size': 'cover'
                });
            }
        };
    }).directive('ngEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if(event.which === 13) {
                    scope.$apply(function (){
                        scope.$eval(attrs.ngEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    }).directive('starRating', function() {
        return {
            restrict: 'EA',
            template:
            '<ul class="star-rating" ng-class="{readonly:1}">' +
            '  <li ng-repeat="star in stars" class="star" ng-click="toggle($index)">' +
            '    <i class="" ng-class="star.filled ? \'ion-android-star\': \'ion-android-star-outline\'"></i>' + // or &#9733
            '  </li>' +
            '</ul>',
            scope: {
                ratingValue: '=ngModel',
                max: '=?', // optional (default is 5)
                onRatingSelect: '&?',
                readonly: '=?'
            },
            link: function(scope, element, attributes) {
                if (scope.max == undefined) {
                    scope.max = 5;
                }
                function updateStars() {
                    scope.stars = [];
                    for (var i = 0; i < scope.max; i++) {
                        scope.stars.push({
                            filled: i < scope.ratingValue
                        });
                    }
                };
                scope.toggle = function(index) {
                    if (scope.readonly == undefined || scope.readonly === false){
                        scope.ratingValue = index + 1;
                        scope.onRatingSelect({
                            rating: index + 1
                        });
                    }
                };
                scope.$watch('ratingValue', function(oldValue, newValue) {
                    if (newValue) {
                        updateStars();
                    }
                });
            }
        };
    }).directive('fileUpload', function () {
        return {
            scope: true,        //create a new scope
            link: function (scope, el, attrs) {
                el.bind('change', function (event) {
                    var files = event.target.files;
                    //iterate files since 'multiple' may be specified on the element
                    for (var i = 0;i<files.length;i++) {
                        //emit event upward
                        scope.$emit("fileSelected", { file: files[i] });
                    }
                });
            }
        };
    });