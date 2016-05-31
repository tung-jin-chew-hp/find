define([
    'backbone',
    'flotTime',
    'jquery',
    'underscore',
    'moment',
    'i18n!find/nls/bundle',
    'find/app/model/entity-collection',
    'find/app/model/parametric-collection',
    'find/app/model/string-filter-model',
    'find/app/model/saved-searches/saved-search-model',
    'find/app/page/search/filters/date/date-periods',
    'fieldtext/js/field-text-parser',
    'js-whatever/js/filtering-collection',
    'js-whatever/js/list-view',
    'text!find/templates/app/page/search/filters/string/string-filter-view.html',
    'bootstrap-datetimepicker'
], function(Backbone, flot, $, _, moment, i18n, EntityCollection, ParametricCollection, StringFilterModel, SavedSearchModel, DatePeriods, parser, FilteringCollection, ListView, template) {

    return Backbone.View.extend({
        events: {
            'change .results-filter-string': function(event) {
                var $el = $(event.target);
                var field = $el.attr('data-field-attribute');
                var value = $el.val()

                this.stringFilterModel.set(field, value)
            },


            'submit': function(){
                return false;
            }
        },

        initialize: function(options) {
            this.stringFilterModel = options.stringFilterModel;
            this.savedSearchModel = options.savedSearchModel;
            this.queryModel = options.queryModel;
            this.queryState = options.queryState;

            this.template = _.template(template);

            this.listenTo(this.stringFilterModel, 'change', function() {
                this.updateForStringFilters();
            });

            this.listenTo(this.savedSearchModel, 'sync', this.render);
        },

        render: function() {
            this.$el.html(this.template({
                i18n: i18n,
                filters: _.pairs(this.stringFilterModel.toJSON())
            }));

            this.updateForStringFilters();
        },

        updateForStringFilters: function() {
            var attrs = this.stringFilterModel.toJSON();

            _.each(attrs, function(val, key){
                this.$('input[data-field-attribute="' + key + '"]').val(val || '');
            }, this)
        }
    });
});
