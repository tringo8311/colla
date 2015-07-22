/**
 * Created by Root on 12/7/2015.
 */
angular.module('collaApp')
.constant('AUTH_EVENTS', {
    notAuthenticated: 'auth-not-authenticated',
    notAuthorized: 'auth-not-authorized'
})
.constant('EXCLUDE_PATH', ["signup", "forgotpassword"])
.constant('USER_ROLES', {
    admin: 'admin_role',
    customer: 'customer_role',
    public: 'public_role'
});

var STORE_LIST = new Array();
STORE_LIST.push({
    "name": "Hand Job Nails",
    "address" : "565 Castro Street",
    "lat" : "37.764049",
    "lng" : "122.431297",
    "phone" : "4128632243",
    "website" : "handjobspa.com",
    "zipcode" : "94114",
    "distance" : "0.9819907734464064"
});
STORE_LIST.push({
    "name" : "Silk",
    "address" : "1425 Franklin St.",
    "lat" : "37.792728",
    "lng" : "-122.423186",
    "phone" : "4158853277",
    "website" : "silksf.com",
    "zipcode" : "94109",
    "distance" : "1.250054674024049"
});