package com.hp.autonomy.frontend.find.core.search;

/*
 * $Id:$
 *
 * Copyright (c) 2016, Autonomy Systems Ltd.
 *
 * Last modified by $Author$ on $Date$ 
 */

import org.apache.commons.lang3.StringUtils;

public class FieldTextMerge {
    public static String mergeFieldText(final String first, final String second) {
        if (StringUtils.isBlank(second)) {
            return first;
        }
        if (StringUtils.isBlank(first)) {
            return second;
        }
        return "(" + first + ") AND (" + second + ")";
    }
}
