/*
 * Copyright 2016 Hewlett-Packard Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

define([
    'backbone',
    'find/app/page/search/filters/date/date-periods',
    'find/app/util/search-data-util'
], function(Backbone, DatePeriods, searchDataUtil) {

    /**
     * @readonly
     * @enum {String}
     */
    var Sort = {
        date: 'date',
        relevance: 'relevance'
    };

    var DEBOUNCE_WAIT_MILLISECONDS = 500;

    var collectionBuildIndexes = function(collection) {
        return searchDataUtil.buildIndexes(collection.map(function (model) {
            return model.pick('domain', 'name');
        }));
    };

    return Backbone.Model.extend({
        defaults: {
            autoCorrect: true,
            datePeriod: 'hour',
            queryText: '',
            indexes: [],
            fieldText: null,
            minDate: undefined,
            maxDate: undefined,
            sort: Sort.relevance
        },

        /**
         * @param {Object} attributes
         * @param {{queryState: QueryState}} options
         */
        initialize: function(attributes, options) {
            this.queryState = options.queryState;

            this.on('change:minDate change:maxDate', function(){
                //debugger;
                var min = this.get('minDate')
                var max = this.get('maxDate')

                if (min && max) {
                    this.set('datePeriod', DatePeriods.choosePeriod(min, max))
                }
                else {
                    this.set('datePeriod', 'day')
                }
            }, this)

            this.listenTo(this.queryState.queryTextModel, 'change', function() {
                this.set('queryText', this.queryState.queryTextModel.makeQueryText());
            });

            this.listenTo(this.queryState.datesFilterModel, 'change', function() {
                this.set(this.queryState.datesFilterModel.toQueryModelAttributes());
            });

            this.listenTo(this.queryState.selectedIndexes, 'update reset', _.debounce(_.bind(function() {
                this.set('indexes', collectionBuildIndexes(this.queryState.selectedIndexes));
            }, this), DEBOUNCE_WAIT_MILLISECONDS));

            this.listenTo(this.queryState.selectedParametricValues, 'add remove reset', _.debounce(_.bind(function() {
                var fieldTextNode = this.queryState.selectedParametricValues.toFieldTextNode();
                this.set('fieldText', fieldTextNode ? fieldTextNode : null);
            }, this)));

            var fieldTextNode = this.queryState.selectedParametricValues.toFieldTextNode();

            this.set(_.extend({
                queryText: this.queryState.queryTextModel.makeQueryText(),
                indexes: collectionBuildIndexes(this.queryState.selectedIndexes),
                fieldText: fieldTextNode ? fieldTextNode : null
            }, this.queryState.datesFilterModel.toQueryModelAttributes()));
        },

        getIsoDate: function(type) {
            var date = this.get(type);

            if (date) {
                return date.toISOString();
            } else {
                return null;
            }
        }
    }, {
        Sort: Sort
    });

});
