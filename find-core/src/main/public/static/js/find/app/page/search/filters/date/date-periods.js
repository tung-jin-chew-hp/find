define([
    'underscore',
    'moment'
], function(_, moment) {

    var defaultPeriod = 'day';

    var desiredCategories = 5;

    var datePeriods = {
        year: 365 * 24 * 3600e3,
        month: 31 * 24 * 3600e3,
        day: 24 * 3600e3,
        hour: 3600e3,
        minute: 60e3
    };

    return {
        datePeriods: datePeriods,
        default: defaultPeriod,
        choosePeriod: function(minDate, maxDate){
            if (minDate && maxDate) {
                var diff = maxDate - minDate;

                for (var key in datePeriods) {
                    if (datePeriods.hasOwnProperty(key) && datePeriods[key] * desiredCategories < diff) {
                        return key;
                    }
                }
            }

            return defaultPeriod
        }
    }
})