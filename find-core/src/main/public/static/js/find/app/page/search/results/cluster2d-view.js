define([
    'backbone',
    'underscore',
    "jquery",
    'i18n!find/nls/bundle',
    'sunburst/js/sunburst',
    'text!find/templates/app/page/search/results/sunburst-view.html',
    'text!find/templates/app/page/loading-spinner.html',
    'chosen'

], function (Backbone, _, $, i18n, Sunburst, template, loadingSpinnerTemplate) {
    "use strict";

    var Collection = Backbone.Collection.extend({
        url: '../api/public/parametric/second-parametric',

        parse: function(results) {
            return _.chain(results)
                .map(function (result) {
                    return {
                        text: result.value,
                        count: Number(result.count),
                        children: _.chain(result.field)
                            .map(function(child) {
                                return {
                                    text: child.value,
                                    count: Number(child.count)
                                }
                            })
                            .sortBy('count')
                            .last(10)
                            .value()
                    }
                })
                .sortBy('count')
                .last(10)
                .value()
        }
    });

    return Backbone.View.extend({

        template: _.template(template),
        loadingTemplate: _.template(loadingSpinnerTemplate)({i18n: i18n, large: true}),

        initialize: function (options) {
            this.queryModel = options.queryModel;
            this.parametricCollection = options.parametricCollection;
            this.secondParametricCollection = new Collection();
        },

        getParametricCollection: function(first, second) {
            if (!second) this.$sunburst.empty();
            this.$loadingSpinner.removeClass('hide');
            this.secondParametricCollection.fetch({
                data: {
                    databases: _.escape(this.queryModel.get('indexes')),
                    queryText: this.queryModel.get('queryText'),
                    fieldText: this.queryModel.get('fieldText') ? this.queryModel.get('fieldText').toString() : '',
                    minDate: this.queryModel.getIsoDate('minDate'),
                    maxDate: this.queryModel.getIsoDate('maxDate'),
                    fieldNames: second ? _.escape([first, second]) : first
                }
            });
        },

        update: function () {
            this.$sunburst.empty();

            this.$sunburst.html('<img src="/static-HEAD/img/clusters.jpg">')
            this.$loadingSpinner.addClass('hide');
            this.$sunburst.removeClass('hide');
        },

        emptyDropdown: function($dropdown) {
            $dropdown
                .empty()
                .append($dropdown.hasClass('first-parametric') ? '' : '<option value=""></option>')
                .trigger('chosen:updated');
        },

        populateDropDown: function ($dropdown, fields) {
            this.emptyDropdown($dropdown);

            _.forEach(fields, function (field) {
                $dropdown.append("<option value='" + field + "'>" + field + "</option>")
            }, this);

            $dropdown.chosen({
                width: '20%'
            });

            $dropdown.trigger('chosen:updated');
        },

        resetView: function() {
            this.emptyDropdown(this.$firstChosen);
            this.$sunburst.empty().addClass('hide');
        },

        //firstPass: function () {
        //    this.$sunburst.addClass('hide');
        //    var val = this.$firstChosen.val();
        //    this.getParametricCollection(val);
        //},

        render: function () {
            this.$el.html(this.template({i18n: i18n}));

            this.$loadingSpinner = $(this.loadingTemplate);
            this.$sunburst = this.$('.sunburst');
            this.$sunburst.after(this.$loadingSpinner);
            this.$loadingSpinner.addClass('hide');
            this.$sunburst.addClass('hide');
            this.$firstChosen = this.$('.first-parametric');

            this.populateDropDown(this.$firstChosen, this.parametricCollection.pluck('name'));
            //this.firstPass();
            this.update()

            //this.$firstChosen.change(_.bind(this.firstPass, this));
			//
            //this.$secondChosen.change(_.bind(function() {
            //    this.$sunburst.addClass('hide');
            //    this.getParametricCollection(this.$firstChosen.val(), this.$secondChosen.val());
            //}, this));
			//
            //this.listenTo(this.parametricCollection, 'request', this.resetView);
			//
            //this.listenTo(this.parametricCollection, 'sync', function() {
            //    this.populateDropDown(this.$firstChosen, this.parametricCollection.pluck('name'));
            //});
			//
            //this.listenTo(this.secondParametricCollection, 'sync', this.update);
        }
    })
});


