/*
 * Copyright 2015 Hewlett-Packard Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

package com.hp.autonomy.frontend.find.idol.search;

import com.autonomy.aci.client.services.AciErrorException;
import com.hp.autonomy.frontend.find.core.search.QueryRestrictionsBuilder;
import com.hp.autonomy.frontend.find.core.search.RelatedConceptsController;
import com.hp.autonomy.searchcomponents.core.search.QueryRestrictions;
import com.hp.autonomy.searchcomponents.core.search.RelatedConceptsService;
import com.hp.autonomy.searchcomponents.idol.search.IdolRelatedConceptsRequest;
import com.hp.autonomy.types.idol.QsElement;
import java.util.List;
import org.joda.time.DateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping(RelatedConceptsController.RELATED_CONCEPTS_PATH)
public class IdolRelatedConceptsController extends RelatedConceptsController<QsElement, String, AciErrorException> {

    public static final int QUERY_SUMMARY_LENGTH = 50;

    @Autowired
    public IdolRelatedConceptsController(final RelatedConceptsService<QsElement, String, AciErrorException> relatedConceptsService, final QueryRestrictionsBuilder<String> queryRestrictionsBuilder) {
        super(relatedConceptsService, queryRestrictionsBuilder);
    }

    @RequestMapping(method = RequestMethod.GET)
    @ResponseBody
    @Override
    public List<QsElement> findRelatedConcepts(
            @RequestParam(QUERY_TEXT_PARAM) final String queryText,
            @RequestParam(value = FIELD_TEXT_PARAM, defaultValue = "") final String fieldText,
            @RequestParam(DATABASES_PARAM) final List<String> databases,
            @RequestParam(value = MIN_DATE_PARAM, required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) final DateTime minDate,
            @RequestParam(value = MAX_DATE_PARAM, required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) final DateTime maxDate,
            @RequestParam(value = STATE_TOKEN_PARAM, required = false) final List<String> stateTokens) throws AciErrorException {
        List<String> actualDatabases = databases;

        if (IdolDocumentsController.isQuestion(queryText)) {
            actualDatabases = IdolDocumentsController.QUESTION_DB;
        }

        return super.findRelatedConcepts(queryText, fieldText, actualDatabases, minDate, maxDate, stateTokens);
    }

    @Override
    protected IdolRelatedConceptsRequest buildRelatedConceptsRequest(final QueryRestrictions<String> queryRestrictions) {
        final IdolRelatedConceptsRequest idolRelatedConceptsRequest = new IdolRelatedConceptsRequest();
        idolRelatedConceptsRequest.setQueryRestrictions(queryRestrictions);
        idolRelatedConceptsRequest.setQuerySummaryLength(QUERY_SUMMARY_LENGTH);
        return idolRelatedConceptsRequest;
    }
}
