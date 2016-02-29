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
            this.queryState = options.queryState;
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
            var color = d3.scale.category20c();

            if (!this.secondParametricCollection.isEmpty()) {
                var nameAttr = 'text';
                var sizeAttr = 'count';

                // TODO: this is not ideal
                var field1 = this.$firstChosen.val();
                var field2 = this.$secondChosen.val();

                this.sunburst = new Sunburst(this.$sunburst, {
                    data: {
                        text: i18n['search.sunburst.title'],
                        children: this.secondParametricCollection.toJSON(),
                        count: this.secondParametricCollection.chain()
                            .invoke('get', sizeAttr)
                            .reduce(function (a, b) {
                                return a + b
                            })
                            .value()
                    },
                    i18n: i18n,
                    nameAttr: nameAttr,
                    sizeAttr: sizeAttr,
                    colorFn: function (d) {
                        if (!d.parent) {
                            return color(d.parent);
                        }
                        if (!d.parent.parent) {
                            return d.color = d3.hsl(d[sizeAttr] ? color(d[nameAttr]) : 'black');
                        }

                        var par = d.parent.color;
                        var idx = d.parent.children.indexOf(d);
                        var satShift = idx / d.parent.children.length;
                        //return d.color = d3.hsl(par.h, (par.s + satShift) % 1, par.l + 0.05);
                        // Brian Cowe says the colors look too similar, so just using a fixed color progression
                        return d.color = color(idx);
                    },
                    labelFormatter: function (d, prevClicked) {
                        var zoomedOnRoot = !prevClicked || prevClicked.depth === 0;
                        var hoveringCenter = prevClicked ? d === prevClicked.parent : d.depth === 0;
                        var icon = !zoomedOnRoot && hoveringCenter ? '<i class="icon-zoom-out"></i>' : '';

                        return '<div style="font-size:14px;font-weight:bold;">' + icon + _.escape(d[nameAttr]) + '</div>'
                            + d[sizeAttr];
                    },
                    clickFn: _.bind(function(node, evt){
                        if (evt.ctrlKey || evt.altKey || evt.button !== 0) {
                            evt.preventDefault()

                            var values = []

                            if (node.depth === 1) {
                                values.push({field: field1, value: node.text})
                            }
                            else if (node.depth === 2) {
                                values.push({field: field1, value: node.parent.text})
                                values.push({field: field2, value: node.text})
                            }

                            if (values.length) {
                                this.queryState.selectedParametricValues.add(values)
                            }

                            return false
                        }
                    }, this)
                });
                this.$loadingSpinner.addClass('hide');
                this.$sunburst.removeClass('hide');
            }
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
            this.emptyDropdown(this.$secondChosen);
            this.$sunburst.empty().addClass('hide');
        },

        firstPass: function () {
            this.$sunburst.addClass('hide');
            var val = this.$firstChosen.val();
            this.getParametricCollection(val);
            var secondCollection = this.parametricCollection.pluck('name');
            this.populateDropDown(this.$secondChosen, _.reject(secondCollection, function (name) {
                return name === val || name === 'autn_date'
            }, this));
            this.$secondChosen.removeClass('hide')
        },

        render: function () {
            this.$el.html(this.template({i18n: i18n}));

            this.$loadingSpinner = $(this.loadingTemplate);
            this.$sunburst = this.$('.sunburst');
            this.$sunburst.after(this.$loadingSpinner);
            this.$loadingSpinner.addClass('hide');
            this.$sunburst.addClass('hide');
            this.$firstChosen = this.$('.first-parametric');
            this.$secondChosen = this.$('.second-parametric');

            this.populateDropDown(this.$firstChosen, _.reject(this.parametricCollection.pluck('name'), function(v){
                return v === 'autn_date'
            }));
            this.firstPass();

            this.$firstChosen.change(_.bind(this.firstPass, this));

            this.$secondChosen.change(_.bind(function() {
                this.$sunburst.addClass('hide');
                this.getParametricCollection(this.$firstChosen.val(), this.$secondChosen.val());
            }, this));

            this.listenTo(this.parametricCollection, 'request', function() {
                this.$loadingSpinner.removeClass('hide');
                this.resetView();
            });

            this.listenTo(this.parametricCollection, 'sync', function() {
                this.populateDropDown(this.$firstChosen, _.without(this.parametricCollection.pluck('name'), 'autn_date'));
                this.firstPass();
            });

            this.listenTo(this.secondParametricCollection, 'sync', this.update);
        }
    })
});


