package com.acme.testdesk.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.function.Supplier;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class TestDeskApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void listsSourcesWithCurrentCatalogRevision() throws Exception {
        mockMvc.perform(get("/api/v1/sources"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].id", is("checkout-web")))
                .andExpect(jsonPath("$.items[0].latestRevision.commit", is("a13f9c2")))
                .andExpect(jsonPath("$.items[0].groupCount", is(4)))
                .andExpect(jsonPath("$.items[0].entryCount", is(9)));
    }

    @Test
    void filtersCatalogByEntryQuery() throws Exception {
        mockMvc.perform(get("/api/v1/catalog")
                        .param("sourceId", "checkout-web")
                        .param("q", "expired"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.groups", hasSize(1)))
                .andExpect(jsonPath("$.groups[0].entries", hasSize(1)))
                .andExpect(jsonPath("$.groups[0].entries[0].id", is("checkout-expired-card")))
                .andExpect(jsonPath("$.groups[0].entries[0].definitionKind", is("SCENARIO")))
                .andExpect(jsonPath("$.groups[0].entries[0].testType", is("BDD")))
                .andExpect(jsonPath("$.groups[0].entries[0].framework", is("cucumber")));

        mockMvc.perform(get("/api/v1/catalog")
                        .param("sourceId", "checkout-web")
                        .param("tag", "critical"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.groups[0].id", is("checkout-payments")))
                .andExpect(jsonPath("$.groups[0].entries", hasSize(3)));

        mockMvc.perform(get("/api/v1/catalog")
                        .param("sourceId", "checkout-web")
                        .param("q", "cart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.groups[0].entries[0].status", is("NEVER_RUN")));
    }

    @Test
    void exposesEntryDetailsAndExpandsExecutionResults() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/entries/{entryId}", "checkout-wallet"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.examples", hasSize(2)))
                .andExpect(jsonPath("$.examples[0].wallet", is("Apple Pay")))
                .andExpect(jsonPath("$.examples[1].wallet", is("Google Pay")));

        mockMvc.perform(post("/api/v1/executions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sourceId\":\"checkout-web\",\"entryIds\":[\"checkout-wallet\"],\"environment\":\"qa\",\"origin\":\"ui\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.profileId", is("bdd-cucumber-simulation")))
                .andExpect(jsonPath("$.origin", is("ui")))
                .andExpect(jsonPath("$.results", hasSize(2)))
                .andExpect(jsonPath("$.results[0].caseValues.wallet", is("Apple Pay")));
    }

    @Test
    void rejectsExecutionWithoutEnvironment() throws Exception {
        mockMvc.perform(post("/api/v1/executions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sourceId\":\"checkout-web\",\"entryIds\":[\"checkout-valid-card\"]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("BAD_REQUEST")))
                .andExpect(jsonPath("$.message", is("environment environment is required")));
    }

    @Test
    void rejectsBlankEntryIdsAsBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/executions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sourceId\":\"checkout-web\",\"entryIds\":[null],\"environment\":\"qa\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("BAD_REQUEST")));
    }

    @Test
    void createsExecutionPinnedToCatalogRevisionAndCompletes() throws Exception {
        String response = mockMvc.perform(post("/api/v1/executions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sourceId\":\"checkout-web\",\"entryIds\":[\"checkout-valid-card\"],\"environment\":\"qa\",\"revisionCommit\":\"a13f9c2\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("QUEUED")))
                .andExpect(jsonPath("$.environment", is("qa")))
                .andExpect(jsonPath("$.revision.commit", is("a13f9c2")))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String executionId = objectMapper.readTree(response).get("id").asText();
        JsonNode completed = eventually(() -> readExecution(executionId), node ->
                node != null && node.has("status") && node.get("status").asText().equals("PASSED"));

        org.junit.jupiter.api.Assertions.assertEquals("PASSED", completed.get("status").asText());
        org.junit.jupiter.api.Assertions.assertEquals("PASSED", completed.get("results").get(0).get("status").asText());
    }

    @Test
    void canCancelQueuedExecution() throws Exception {
        String response = mockMvc.perform(post("/api/v1/executions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sourceId\":\"checkout-web\",\"entryIds\":[\"checkout-valid-card\"],\"environment\":\"dev\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String executionId = objectMapper.readTree(response).get("id").asText();
        mockMvc.perform(post("/api/v1/executions/{executionId}/cancel", executionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")))
                .andExpect(jsonPath("$.results[0].status", is("CANCELLED")));
    }

    private JsonNode readExecution(String executionId) {
        try {
            String response = mockMvc.perform(get("/api/v1/executions/{executionId}", executionId))
                    .andReturn()
                    .getResponse()
                    .getContentAsString();
            return objectMapper.readTree(response);
        } catch (Exception exception) {
            return null;
        }
    }

    private JsonNode eventually(Supplier<JsonNode> supplier, java.util.function.Predicate<JsonNode> condition)
            throws InterruptedException {
        long deadline = System.currentTimeMillis() + 3000;
        JsonNode value;
        do {
            value = supplier.get();
            if (condition.test(value)) {
                return value;
            }
            Thread.sleep(100);
        } while (System.currentTimeMillis() < deadline);
        return value;
    }
}
