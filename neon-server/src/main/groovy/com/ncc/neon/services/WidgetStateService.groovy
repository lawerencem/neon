/*
 * Copyright 2013 Next Century Corporation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

package com.ncc.neon.services

import com.ncc.neon.result.MetadataResolver
import com.ncc.neon.state.StateIdGenerator
import com.ncc.neon.state.WidgetStates
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component

import javax.ws.rs.*
import javax.ws.rs.core.MediaType


/**
 * Service for saving and restoring widget states.
 */

@Component
@Path("/widgetstateservice")
class WidgetStateService {

    @Autowired
    WidgetStates widgetStates

    @Autowired
    MetadataResolver metadataResolver

    @Autowired
    StateIdGenerator stateIdGenerator

    /**
     * Saves the state of the widget to the user's session
     * @param clientId An identifier generated by the client, typically a widget's name
     * @param state json containing information about the widget's state
     */
    @POST
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Path("savestate")
    void saveState(@FormParam("clientId") String clientId, @FormParam("state") String state) {
        widgetStates.addWidgetState(clientId, state)
    }

    /**
     * Gets a widget's state from the session
     * @param clientId An identifier generated by the client, typically a widget's name
     * @return json containing information about the widget's state, or null if nothing is found.
     */
    @GET
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("restoreState")
    String restoreState(@QueryParam("clientId") String clientId) {
        def widgetState = widgetStates.getWidgetState(clientId)
        if (widgetState) {
            return widgetState.state
        }
        return ""
    }

    /**
     * Gets a widget state from metadata
     * @param widget An identifier generated by the client, typically a widget's name
     * @return json containing information about the widget's state, or null if nothing is found.
     */
    @GET
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("widgetinitialization")
    String getWidgetInitialization(@QueryParam("widget") String clientId) {
        def data = metadataResolver.getWidgetInitializationData(clientId)
        return data.initDataJson
    }

    @GET
    @Produces(MediaType.TEXT_PLAIN)
    @Path("instanceid")
    String getInstanceId(@QueryParam("qualifier") String qualifier) {
        UUID id
        if ( qualifier ) {
            id = stateIdGenerator.getId(qualifier)
        }
        else {
            // no qualifier, use the global id
            id = stateIdGenerator.id
        }
        return id.toString()
    }


}
