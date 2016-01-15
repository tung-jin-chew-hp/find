/*
 * Copyright 2015 Hewlett-Packard Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

package com.hp.autonomy.frontend.find.core.search;

import com.hp.autonomy.frontend.find.core.test.AbstractFindIT;
import org.junit.Test;
import org.springframework.http.MediaType;

import java.util.Arrays;

import static org.hamcrest.CoreMatchers.not;
import static org.hamcrest.Matchers.empty;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SuppressWarnings("SpringJavaAutowiredMembersInspection")
public abstract class AbstractRelatedConceptsServiceIT extends AbstractFindIT {
    protected final String[] databases;

    protected AbstractRelatedConceptsServiceIT(final String[] databases) {
        this.databases = Arrays.copyOf(databases, databases.length);
    }

    @Test
    public void findRelatedConcepts() throws Exception {
        mockMvc.perform(get(RelatedConceptsController.RELATED_CONCEPTS_PATH).param("databases", databases).param("queryText", "*").param("fieldText", ""))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8))
                .andExpect(jsonPath("$", not(empty())));
    }
}
