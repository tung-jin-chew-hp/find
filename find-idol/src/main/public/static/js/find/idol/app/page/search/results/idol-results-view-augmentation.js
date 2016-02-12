/*
 * Copyright 2016 Hewlett-Packard Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

define([
    'find/app/page/search/results/results-view-augmentation',
    'find/idol/app/page/search/document/idol-preview-mode-view'
], function (ResultsViewAugmentation, PreviewModeView) {
    'use strict';

    return ResultsViewAugmentation.extend({
        PreviewModeView: PreviewModeView
    });
});
