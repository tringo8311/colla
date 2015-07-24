/**
 * Created by Root on 12/7/2015.
 */
var services = angular.module('collaApp');

services.service('AuthService', function($q, $http, USER_ROLES) {
        var LOCAL_TOKEN_KEY = 'yourTokenKey';
        var username = '';
        var isAuthenticated = false;
        var role = '';
        var authToken;

        function loadUserCredentials() {
            var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
            if (token) {
                useCredentials(token);
            }
        }

        function storeUserCredentials(token) {
            window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
            useCredentials(token);
        }

        function useCredentials(token) {
            username = token.split('.')[0];
            isAuthenticated = true;
            authToken = token;

            if (username == 'admin') {
                role = USER_ROLES.admin
            }
            if (username == 'user') {
                role = USER_ROLES.public
            }
            if (username == 'customer') {
                role = USER_ROLES.customer
            }

            // Set the token as header for your requests!
            $http.defaults.headers.common['X-Auth-Token'] = token;
        }

        function destroyUserCredentials() {
            authToken = undefined;
            username = '';
            isAuthenticated = false;
            $http.defaults.headers.common['X-Auth-Token'] = undefined;
            window.localStorage.removeItem(LOCAL_TOKEN_KEY);
        }

        var login = function(name, pw) {
            return $q(function(resolve, reject) {
                if ((name == 'admin' && pw == '1') || (name == 'user' && pw == '1') || (name == 'customer' && pw == '1')) {
                    // Make a request and receive your auth token from your server
                    storeUserCredentials(name + '.yourServerToken');
                    resolve('Login success.');
                } else {
                    reject('Login Failed.');
                }
            });
        };

        var logout = function() {
            destroyUserCredentials();
        };

        var isAuthorized = function(authorizedRoles) {
            if (!angular.isArray(authorizedRoles)) {
                authorizedRoles = [authorizedRoles];
            }
            return (isAuthenticated && authorizedRoles.indexOf(role) !== -1);
        };

        loadUserCredentials();

        return {
            login: login,
            logout: logout,
            isAuthorized: isAuthorized,
            isAuthenticated: function() {return isAuthenticated;},
            username: function() {return username;},
            role: function() {return role;}
        };
    })
    .factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
        return {
            responseError: function (response) {
                $rootScope.$broadcast({
                    401: AUTH_EVENTS.notAuthenticated,
                    403: AUTH_EVENTS.notAuthorized
                }[response.status], response);
                return $q.reject(response);
            }
        };
    })
    .config(["$httpProvider", function ($httpProvider) {
        $httpProvider.interceptors.push('AuthInterceptor');
    }]);

/*************** Profile Model ******************/
services.factory('Profile', ['$resource', function($resource) {
    return $resource('/profiles/:id', {id: '@id'});
}]);
services.factory('MultiProfileLoader', ['Profile', '$q',
    function(Store, $q) {
        return function() {
            var delay = $q.defer();
            Store.query(function(stores) {
                delay.resolve(stores);
            }, function() {
                delay.reject('Unable to fetch stores');
            });
            return delay.promise;
        };
    }]);
services.factory('ProfileLoader', ['Profile', '$route', '$q',
    function(Profile, $route, $q) {
        return function() {
            var delay = $q.defer();
            Profile.get({id: $route.current.params.profileId}, function(profile) {
                delay.resolve(profile);
            }, function() {
                delay.reject('Unable to fetch store ' + $route.current.params.profileId);
            });
            return delay.promise;
        };
    }]);
/*************** End Profile Model ******************/
/*************** Begin Store Model ******************/
services.factory('Store', ['$resource', function($resource) {
    return $resource('/stores/:id', {id: '@id'});
}]);
services.factory('MultiStoreLoader', ['Store', '$q',
    function(Store, $q) {
        return function() {
            var delay = $q.defer();
            Store.query(function(stores) {
                delay.resolve(stores);
            }, function() {
                delay.reject('Unable to fetch stores');
            });
            return delay.promise;
        };
    }]);
services.factory('StoreLoader', ['Store', '$route', '$q',
    function(Store, $route, $q) {
        return function() {
            var delay = $q.defer();
            Store.get({id: $route.current.params.storeId}, function(store) {
                delay.resolve(store);
            }, function() {
                delay.reject('Unable to fetch store ' + $route.current.params.storeId);
            });
            return delay.promise;
        };
    }]);
/*************** End Store Model ******************/
/*************** Receipt Model ******************/
services.factory('Receipt', ['$resource', function($resource) {
    return $resource('/receipts/:id', {id: '@id'});
}]);
services.factory('MultiReceiptLoader', ['Receipt', '$q',
    function(Store, $q) {
        return function() {
            var delay = $q.defer();
            Store.query(function(stores) {
                delay.resolve(stores);
            }, function() {
                delay.reject('Unable to fetch receipts');
            });
            return delay.promise;
        };
    }]);
services.factory('ReceiptLoader', ['Receipt', '$route', '$q',
    function(Store, $route, $q) {
        return function() {
            var delay = $q.defer();
            Store.get({id: $route.current.params.receiptId}, function(store) {
                delay.resolve(store);
            }, function() {
                delay.reject('Unable to fetch store ' + $route.current.params.receiptId);
            });
            return delay.promise;
        };
    }]);