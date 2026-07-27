package com.acme.testdesk.service;

import com.acme.testdesk.domain.BddCatalogEntryDetails;
import com.acme.testdesk.domain.BddStep;
import com.acme.testdesk.domain.CatalogEntry;
import com.acme.testdesk.domain.CatalogRevision;
import com.acme.testdesk.domain.DefinitionKind;
import com.acme.testdesk.domain.TestGroup;
import com.acme.testdesk.domain.TestGroupKind;
import com.acme.testdesk.domain.TestSource;
import com.acme.testdesk.domain.TestType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/** Temporary BDD catalog adapter; a Git-backed adapter can replace it later. */
@Component
public class BddSimulationCatalogAdapter implements CatalogDefinitionAdapter {
    @Override
    public String id() {
        return "bdd-simulation";
    }

    @Override
    public List<TestGroup> load(TestSource source, CatalogRevision revision) {
        return List.of(
                group(
                        source,
                        "checkout-payments",
                        "Checkout payments",
                        "features/checkout/payments.feature",
                        List.of("critical", "payments"),
                        List.of(
                                entry(source, "checkout-payments", "checkout-valid-card", "Customer completes checkout with a valid card", DefinitionKind.SCENARIO, List.of("smoke", "payments"), "features/checkout/payments.feature", 18,
                                        List.of(step("Given", "a customer has an item in the cart"), step("When", "they pay with a valid card"), step("Then", "the order confirmation is shown")), List.of()),
                                entry(source, "checkout-payments", "checkout-expired-card", "Customer sees a message for an expired card", DefinitionKind.SCENARIO, List.of("payments", "regression"), "features/checkout/payments.feature", 33,
                                        List.of(step("Given", "a customer is on the payment step"), step("When", "they submit an expired card"), step("Then", "a useful decline message is shown")), List.of()),
                                entry(source, "checkout-payments", "checkout-wallet", "Customer pays with a saved wallet", DefinitionKind.SCENARIO_OUTLINE, List.of("payments"), "features/checkout/payments.feature", 47,
                                        List.of(step("Given", "a customer has a saved wallet"), step("When", "they choose <wallet>"), step("Then", "the payment is accepted")),
                                        List.of(Map.of("wallet", "Apple Pay"), Map.of("wallet", "Google Pay")))
                )),
                group(
                        source,
                        "checkout-cart",
                        "Cart management",
                        "features/checkout/cart.feature",
                        List.of("smoke", "cart"),
                        List.of(
                                entry(source, "checkout-cart", "cart-add-item", "Customer adds a product to the cart", DefinitionKind.SCENARIO, List.of("smoke", "cart"), "features/checkout/cart.feature", 11,
                                        List.of(step("Given", "a product is available"), step("When", "the customer adds it to the cart"), step("Then", "the cart contains one item")), List.of()),
                                entry(source, "checkout-cart", "cart-update-quantity", "Customer updates item quantity", DefinitionKind.SCENARIO, List.of("cart"), "features/checkout/cart.feature", 25,
                                        List.of(step("Given", "the cart contains one item"), step("When", "the customer changes its quantity"), step("Then", "the total is recalculated")), List.of())
                )),
                group(
                        source,
                        "account-sign-in",
                        "Account sign-in",
                        "features/account/sign-in.feature",
                        List.of("smoke", "account"),
                        List.of(
                                entry(source, "account-sign-in", "account-valid-login", "Customer signs in with valid credentials", DefinitionKind.SCENARIO, List.of("smoke", "account"), "features/account/sign-in.feature", 9,
                                        List.of(step("Given", "a registered customer is on the sign-in page"), step("When", "they submit valid credentials"), step("Then", "the account home is shown")), List.of()),
                                entry(source, "account-sign-in", "account-invalid-login", "Customer sees an error for invalid credentials", DefinitionKind.SCENARIO, List.of("account", "regression"), "features/account/sign-in.feature", 23,
                                        List.of(step("Given", "a registered customer is on the sign-in page"), step("When", "they submit invalid credentials"), step("Then", "an authentication error is shown")), List.of())
                )),
                group(
                        source,
                        "orders-history",
                        "Order history",
                        "features/orders/history.feature",
                        List.of("regression", "orders"),
                        List.of(
                                entry(source, "orders-history", "orders-history-list", "Customer can review recent orders", DefinitionKind.SCENARIO, List.of("orders"), "features/orders/history.feature", 12,
                                        List.of(step("Given", "a customer has completed orders"), step("When", "they open order history"), step("Then", "recent orders are listed")), List.of()),
                                entry(source, "orders-history", "orders-history-filter", "Customer filters order history by status", DefinitionKind.SCENARIO, List.of("orders", "regression"), "features/orders/history.feature", 29,
                                        List.of(step("Given", "a customer has orders in multiple states"), step("When", "they filter by shipped"), step("Then", "only shipped orders are shown")), List.of())
                ))
        );
    }

    private TestGroup group(
            TestSource source,
            String id,
            String name,
            String sourcePath,
            List<String> tags,
            List<CatalogEntry> entries
    ) {
        return new TestGroup(id, source.id(), name, TestGroupKind.FEATURE, tags, sourcePath, entries);
    }

    private CatalogEntry entry(
            TestSource source,
            String groupId,
            String id,
            String name,
            DefinitionKind kind,
            List<String> tags,
            String sourcePath,
            int line,
            List<BddStep> steps,
            List<Map<String, String>> examples
    ) {
        return new CatalogEntry(
                id,
                source.id(),
                groupId,
                name,
                TestType.BDD,
                "cucumber",
                kind,
                tags,
                sourcePath,
                line,
                sourcePath + ":" + line,
                new BddCatalogEntryDetails(steps, examples)
        );
    }

    private BddStep step(String keyword, String text) {
        return new BddStep(keyword, text);
    }
}
