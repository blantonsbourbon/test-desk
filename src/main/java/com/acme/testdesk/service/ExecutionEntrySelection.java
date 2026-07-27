package com.acme.testdesk.service;

import com.acme.testdesk.domain.DefinitionKind;
import com.acme.testdesk.domain.TestType;

public record ExecutionEntrySelection(
        String entryId,
        String name,
        TestType testType,
        String framework,
        DefinitionKind definitionKind,
        String selectionRef
) {
}
