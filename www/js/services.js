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
            if(profile && profile.role) {
                if (profile.role == 'admin') {
                    role = USER_ROLES.admin
                } else if (profile.role == 'owner') {
                    role = USER_ROLES.owner
                } else if (profile.role == 'customer') {
                    role = USER_ROLES.customer
                } else {
                    role = USER_ROLES.public
                }
            }
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
                        authToken = response.data.token;
                        var req = {
                            method: 'GET',
                            url: API_PARAM.apiUrl + 'profile?token='+response.data.token
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
                    url: API_PARAM.apiUrl + 'profile?token='+authToken
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
            return isAuthenticated && authToken != null && authToken != "";
        }

        var loadRole = function(){
            return role;
        }

        var refresh = function(){
            return $q(function(resolve, reject) {
                $http({
                    method: 'POST',
                    url: API_PARAM.apiUrl + 'refresh?token=' + authToken,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    transformResponse: function(data, headers){
                        var response = {};
                        response.data = data;
                        response.headers = headers();
                        return response;
                    }
                }).success(function(response) {
                    var newToken = response.headers.authorization;
                    newToken = newToken.substr(7);
                    authToken = newToken;
                    $auth.setToken(newToken);
                    console.log(newToken);
                    resolve({status:'success'});
                }).error(function(data, status, headers, config) {
                    resolve({status:'fail'});
                });
            });
        }
        loadUserCredentials();

        return {
            login: login,
            logout: logout,
            refresh: refresh,
            isAuthorized: isAuthorized,
            authToken: authToken,
            isAuthenticated: isAuthenticateFn,
            userProfile: loadLocalUserProfile,
            reloadUserProfile: reloadUserProfile,
            loadRole: loadRole
        };
    })
    .factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
        return {
            responseError: function (response) {
                $rootScope.hideLoading();
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
            $auth.signup(data).then(function(responseData) {
                resolve(responseData.data);
            }, function(responseData) {
                resolve(responseData.data);
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
    var doGetOffers = function(formData){
        return $q(function(resolve, reject) {
            Store.offer({id:formData.store_id}, function(responseData) {
                resolve(responseData.data);
            })
        });
    }
    var doFavourite = function(storeId){
        return $q(function(resolve, reject) {
            Profile.favourite({id: 1, store_id: storeId}, function(responseData) {
                resolve(responseData);
            })
        });
    }
    var unFavourite = function(storeId){
        return $q(function(resolve, reject) {
            Profile.unfavourite({id: 1, store_id: storeId}, function(responseData) {
                resolve(responseData);
            })
        });
    }
    return {
        confirmResetPassword: confirmResetPassword,
        doSignUp: doSignUp,
        doUpdate: doUpdate,
        doGetPlace: doGetPlace,
        doGetOffers: doGetOffers,
        doFavourite: doFavourite,
        unFavourite: unFavourite
    };
});
services.factory('Profile', ['$resource' , 'AuthService', 'API_PARAM', function($resource, AuthService, API_PARAM) {
    return $resource(API_PARAM.apiUrl + 'profile/:id/:extendController',
        {id: '@id', extendController: '@extendController'},{
        query: {
            params: {token: AuthService.authToken},
            update: {method: "PUT"}
        },
        place: {method:'GET', params:{id: '@id', extendController: 'place', token: AuthService.authToken}},
        favourite: {method:'POST', params:{id: '@id', extendController: 'favourite', token: AuthService.authToken}},
        unfavourite: {method:'POST', params:{id: '@id', extendController: 'unfavourite', token: AuthService.authToken}
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
services.service('StoreService', function($q, $http, $auth, Profile, Store) {
    var getFollower = function(storeId, keyword){
        return $q(function(resolve, reject) {
            Store.customer({id:storeId, keyword:keyword}, function(responseData) {
                resolve(responseData.data);
            });
        });
    }
    var getStore = function(storeId){
        return $q(function(resolve, reject) {
            Store.get({id:storeId}, function(responseData) {
                resolve(responseData.data);
            });
        });
    }
    var doUpdate = function(formData, $storeId){
        return $q(function(resolve, reject) {
            Store.save(angular.extend({id:$storeId}, formData), function(responseData){
                resolve(responseData);
            });
        });
    }
    var fetchStore = function(formData){
        return $q(function(resolve, reject) {
            Store.query(formData, function(responseData){
                resolve(responseData);
            }, function err(error) {
                console.log(error);
                reject(error);
            });
        });
    }

    return {
        getFollower: getFollower,
        getStore: getStore,
        doUpdate: doUpdate,
        fetchStore: fetchStore
    };
});
/*************** Begin Store Model ******************/
services.factory('Store', ['$resource', 'AuthService', 'API_PARAM', function($resource, AuthService, API_PARAM) {
    return $resource(API_PARAM.apiUrl + 'store/:id/:extraController', {id: '@id', extraController: '@extraController'},{
        query: {
            params: {token: AuthService.authToken},
            update: {method: 'PUT'}
        },
        get: {method:'GET', params:{id: '@id', token: AuthService.authToken}},
        offer: {method:'GET', params:{id: '@id', extraController: 'offers', token: AuthService.authToken}},
        customer: {method:'GET', params:{id: '@id', extraController: 'customers', token: AuthService.authToken}}
    });
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
    return $resource(API_PARAM.apiUrl + 'receipts/:id', {id: '@id'});
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
    var customerNote = $resource(API_PARAM.apiUrl + 'profile/:user_id/notes/:id',
        {user_id: '@user_id', id: '@id'},
        {query:{params: {token: AuthService.authToken}},
		 update:{method:'PUT'}
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
    var customerNote = $resource(API_PARAM.apiUrl + 'profile/:user_id/feedbacks/:id',
        {user_id: '@user_id', id: '@id'},
        {query: {
            params: {token: AuthService.authToken},
            update: {method: 'PUT'}, query: {
                method: 'GET',
                isArray: false
            }
        }});
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
services.service('ReservationService', function($q, $http, $auth, CustomerReservation, OwnerReservation) {
    var customerFetchAll = function(userId, storeId, keyword){
        return $q(function(resolve, reject) {
            CustomerReservation.query({user_id: userId, store_id: storeId, keyword: keyword}, function(responseData) {
                resolve(responseData.data);
            })
        });
    }
	var ownerFetchAll = function(userId, storeId, keyword, statusObj){
        return $q(function(resolve, reject) {
            OwnerReservation.query({user_id: userId, store_id: storeId, keyword: keyword, "status[]": statusObj}, function(responseData) {
                resolve(responseData.data);
            })
        });
    }
	var ownerAnswer = function(userId, reservationData){
        return $q(function(resolve, reject) {
            OwnerReservation.answer({user_id: userId, id: reservationData.id}, reservationData).$promise.then(function(responseData) {
                resolve(responseData);
            })
        });
    }
	
    return {
        customerFetchAll: customerFetchAll,
        ownerFetchAll: ownerFetchAll,
		ownerAnswer: ownerAnswer
    };
});
services.factory('CustomerReservation', ['$resource', 'AuthService', 'API_PARAM', function($resource, AuthService, API_PARAM) {
    var customerReservation = $resource(API_PARAM.apiUrl + 'profile/:user_id/reservations/:id',
        {user_id: '@user_id', id: '@id'},
        {query:{params: {token: AuthService.authToken}},update:{method:'PUT'}});
    return customerReservation;
}]);
services.factory('OwnerReservation', ['$resource', 'AuthService', 'API_PARAM', function($resource, AuthService, API_PARAM) {
    var ownerReservation = $resource(API_PARAM.apiUrl + 'owner/:user_id/reservations/:id/:extraFunction',
        {user_id: '@user_id', id: '@id'},
        {query:{params: {token: AuthService.authToken}},
		 update:{method:'PUT'},
		 answer:{method:'PUT',params:{extraFunction: 'answer'}}
        });
    return ownerReservation;
}]);
/******************** Owner service **********************/
services.service('OwnerService', function($q, $http, $auth, Owner) {
    var doGetCount = function(store_id){
        return $q(function(resolve, reject) {
            Owner.query({store_id: store_id}, function(responseData) {
                resolve(responseData.data);
            })
        });
    }
    return {
        doGetCount: doGetCount
    };
});
services.factory('Owner', ['$resource', 'AuthService', 'API_PARAM', function($resource, AuthService, API_PARAM) {
    var owner = $resource(API_PARAM.apiUrl + 'owner/:id',
        {id: '@id'},
        {query: {params: {token: AuthService.authToken}},
         update: {method: 'PUT'}
    });
    return owner;
}]);
services.factory('MultiOwnerLoader', ['Owner', '$q',
    function(Owner, $q) {
        return function() {
            var delay = $q.defer();
            Owner.query(function(owners) {
                delay.resolve(owners);
            }, function() {
                delay.reject('Unable to fetch receipts');
            });
            return delay.promise;
        };
    }]);
services.factory('OwnerLoader', ['Owner', '$route', '$q',
    function(Owner, $route, $q) {
        return function() {
            var delay = $q.defer();
            Owner.get({id: $route.current.params.id}, function(owner) {
                delay.resolve(owner);
            }, function() {
                delay.reject('Unable to fetch CustomerFeedback ' + $route.current.params.id);
            });
            return delay.promise;
        };
    }]);
/******************** End Owner service **********************/
/******************** Store Offer service **********************/
services.factory('StoreOffer', ['$resource', 'AuthService', 'API_PARAM', function($resource, AuthService, API_PARAM) {
    var storeOffer = $resource(API_PARAM.apiUrl + 'store_offer/:id',
        { id: '@id'},
        { query: {params: {token: AuthService.authToken}},
          update: {method: 'PUT'}
        });
    return storeOffer;
}]);
services.factory('MultiStoreOfferLoader', ['StoreOffer', '$q',
    function(StoreOffer, $q) {
        return function() {
            var delay = $q.defer();
            StoreOffer.query(function(responseData) {
                delay.resolve(responseData);
            }, function() {
                delay.reject('Unable to fetch receipts');
            });
            return delay.promise;
        };
    }]);
services.factory('StoreOfferLoader', ['StoreOffer', '$route', '$q',
    function(StoreOffer, $route, $q) {
        return function() {
            var delay = $q.defer();
            StoreOffer.get({id: $route.current.params.id}, function(responseData) {
                delay.resolve(responseData);
            }, function() {
                delay.reject('Unable to fetch CustomerNote ' + $route.current.params.id);
            });
            return delay.promise;
        };
    }]);
/******************** End Offer service **********************/
