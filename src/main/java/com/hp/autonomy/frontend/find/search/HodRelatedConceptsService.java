/*
 * Copyright 2014-2015 Hewlett-Packard Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

package com.hp.autonomy.frontend.find.search;

import com.hp.autonomy.frontend.find.beanconfiguration.HodCondition;
import com.hp.autonomy.frontend.find.web.CacheNames;
import com.hp.autonomy.hod.client.api.resource.ResourceIdentifier;
import com.hp.autonomy.hod.client.api.textindex.query.search.Entity;
import com.hp.autonomy.hod.client.api.textindex.query.search.FindRelatedConceptsRequestBuilder;
import com.hp.autonomy.hod.client.api.textindex.query.search.FindRelatedConceptsService;
import com.hp.autonomy.hod.client.error.HodErrorException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Conditional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Conditional(HodCondition.class)
public class HodRelatedConceptsService implements RelatedConceptsService {

    @Autowired
    private FindRelatedConceptsService findRelatedConceptsService;

    @Override
    @Cacheable(CacheNames.RELATED_CONCEPTS)
    public List<Entity> findRelatedConcepts(final String text, final List<ResourceIdentifier> indexes, final String fieldText) throws HodErrorException {

        final FindRelatedConceptsRequestBuilder params = new FindRelatedConceptsRequestBuilder()
                .setIndexes(indexes)
                .setFieldText(fieldText);

        return findRelatedConceptsService.findRelatedConceptsWithText(text, params);
    }
}
