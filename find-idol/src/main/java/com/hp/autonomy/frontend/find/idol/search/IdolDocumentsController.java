/*
 * Copyright 2015 Hewlett-Packard Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

package com.hp.autonomy.frontend.find.idol.search;

import com.autonomy.aci.client.services.AciErrorException;
import com.hp.autonomy.frontend.find.core.search.DocumentsController;
import com.hp.autonomy.frontend.find.core.search.QueryRestrictionsBuilder;
import com.hp.autonomy.searchcomponents.core.config.FieldInfo;
import com.hp.autonomy.searchcomponents.core.config.FieldType;
import com.hp.autonomy.searchcomponents.core.search.DocumentsService;
import com.hp.autonomy.searchcomponents.core.search.SearchRequest;
import com.hp.autonomy.searchcomponents.idol.search.IdolSearchResult;
import com.hp.autonomy.types.requests.Documents;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.apache.commons.lang.StringUtils;
import org.joda.time.DateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping(DocumentsController.SEARCH_PATH)
public class IdolDocumentsController extends DocumentsController<String, IdolSearchResult, AciErrorException> {
    @Autowired
    public IdolDocumentsController(final DocumentsService<String, IdolSearchResult, AciErrorException> documentsService, final QueryRestrictionsBuilder<String> queryRestrictionsBuilder) {
        super(documentsService, queryRestrictionsBuilder);
    }

    @Override
    public Documents<IdolSearchResult> query(
            @RequestParam(TEXT_PARAM) final String text,
            @RequestParam(value = RESULTS_START_PARAM, defaultValue = "1") final int resultsStart,
            @RequestParam(MAX_RESULTS_PARAM) final int maxResults,
            @RequestParam(SUMMARY_PARAM) final String summary,
            @RequestParam(INDEXES_PARAM) final List<String> index,
            @RequestParam(value = FIELD_TEXT_PARAM, defaultValue = "") final String fieldText,
            @RequestParam(value = SORT_PARAM, required = false) final String sort,
            @RequestParam(value = MIN_DATE_PARAM, required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) final DateTime minDate,
            @RequestParam(value = MAX_DATE_PARAM, required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) final DateTime maxDate,
            @RequestParam(value = HIGHLIGHT_PARAM, defaultValue = "true") final boolean highlight,
            @RequestParam(value = AUTO_CORRECT_PARAM, defaultValue = "true") final boolean autoCorrect) throws AciErrorException {
        // Demo-specific changes
        // TODO: delete this
        final boolean isQuestion = StringUtils.endsWith(text, "?");
        final List<String> destIndex = isQuestion ? Collections.singletonList("ChatTranscripts") : index;

        // We're deliberately not calling the super implementation so we can hack the parameters
        final SearchRequest<String> searchRequest = parseRequestParamsToObject(text, resultsStart, maxResults, summary, destIndex, fieldText, sort, minDate, maxDate, highlight, autoCorrect);

        if (isQuestion) {
            searchRequest.setSummaryCharacters(20000);
            searchRequest.setMaxResults(1);
        }

        final Documents<IdolSearchResult> result = documentsService.queryTextIndex(searchRequest);

        final List<IdolSearchResult> docs = result.getDocuments();
        Integer totalResults = result.getTotalResults();

        if (isQuestion && docs != null) {
            totalResults = docs.size();

            for(final IdolSearchResult doc : docs) {
                final Map<String, FieldInfo<?>> map = doc.getFieldMap();
                if (map != null) {
                    map.put("question", new FieldInfo<>("question", Collections.singletonList("question"), FieldType.BOOLEAN, Collections.singletonList("true")));
                }
            }
        }

        return new Documents<>(docs, totalResults, result.getExpandedQuery(), result.getSuggestion(), result.getAutoCorrection(), result.getWarnings());
    }

    @Override
    protected <T> T throwException(final String message) throws AciErrorException {
        throw new AciErrorException(message);
    }
}
