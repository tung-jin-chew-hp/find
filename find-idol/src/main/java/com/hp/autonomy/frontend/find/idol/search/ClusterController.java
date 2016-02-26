package com.hp.autonomy.frontend.find.idol.search;

import com.hp.autonomy.searchcomponents.idol.category.CategoryServerErrorException;
import com.hp.autonomy.searchcomponents.idol.category.Cluster;
import com.hp.autonomy.searchcomponents.idol.category.IdolCategoryService;
import java.io.IOException;
import java.util.List;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

/*
 * $Id:$
 *
 * Copyright (c) 2016, Autonomy Systems Ltd.
 *
 * Last modified by $Author$ on $Date$ 
 */
@Controller
@RequestMapping(ClusterController.CLUSTER_PATH)
public class ClusterController {
    public static final String CLUSTER_PATH = "/api/public/cluster";

    private final IdolCategoryService categoryService;

    @Autowired
    public ClusterController(final IdolCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @RequestMapping(value = "map")
    public void map(
            @RequestParam("sourceName") final String sourceName,
            @RequestParam(value = "startDate", required = false) final String startDate,
            @RequestParam(value = "endDate", required = false) final String endDate,
            final HttpServletResponse response
    ) throws CategoryServerErrorException, IOException {
        response.setContentType(MediaType.IMAGE_JPEG_VALUE);
        categoryService.clusterServe2DMap(sourceName, startDate, endDate, response.getOutputStream());
    }

    @RequestMapping(value = "clusters")
    @ResponseBody
    public List<Cluster> clusters(
            @RequestParam("sourceName") final String sourceName,
            @RequestParam(value = "startDate", required = false) final String startDate,
            @RequestParam(value = "endDate", required = false) final String endDate
    ) throws CategoryServerErrorException {
        return categoryService.clusterResults(sourceName, startDate, endDate);
    }
}
