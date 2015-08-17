/**
 * Created by Root on 12/7/2015.
 */
var services = angular.module('collaApp');

services.service('AuthService', function($q, $http, $auth, API_PARAM, USER_ROLES) {
        var LOCAL_TOKEN_KEY = 'LOCAL_TOKEN_KEY';
        var LOCAL_USERPROFILE_KEY = 'LOCAL_USERPROFILE_KEY';
        var isAuthenticated = false;
        var role = USER_ROLES.public;
        var authToken = null;

        function loadUserCredentials() {
            var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
            var userProfile = window.localStorage.getItem(LOCAL_USERPROFILE_KEY);
            if (token && userProfile) {
                useCredentials(token, JSON.parse(userProfile));
            }
        }

        function storeUserCredentials(token, profile) {
            window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
            window.localStorage.setItem(LOCAL_USERPROFILE_KEY, JSON.stringify(profile));
            useCredentials(token, profile);
        }

        function useCredentials(token, profile) {
            isAuthenticated = true;
            authToken = token;
            console.log("set role" + role);
            if(profile && profile.role) {
                if (profile.role == 'admin') {
                    role = USER_ROLES.admin
                } else if (profile.role == 'user') {
                    role = USER_ROLES.public
                } else if (profile.role == 'customer') {
                    role = USER_ROLES.customer
                } else {
                    role = USER_ROLES.customer
                }
            }
            console.log("after set role" + role);
            // Set the token as header for your requests!
            $http.defaults.headers.common['X-Auth-Token'] = authToken;
            //$http.defaults.headers.get = {token: authToken};
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
                            url: API_PARAM.baseUrl + 'profile?token='+response.data.token
                        }
                        $http(req).then(function(dataProfile){
                            // success handler
                            storeUserCredentials(response.data.token, dataProfile.data.data);
                            resolve('Login success.');
                        }, function(){
                            reject('Login Failed.');
                        });
                    }else{
                        reject('Login Failed.');
                    }
                });
            });
        };

        var logout = function() {
            destroyUserCredentials();
        };

        var isAuthorized = function(authorizedRoles) {
            console.log(role);
            if (!angular.isArray(authorizedRoles)) {
                authorizedRoles = [authorizedRoles];
            }
            return (isAuthenticated && authorizedRoles.indexOf(role) !== -1);
        };

        var loadLocalUserProfile = function(){
            return JSON.parse(window.localStorage.getItem(LOCAL_USERPROFILE_KEY));
        }

        var reloadUserProfile = function(){
            return $q(function(resolve, reject) {
                var req = {
                    method: 'GET',
                    url: API_PARAM.baseUrl + 'profile?token='+authToken
                }
                $http(req).then(function(dataProfile){
                    // success handler
                    storeUserCredentials(authToken, dataProfile.data.data);
                    resolve({status: 'success', data: dataProfile.data.data});
                }, function(){
                    reject({status:'fail'});
                });
            });
        }

        var isAuthenticateFn = function() {
            return isAuthenticated && authToken != null;
        }

        loadUserCredentials();

        return {
            login: login,
            logout: logout,
            isAuthorized: isAuthorized,
            authToken: authToken,
            isAuthenticated: isAuthenticateFn,
            userProfile: function() {return loadLocalUserProfile();},
            reloadUserProfile: reloadUserProfile,
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
services.service('ProfileService', function($q, $http, $auth, Profile, Store) {
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
                resolve(response);
            });
        });
    }
    var doUpdate = function(formData){
        return $q(function(resolve, reject) {
            Profile.save(formData, function(response){
                resolve(response);
            });
        });
    }
    var doGetPlace = function(){
        return $q(function(resolve, reject) {
            Profile.place({id:1}, function(responseData) {
                resolve(responseData.data);
            })
        });
    }
    var doGetOffers = function(storeId){
        return $q(function(resolve, reject) {
            Store.offer({id:storeId}, function(responseData) {
                resolve(responseData.data);
            })
        });
    }
    var doFavourite = function(storeId){
        return $q(function(resolve, reject) {
            Profile.favourite({id: 1, store_id: storeId}, function(responseData) {
                resolve(responseData.data);
            })
        });
    }

    return {
        confirmResetPassword: confirmResetPassword,
        doSignUp: doSignUp,
        doUpdate: doUpdate,
        doGetPlace: doGetPlace,
        doGetOffers: doGetOffers,
        doFavourite: doFavourite
    };
});
services.factory('Profile', ['$resource' , 'AuthService', 'API_PARAM', function($resource, AuthService, API_PARAM) {
    return $resource(API_PARAM.baseUrl + 'profile/:id/:extendController',
        {id: '@id', extendController: '@extendController'},
        {
            place: {method:'GET', params:{id: '@id', extendController: 'place', token: AuthService.authToken}},
            favourite: {method:'POST', params:{id: '@id', extendController: 'favourite', token: AuthService.authToken}
        }
    });
}]);
services.factory('MultiProfileLoader', ['Profile', '$q',
    function(Profile, $q) {
        return function() {
            var delay = $q.defer();
            Profile.query(function(profiles) {
                delay.resolve(profiles);
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
    return $resource(API_PARAM.baseUrl + 'store/:id/:offerController', {id: '@id', offerController: '@offerController'},
        {offer: {method:'GET', params:{id: '@id', offerController: 'offers'}}}
    );
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
    var customerNote = $resource(API_PARAM.baseUrl + 'profile/:user_id/notes/:id',
        {   user_id: '@user_id', id: '@id'},
        {   query: {
                params: {token: AuthService.authToken},
                update: {method: 'PUT'}, query: {
                    method: 'GET',
                    isArray: false
                }
            }
        });
    return customerNote;
}]);
services.factory('MultiCustomerNoteLoader', ['CustomerNote', '$q',
    function(CustomerNote, $q) {
        return function() {
            var delay = $q.defer();
            CustomerNote.query(function(customerNotes) {
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
/******************** Customer Feedback **********************/
services.factory('CustomerFeedback', ['$resource', 'AuthService', 'API_PARAM', function($resource, AuthService, API_PARAM) {
    console.log("token: " + AuthService.authToken);
    var customerNote = $resource(API_PARAM.baseUrl + 'profile/:user_id/feedbacks/:id',
        {   user_id: '@user_id', id: '@id'},
        {   query: {
            params: {token: AuthService.authToken},
            update: {method: 'PUT'}, query: {
                method: 'GET',
                isArray: false
            }
        }
        });
    return customerNote;
}]);
services.factory('MultiCustomerFeedbackLoader', ['CustomerFeedback', '$q',
    function(CustomerFeedback, $q) {
        return function() {
            var delay = $q.defer();
            CustomerFeedback.query(function(customerFeedbacks) {
                delay.resolve(customerFeedbacks);
            }, function() {
                delay.reject('Unable to fetch receipts');
            });
            return delay.promise;
        };
    }]);
services.factory('CustomerFeedbackLoader', ['CustomerFeedback', '$route', '$q',
    function(CustomerFeedback, $route, $q) {
        return function() {
            var delay = $q.defer();
            CustomerFeedback.get({customerId: $route.current.params.customerId, id: $route.current.params.id}, function(customerFeedback) {
                delay.resolve(customerFeedback);
            }, function() {
                delay.reject('Unable to fetch CustomerFeedback ' + $route.current.params.id);
            });
            return delay.promise;
        };
    }]);
/******************** Customer Reservation **********************/
