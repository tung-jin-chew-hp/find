define([
    'backbone',
    'underscore',
    'jquery',
    'jvectormap-us',
    'i18n!find/nls/bundle',
    'text!find/templates/app/page/search/results/geolocation-view.html',
    'text!find/templates/app/page/loading-spinner.html',
    'chosen'

], function (Backbone, _, $, jvm, i18n, template, loadingSpinnerTemplate) {
    "use strict";

    return Backbone.View.extend({

        template: _.template(template),
        loadingTemplate: _.template(loadingSpinnerTemplate)({i18n: i18n, large: true}),

        initialize: function (options) {
            this.queryModel = options.queryModel;
            this.parametricCollection = options.parametricCollection;
            this.queryState = options.queryState;
        },

        update: function () {
            this.$loadingSpinner.addClass('hide');

            if (this.previousMap) {
                // jvectormap is not good at cleaning up its tooltips
                $('.jvectormap-tip').remove();
            }

            this.$map.empty().removeClass('hide');

            var field = this.parametricCollection.findWhere({ name: 'COUNTRY' })
                || this.parametricCollection.findWhere({ name: 'USER_COUNTRY_CODE' });

            var countryMap = {}

            if (field) {
                var values = field.attributes.values
                countryMap = _.object(_.pluck(values, 'value'), _.pluck(values, 'count'))
            }

            this.previousMap = this.$map.vectorMap({
                map: 'us_aea',
                hoverOpacity: 0.7,
                hoverColor: false,
                backgroundColor: '#383f47',
                series: {
                    regions: [{
                        values: countryMap,
                        scale: ['#d7fbe9', '#00b388'],
                        //scale: ['#C8EEFF', '#0071A4'],
                        normalizeFunction: 'polynomial'
                    }]
                },
                onRegionTipShow: function(e, el, code){
                    var val = countryMap[code];
                    val && el.html(el.html()+' ('+ val+')');
                },
                onRegionClick: _.bind(function(e, code) {
                    field && this.queryState.selectedParametricValues.add({
                        field: field.attributes.name,
                        value: code
                    })
                }, this)
            })
        },

        render: function () {
            this.$el.html(this.template({i18n: i18n}));

            this.$loadingSpinner = $(this.loadingTemplate);
            this.$map = this.$('.map2d');
            this.$map.after(this.$loadingSpinner);
            this.$loadingSpinner.addClass('hide');
            this.$map.addClass('hide');

            this.parametricCollection.on('change reset', this.update, this)
        }
    })
});


