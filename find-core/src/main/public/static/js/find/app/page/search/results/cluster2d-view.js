define([
    'backbone',
    'underscore',
    'jquery',
    'jvectormap-world',
    'i18n!find/nls/bundle',
    'text!find/templates/app/page/search/results/cluster2d-view.html',
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
        },

        getParametricCollection: function(first, second) {
            if (!second) this.$map.empty();
            this.$loadingSpinner.removeClass('hide');
        },

        update: function () {
            this.$loadingSpinner.addClass('hide');
            this.$map.empty().removeClass('hide');

            this.$map.vectorMap({
                map: 'world_mill',
                hoverOpacity: 0.7,
                hoverColor: false,
                markerStyle: {
                    initial: {
                        fill: '#F8E23B',
                        stroke: '#383f47'
                    }
                },
                backgroundColor: '#383f47'
            })
        },

        render: function () {
            this.$el.html(this.template({i18n: i18n}));

            this.$loadingSpinner = $(this.loadingTemplate);
            this.$map = this.$('.map2d');
            this.$map.after(this.$loadingSpinner);
            this.$loadingSpinner.addClass('hide');
            this.$map.addClass('hide');
        }
    })
});


