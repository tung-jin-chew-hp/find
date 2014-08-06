define([
    'settings/js/server-widget',
    'find/app/model/indexes-collection',
    'text!find/templates/app/page/settings/iod-widget.html',
    'text!find/templates/app/page/settings/indexes-list.html'
], function(ServerWidget, IndexesCollection, template, indexesTemplate) {

    template = _.template(template);
    indexesTemplate = _.template(indexesTemplate);

    return ServerWidget.extend({
        render: function() {
            ServerWidget.prototype.render.call(this);

            this.$validateButtonParent = this.$('button[name="validate"]').parent();
            this.$validateButtonParent.before(template({strings: this.strings}));

            this.$apikey = this.$('input[name="apikey"]');
            this.$apiKeyControlGroup = this.$('.control-group').eq(0);
        },

        getConfig: function() {
            var selectedIndexes = _.map(this.$("input[type='checkbox']:checked"), function(input) {
                return $(input).val();
            });

            var activeIndexes = _.filter(this.indexes, function(index) {
                return _.contains(selectedIndexes, index.index);
            });

            return {
                apiKey: this.$apikey.val(),
                activeIndexes: activeIndexes
            };
        },

        updateConfig: function(config) {
            ServerWidget.prototype.updateConfig.apply(this, arguments);

            this.$apikey.val(config.apiKey);
        },

        validateInputs: function() {
            var isValid = true;

            if (this.shouldValidate()) {
                var config = this.getConfig();

                if (config.apiKey === '') {
                    isValid = false;
                    this.updateInputValidation(this.$apikey);
                }
            }

            return isValid;
        },

        handleValidation: function(config, response) {
            if (_.isEqual(config.iod, this.lastValidationConfig.iod)) {
                this.lastValidation = response.valid;
                this.lastValidation && (this.indexes = response.data ? response.data.indexes ? response.data.indexes:[] : []);
                this.hideValidationInfo();

                this.toggleIndexes();

                this.displayValidationMessage(true, response);

                if(response.data) {
                    _.each(response.data.activeIndexes, function(activeIndex){
                        this.$('[value="' + activeIndex.index + '"]').prop('checked', true);
                    })
                }
            }
        },

        setValidationFormatting: function(state) {
            if (state === 'clear') {
                this.$apiKeyControlGroup.removeClass('success error');
            } else {
                this.$apiKeyControlGroup.addClass(state)
                    .removeClass(state === 'success' ? 'error' : 'success');
            }
        },

        toggleIndexes: function() {
            this.$('.indexes-list-group').remove();

            if(this.indexes.length && this.lastValidation) {
                this.$validateButtonParent.after(indexesTemplate({
                    indexes: this.indexes
                }));
            }
        }
    });

});
