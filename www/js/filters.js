/**
 * Created by Root on 18/8/2015.
 */
angular.module('collaApp').filter('first_char', function(){
    return function (first_char) {
        if (!first_char) { return ''; }

        return first_char.charAt(0);
    }
}).filter('tel', function () {
    return function (tel) {
        if (!tel) { return ''; }

        var value = tel.toString().trim().replace(/^\+/, '');

        if (value.match(/[^0-9]/)) {
            return tel;
        }

        var country, city, number;

        switch (value.length) {
            case 10: // +1PPP####### -> C (PPP) ###-####
                country = 1;
                city = value.slice(0, 3);
                number = value.slice(3);
                break;

            case 11: // +CPPP####### -> CCC (PP) ###-####
                country = value[0];
                city = value.slice(1, 4);
                number = value.slice(4);
                break;

            case 12: // +CCCPP####### -> CCC (PP) ###-####
                country = value.slice(0, 3);
                city = value.slice(3, 5);
                number = value.slice(5);
                break;

            default:
                return tel;
        }

        if (country == 1) {
            country = "";
        }

        number = number.slice(0, 3) + '-' + number.slice(3);

        return (country + " (" + city + ") " + number).trim();
    };
}).filter("asDate", function () {
    return function (input) {
        if(input != ""){
            console.log(input);
            return new Date(input);
        }
        return null;
    }
}).filter("firstChar", function(){
    return function (str) { return str.charAt(0) ? str.charAt(0) : "0"; }
});
