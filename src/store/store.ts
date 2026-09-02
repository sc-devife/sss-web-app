import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import uiReducer from "@/features/ui/uiSlice";
import leadsReducer from "@/features/leads/leadsSlice";
import escapesReducer from "@/features/escapes/escapesSlice";
import hotelsReducer from "@/features/hotels/hotelsSlice";
import activitiesReducer from "@/features/activities/activitiesSlice";
import transportsReducer from "@/features/transports/transportsSlice";
import escapePointsReducer from "@/features/escapePoints/escapePointsSlice";
import serviceProvidersReducer from "@/features/serviceProviders/serviceProvidersSlice";
import inclusionExclusionsReducer from "@/features/inclusionExclusions/inclusionExclusionsSlice";
import bankAccountsReducer from "@/features/bankAccounts/bankAccountsSlice";
import taxProfilesReducer from "@/features/taxProfiles/taxProfilesSlice";
import reminderRulesReducer from "@/features/reminderRules/reminderRulesSlice";
import quoteTemplatesReducer from "@/features/quoteTemplates/quoteTemplatesSlice";
import invoiceTemplatesReducer from "@/features/invoiceTemplates/invoiceTemplatesSlice";
import usersReducer from "@/features/users/usersSlice";
import assignmentRulesReducer from "@/features/assignmentRules/assignmentRulesSlice";
import integrationsReducer from "@/features/integrations/integrationsSlice";
import dashboardReducer from "@/features/dashboard/dashboardSlice";
import itinerariesReducer from "@/features/itineraries/itinerariesSlice";
import itineraryItemsReducer from "@/features/itineraryItems/itineraryItemsSlice";
import itineraryContentItemsReducer from "@/features/itineraryContentItems/itineraryContentItemsSlice";
import quotesReducer from "@/features/quotes/quotesSlice";
import dealsReducer from "@/features/deals/dealsSlice";
import paymentMilestonesReducer from "@/features/paymentMilestones/paymentMilestonesSlice";
import organizationReducer from "@/features/organization/organizationSlice";
import addressesReducer from "@/features/addresses/addressesSlice";
import profileReducer from "@/features/profile/profileSlice";
import mealPlansReducer from "@/features/mealPlans/mealPlansSlice";
import roomTypesReducer from "@/features/roomTypes/roomTypesSlice";
import servicesReducer from "@/features/services/servicesSlice";
import teamsReducer from "@/features/teams/teamsSlice";
import sessionsReducer from "@/features/sessions/sessionsSlice";
import transactionsReducer from "@/features/transactions/transactionsSlice";
import quotationTemplatesReducer from "@/features/quotationTemplates/quotationTemplatesSlice";

export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      leads: leadsReducer,
      escapes: escapesReducer,
      hotels: hotelsReducer,
      activities: activitiesReducer,
      transports: transportsReducer,
      escapePoints: escapePointsReducer,
      serviceProviders: serviceProvidersReducer,
      inclusionExclusions: inclusionExclusionsReducer,
      bankAccounts: bankAccountsReducer,
      taxProfiles: taxProfilesReducer,
      reminderRules: reminderRulesReducer,
      quoteTemplates: quoteTemplatesReducer,
      invoiceTemplates: invoiceTemplatesReducer,
      users: usersReducer,
      assignmentRules: assignmentRulesReducer,
      integrations: integrationsReducer,
      dashboard: dashboardReducer,
      itineraries: itinerariesReducer,
      itineraryItems: itineraryItemsReducer,
      itineraryContentItems: itineraryContentItemsReducer,
      quotes: quotesReducer,
      deals: dealsReducer,
      paymentMilestones: paymentMilestonesReducer,
      organization: organizationReducer,
      addresses: addressesReducer,
      profile: profileReducer,
      mealPlans: mealPlansReducer,
      roomTypes: roomTypesReducer,
      services: servicesReducer,
      teams: teamsReducer,
      sessions: sessionsReducer,
      transactions: transactionsReducer,
      quotationTemplates: quotationTemplatesReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
