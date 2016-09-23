define([
    'i18n!find/nls/bundle'
], function (i18n) {
    "use strict";
    return function (collection) {
        return {
            inputClass: 'concepts-controls',
            placeholder: i18n['app.conceptBoxPlaceholder'],

            initialize: function (view) {
                view.listenTo(collection, 'update change', view.updateText);
            },
            onTextUpdate: function (updatedText) {
                if (updatedText && updatedText !== '*') {
                    collection.unshift({concepts: [updatedText]});
                }
            },
            onExternalUpdate: function () {
                return '';
            },
            inFocus: function($button) {
                $button.addClass('in-focus');
            },
            onBlur: function($button) {
                $button.removeClass('in-focus');
            }
        }
    }
});