define([
    'backbone',
    'underscore',
    'i18n!find/nls/bundle',
    'find/app/model/document-model',
    'text!find/templates/app/page/search/document/metadata-tab.html'
], function(Backbone, _, i18n, DocumentModel, template) {

    'use strict';

    var printFields = [
        {title: 'Author', field: 'author'},
        {title: 'Category', field: 'category'},
        {title: 'Comments', field: 'comments'},
        {title: 'Rank', field: 'rank'},
        {title: 'Readability', field: 'readability'},
        {title: 'Recommendations', field: 'recommendations'}
    ];

    return Backbone.View.extend({
        template: _.template(template),

        render: function() {
            var modelFields = this.model.get('fields');

            var fields = _.chain(printFields)
                .map(function(fieldData) {
                    var modelField = _.find(modelFields, function(modelField) {
                        return modelField.id.toLowerCase() === fieldData.field.toLowerCase();
                    });

                    return {title: fieldData.title, values: modelField ? modelField.values : []};
                }, this)
                .filter(function(fieldData) {
                    return fieldData.values.length > 0;
                })
                .value();

            this.$el.html(this.template({
                i18n: i18n,
                model: this.model,
                fields: fields
            }));
        }
    });
});