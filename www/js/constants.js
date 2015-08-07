/**
 * Created by Root on 12/7/2015.
 */
angular.module('collaApp')
.constant('API_PARAM', {
    baseUrl : 'http://localhost:8000/v1/api/'
})
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
    "business_hour" : "Mon - Fri: 08:00 - 20:00 \n Sat - Sun: 08:00 - 18:00 ",
    "phone" : "4128632243",
    "website" : "handjobspa.com",
    "zipcode" : "94114",
    "distance" : "0.9819907734464064"
});
STORE_LIST.push({
    "name" : "Silk",
    "address" : "1425 Franklin St.",
    "business_hour" : "Mon - Fri: 08:00 - 20:00 \n Sat - Sun: 08:00 - 18:00 ",
    "lat" : "37.792728",
    "lng" : "-122.423186",
    "phone" : "4158853277",
    "website" : "silksf.com",
    "zipcode" : "94109",
    "distance" : "1.250054674024049"
});

var RECEIPT_LIST =  new Array();
RECEIPT_LIST.push({
    "number" : 1,
    "title": "Hand Job Nails",
    "date" : "1288323623006",
    "total" : "10000",
    "items" : []
});
RECEIPT_LIST.push({
    "number" : 2,
    "title" : "Silk",
    "date" : "1288326625006",
    "total" : "10000",
    "items" : []
});
RECEIPT_LIST[0].items = [
    { "id" : 1, title: "a", price: "123", "content" : "0.9819907734464064", "date" : "1288323623006" },
    { "id" : 2, title: "s", price: "312", "content" : "0.9819907734464064", "date" : "1288323623006" },
    { "id" : 3, title: "c", price: "45", "content" : "0.9819907734464064", "date" : "1288323623006" }
]
RECEIPT_LIST[1].items = [
    { "id" : 4, title: "a", price: "23", "content" : "0.9819907734464064", "date" : "1288326625006" },
    { "id" : 5, title: "s", price: "56", "content" : "0.9819907734464064", "date" : "1288326625006" },
    { "id" : 6, title: "c", price: "76", "content" : "0.9819907734464064", "date" : "12883236625006" }
]