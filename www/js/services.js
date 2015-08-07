/**
 * Created by Root on 12/7/2015.
 */
var services = angular.module('collaApp');

services.service('AuthService', function($q, $http, $auth, USER_ROLES) {
        var LOCAL_TOKEN_KEY = 'LOCAL_TOKEN_KEY';
        var LOCAL_USERPROFILE_KEY = 'LOCAL_USERPROFILE_KEY';
        var isAuthenticated = false;
        var role = '';
        var authToken;

        function loadUserCredentials() {
            var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
            if (token) {
                useCredentials(token);
            }
        }

        function storeUserCredentials(token, profile) {
            window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
            window.localStorage.setItem(LOCAL_USERPROFILE_KEY, JSON.stringify(profile.data));
            useCredentials(token, profile);
        }

        function useCredentials(token, profile) {
            isAuthenticated = true;
            authToken = token;

            /*if (username == 'admin') {
                role = USER_ROLES.admin
            }else if (username == 'user') {
                role = USER_ROLES.public
            }else if (username == 'customer') {
                role = USER_ROLES.customer
            }else{*/
                role = USER_ROLES.customer
            /*}*/

            // Set the token as header for your requests!
            $http.defaults.headers.common['X-Auth-Token'] = token;
        }

        function destroyUserCredentials() {
            authToken = undefined;
            isAuthenticated = false;
            $http.defaults.headers.common['X-Auth-Token'] = undefined;
            window.localStorage.removeItem(LOCAL_TOKEN_KEY);
            window.localStorage.removeItem(LOCAL_USERPROFILE_KEY);
            $auth.logout();
        }

        var login = function(credentials) {
            return $q(function(resolve, reject) {
                $auth.login(credentials).then(function(response){
                    if(response.status == 200){
                        var req = {
                            method: 'GET',
                            url: 'http://localhost:8000/v1/api/profile?token='+response.data.token
                        }
                        $http(req).then(function(dataProfile){
                            // success handler
                            storeUserCredentials(response.data.token, dataProfile.data);
                            resolve('Login success.');
                        }, function(){
                            reject('Login Failed.');
                        });
                    }else{
                        reject('Login Failed.');
                    }
                });
            });
            /*return $q(function(resolve, reject) {
                if ((name == 'admin' && pw == '1') || (name == 'user' && pw == '1') || (name == 'customer' && pw == '1')) {
                    // Make a request and receive your auth token from your server
                    storeUserCredentials(name + '.yourServerToken', {"username": name});
                    resolve('Login success.');
                } else {
                    reject('Login Failed.');
                }
            });*/
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

        var loadUserProfile = function(){
            return JSON.parse(window.localStorage.getItem(LOCAL_USERPROFILE_KEY));
        }

        loadUserCredentials();

        return {
            login: login,
            logout: logout,
            isAuthorized: isAuthorized,
            authToken: authToken,
            isAuthenticated: function() {return isAuthenticated;},
            userProfile: function() {return loadUserProfile();},
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

/*************** Profile Service/Model ******************/
services.service('ProfileService', function($q, $http, $auth, USER_ROLES) {
    var confirmResetPassword = function(username) {
        return $q(function(resolve, reject) {
            if (username == 'admin' || username == 'customer') {
                resolve('success');
            } else {
                reject('failed');
            }
        });
    };
    var doSignUp = function(data){
        return $q(function(resolve, reject) {
            $auth.signup(data).then(function(response) {
                console.log(response);
            });
        });
    }
    return {
        confirmResetPassword: confirmResetPassword,
        doSignUp: doSignUp
    };
});
services.factory('Profile', ['$resource', function($resource) {
    return $resource('v1/api/profile/:id', {id: '@id'});
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
services.factory('Store', ['$resource', 'API_PARAM', function($resource, API_PARAM) {
    return $resource(API_PARAM.baseUrl + 'stores/:id', {id: '@id'});
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
services.factory('Receipt', ['$resource', 'API_PARAM', function($resource, API_PARAM) {
    return $resource(API_PARAM.baseUrl + 'receipts/:id', {id: '@id'});
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
/******************** Customer Note **********************/
services.factory('CustomerNote', ['$resource', 'AuthService', 'API_PARAM', function($resource, AuthService, API_PARAM) {
    var customerNote = $resource(API_PARAM.baseUrl + 'profile/:customerId/notes/:id', {customerId: '@customerId', id: '@id'}, {query: {params: {token: AuthService.authToken}}});
    return customerNote;
}]);
services.factory('MultiCustomerNoteLoader', ['CustomerNote', '$q',
    function(CustomerNote, $q) {
        return function() {
            var delay = $q.defer();
            CustomerNote.query(function(customerNotes) {
                console.log(customerNotes);
                delay.resolve(customerNotes);
            }, function() {
                delay.reject('Unable to fetch receipts');
            });
            return delay.promise;
        };
    }]);
services.factory('CustomerNoteLoader', ['CustomerNote', '$route', '$q',
    function(CustomerNote, $route, $q) {
        return function() {
            var delay = $q.defer();
            CustomerNote.get({customerId: $route.current.params.customerId, id: $route.current.params.id}, function(customerNote) {
                delay.resolve(customerNote);
            }, function() {
                delay.reject('Unable to fetch CustomerNote ' + $route.current.params.id);
            });
            return delay.promise;
        };
    }]);