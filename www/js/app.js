// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// bower install angular-mocks --save
// <script src="lib/angular-mocks/angular-mocks.js"></script>
// https://docs.angularjs.org/api/ngMockE2E
angular.module('collaApp', ['ionic', 'ngMockE2E', 'ngResource', 'ion-gallery'])
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
    .config(function ($stateProvider, $urlRouterProvider, USER_ROLES) {
        $stateProvider
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
            .state('customer', {
                url: '/',
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
                        templateUrl: 'templates/customer/offer.html'
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
                url: 'customer/info',
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
            .state('customer.receipt', {
                url: 'customer/receipt',
                views: {
                    'main-content': {
                        templateUrl: 'templates/customer/receipt.html',
                        controller: 'PlaceCtrl'
                    }
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin,USER_ROLES.customer]
                }
            })
            .state('customer.feedback', {
                url: 'customer/feedback',
                views: {
                    'main-content': {
                        templateUrl: 'templates/customer/feedback.html',
                        controller: 'PlaceCtrl'
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
                        templateUrl: 'templates/customer/contact.html'
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
                },
                data: {
                    authorizedRoles: [USER_ROLES.admin,USER_ROLES.customer]
                }
            });
        $urlRouterProvider.otherwise('/customer/dash');
    })
    .run(function($httpBackend){
        $httpBackend.whenGET('http://localhost:8100/valid')
            .respond({message: 'This is my valid response!'});
        $httpBackend.whenGET('http://localhost:8100/notauthenticated')
            .respond(401, {message: "Not Authenticated"});
        $httpBackend.whenGET('http://localhost:8100/notauthorized')
            .respond(403, {message: "Not Authorized"});
        $httpBackend.whenGET('/stores/1')
            .respond(STORE_LIST[0]);

        $httpBackend.whenGET(/templates\/\w+.*/).passThrough();
    })
    .run(function ($rootScope, $state, AuthService, AUTH_EVENTS, EXCLUDE_PATH) {
        $rootScope.$on('$stateChangeStart', function (event, next, nextParams, fromState) {
            if ('data' in next && 'authorizedRoles' in next.data) {
                var authorizedRoles = next.data.authorizedRoles;
                if (!AuthService.isAuthorized(authorizedRoles)) {
                    event.preventDefault();
                    $state.go($state.current, {}, {reload: true});
                    $rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
                }
            }else if(EXCLUDE_PATH.indexOf(next.name) > -1){
                return;
            }else if (!AuthService.isAuthenticated()) {
                if (next.name !== 'login') {
                    event.preventDefault();
                    $state.go('login');
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
    }).directive('backImg', function(){
        return function(scope, element, attrs){
            var url = attrs.backImg;
            element.css({
                'background-image': 'url(' + url +')',
                'background-size' : 'cover'
            });
        };
    });


/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}