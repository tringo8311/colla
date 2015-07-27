angular.module('collaApp').factory('UtilService', ['$resource', function($resource) {
    return {
        /**
         * Returns a random integer between min (inclusive) and max (inclusive)
         * Using Math.round() will give you a non-uniform distribution!
         */
        getRandomInt: function(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        phoneFormat: function(phone) {
            phone = phone.replace(/[^0-9]/g, '');
            phone = phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
            return phone;
        },
        /**
         *
         *
         */
        addHttp: function(val){
            if (val && !val.match(/^http([s]?):\/\/.*/)) {
                return 'http://' + val;
            }
            return val;
        },
        /**
         * return url params in term of object
         * @param url
         * @returns
         */
        getUrlParts: function(url){
            // url contains your data.
            var qs = url.indexOf("?");
            if (qs == -1)
                return {};
            var fr = url.indexOf("#");
            var q = "";
            q = (fr == -1) ? url.substr(qs + 1) : url.substr(qs + 1, fr - qs - 1);
            var parts = q.split("&");
            var vars = {};
            for ( var i = 0; i < parts.length; i++) {
                var p = parts[i].split("=");
                if (p[1]) {
                    vars[decodeURIComponent(p[0])] = decodeURIComponent(p[1].replace(/\+/g,' '));
                } else {
                    vars[decodeURIComponent(p[0])] = "";
                }
            }
            // vars contain all the variables in an array.
            return vars;
        }
    };
}]);