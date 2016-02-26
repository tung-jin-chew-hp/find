define([
    'backbone',
    'flotTime',
    'jquery',
    'underscore',
    'moment',
    'i18n!find/nls/bundle',
    'find/app/model/entity-collection',
    'find/app/model/dates-filter-model',
    'find/app/model/saved-searches/saved-search-model',
    'js-whatever/js/filtering-collection',
    'js-whatever/js/list-view',
    'text!find/templates/app/page/search/filters/date/dates-filter-view.html',
    'bootstrap-datetimepicker'
], function(Backbone, flot, $, _, moment, i18n, EntityCollection, DatesFilterModel, SavedSearchModel, FilteringCollection, ListView, template) {

    var DATES_DISPLAY_FORMAT = 'YYYY/MM/DD HH:mm';

    function dateUpdater(attribute) {
        return function() {
            var display = '';
            var value = this.datesFilterModel.get(attribute);

            if (value) {
                display = value.format(DATES_DISPLAY_FORMAT);
            }

            this.$('[data-date-attribute="' + attribute + '"]').find('input').val(display);
        };
    }

    return Backbone.View.extend({
        events: {
            'click tr': function(event) {
                var $targetRow = $(event.currentTarget);
                var selected = $targetRow.attr('data-filter-id');
                var previous = this.datesFilterModel.get('dateRange');

                if (selected === previous) {
                    this.datesFilterModel.set('dateRange', null);
                } else {
                    this.datesFilterModel.set('dateRange', selected);
                }
            },
            'dp.change .results-filter-date[data-date-attribute]': function(event) {
                var attributes = {dateRange: DatesFilterModel.DateRange.CUSTOM};
                attributes[$(event.target).attr('data-date-attribute')] = event.date;
                this.datesFilterModel.set(attributes);
            }
        },

        initialize: function(options) {
            this.datesFilterModel = options.datesFilterModel;
            this.savedSearchModel = options.savedSearchModel;
            this.queryModel = options.queryModel;

            this.parametricCollection = new FilteringCollection([], {
                collection: options.parametricCollection,
                modelFilter: function(model){
                    return model.get('name') === 'autn_date';
                }
            }).on('reset', function(coll){
                var model = coll.models[0];
                this.updateDateChart(model && model.get('values'))
            }, this)

            this.template = _.template(template);

            this.listenTo(this.datesFilterModel, 'change:dateRange', function() {
                this.updateForDateRange();
                this.updateDateNewDocsLastFetched();
            });
            this.listenTo(this.datesFilterModel, 'change:customMaxDate', this.updateMaxDate);
            this.listenTo(this.datesFilterModel, 'change:customMinDate', this.updateMinDate);

            this.listenTo(this.savedSearchModel, 'sync', this.render);

            this.updateDateNewDocsLastFetched();
        },

        render: function() {
            this.$el.html(this.template({
                i18n: i18n,
                customFilterData: [
                    {headingKey: 'app.from', targetAttribute: 'customMinDate'},
                    {headingKey: 'app.until', targetAttribute: 'customMaxDate'}
                ],
                filters: this.getFilters()
            }));

            this.$('.results-filter-date').datetimepicker({
                format: DATES_DISPLAY_FORMAT,
                icons: {
                    time: 'hp-icon hp-fw hp-clock',
                    date: 'hp-icon hp-fw hp-calendar',
                    up: 'hp-icon hp-fw hp-chevron-up',
                    down: 'hp-icon hp-fw hp-chevron-down',
                    next: 'hp-icon hp-fw hp-chevron-right',
                    previous: 'hp-icon hp-fw hp-chevron-left'
                }
            });

            this.$('.date-filters-list [data-filter-id="' +  DatesFilterModel.DateRange.NEW + '"]').tooltip({
                title: i18n['search.dates.timeInterval.new.description'],
                placement: 'right'
            });

            this.updateForDateRange();
            this.updateMinDate();
            this.updateMaxDate();
        },

        updateMinDate: dateUpdater('customMinDate'),
        updateMaxDate: dateUpdater('customMaxDate'),

        updateForDateRange: function() {
            var dateRange = this.datesFilterModel.get('dateRange');

            // Clear all checkboxes, check selected
            this.$('.date-filters-list i').addClass('hide');
            this.$('.date-filters-list [data-filter-id="' + dateRange + '"] i').removeClass('hide');

            // If custom show custom options
            this.$('.search-dates-wrapper').toggleClass('hide', dateRange !== DatesFilterModel.DateRange.CUSTOM);
        },

        updateDateNewDocsLastFetched: function() {
            if(this.datesFilterModel.get('dateRange') === DatesFilterModel.DateRange.NEW && !this.savedSearchModel.isNew()) {
                this.datesFilterModel.set('dateNewDocsLastFetched', this.savedSearchModel.get('dateNewDocsLastFetched'));
                this.savedSearchModel.save({
                    dateNewDocsLastFetched: moment()
                });
            }
        },

        updateDateChart: function(values) {
            var show = values && values.length
            var $el = this.$('.date-chart');
            $el.toggleClass('hide', !show)

            if (show) {
                $el.css('width', $el.width() + 'px')

                var seriesData = _.map(values, function(v){
                    // we're assuming we're in the range in which autn_dates are epoch seconds
                    return [v.value * 1000, +v.count]
                }).sort(function(a,b){
                    return a[0] - b[0]
                })

                var datePeriods = {
                    year: 365 * 24 * 3600e3,
                    month: 31 * 24 * 3600e3,
                    day: 24 * 3600e3,
                    hour: 3600e3,
                    minute: 60e3
                };

                var step = datePeriods[this.queryModel.get('datePeriod')]
                // Pad the expected next step slightly, to avoid numerical precision issues
                var stepFloat = 1.1 * step;

                // Pad out the points with zeroes, since any time with a count of 0 wasn't returned
                for (var ii = 1; ii < seriesData.length; ++ii) {
                    var curr = seriesData[ii][0], prev = seriesData[ii - 1][0];

                    if (curr - prev > stepFloat) {
                        // we need to fill in a zero
                        seriesData.splice(ii, 0, [prev + step, 0])
                        --ii;
                    }
                }

                $.plot($el, [ {
                    color: '#018f6e',
                    data: seriesData
                }], {
                    xaxis: { mode: 'time' },
                    points: {
                        radius: 3
                    },
                    grid: {
                        clickable: true,
                        hoverable: true
                    }
                })

                var $tooltip, lastFetch, lastFetchModel;

                $el.on('plothover', _.bind(function(evt, pos, item) {
                    if (item && item.datapoint[1] > 0) {
                        var epoch = item.datapoint[0];
                        var html = i18n['search.datechart.tooltipHtml'](new Date(epoch), item.datapoint[1]);
                        var fetchRequired = true;
                        if (!$tooltip) {
                            $tooltip = $('<div class="popover date-chart-tooltip">'+ html +'</div>').appendTo('body');
                        }
                        else if (lastFetch !== item.dataIndex) {
                            $tooltip.html(html)
                        }
                        else {
                            fetchRequired = false;
                        }
                        lastFetch = item.dataIndex;

                        var pageY = pos.pageY;
                        var pageX = pos.pageX;

                        if (fetchRequired) {
                            var currentFetch = lastFetch
                            lastFetchModel = new EntityCollection().fetch({
                                data: {
                                    databases: this.queryModel.get('indexes'),
                                    queryText: this.queryModel.get('queryText'),
                                    fieldText: this.queryModel.get('fieldText'),
                                    minDate: moment(epoch).toISOString(),
                                    maxDate: moment(epoch + step).toISOString()
                                }
                            }).done(function(json){
                                if ($tooltip && currentFetch === lastFetch) {
                                    var terms = _.chain(json)
                                        .reject(function(a){return a.cluster < 0})
                                        .groupBy(function(a){return a.cluster})
                                        .map(function(a){return '\u2022<span class="date-chart-tooltip-cluster">' + _.escape(a[0].text) + '</span>'})
                                        .value()

                                    if (terms.length) {
                                        $tooltip.html([html].concat(terms).join('<br>')).css({
                                            top: pageY - $tooltip.height() - 20,
                                            left: pageX - 3
                                        })
                                    }
                                }
                            })
                        }

                        $tooltip.css({
                            top: pageY - $tooltip.height() - 20,
                            left: pageX - 3
                        })
                    }
                    else if ($tooltip){
                        $tooltip.remove()
                        $tooltip = null
                    }
                }, this)).on('plotclick', _.bind(function(evt, pos, item) {
                    if (item && item.datapoint[1] > 0) {
                        var epoch = item.datapoint[0];
                        this.datesFilterModel.set('dateRange', DatesFilterModel.DateRange.CUSTOM);
                        this.datesFilterModel.set('customMinDate', moment(epoch));
                        this.datesFilterModel.set('customMaxDate', moment(epoch + step));
                    }
                }, this))
            }

        },

        getFilters: function() {
            var filters = [
                DatesFilterModel.DateRange.WEEK,
                DatesFilterModel.DateRange.MONTH,
                DatesFilterModel.DateRange.YEAR,
                DatesFilterModel.DateRange.CUSTOM
            ];

            if(!this.savedSearchModel.isNew()) {
                filters.unshift(DatesFilterModel.DateRange.NEW);
            }

            return filters;
        }
    });
});
