import { useProject } from "@root/src/context/project";
import { FilterSlotBuilder, type ItemCardProps } from ".";
import { useSuspenseQuery } from "@tanstack/react-query";
import { cases } from "@root/src/services/cases";

export function FilterSlotContent({ type }: { type: ItemCardProps["type"] }) {
  const { projectId } = useProject();
  const { data: filters } = useSuspenseQuery(cases.filters(projectId!));

  const SEARCH_PLACEHOLDER_CONFIG: Record<typeof type, string> = {
    case: "Search Cases",
    chat: "Search Chats",
    service: "Search Service Requests",
    change: "Search Change Requests",
  };

  const tabs = (() => {
    switch (type) {
      case "chat":
        return filters.conversationStates;
      case "change":
        return filters.changeRequestStates;
      default:
        return filters.caseStates;
    }
  })().map((filter) => ({ label: filter.label, value: filter.id }));

  return <FilterSlotBuilder searchPlaceholder={SEARCH_PLACEHOLDER_CONFIG[type]} tabs={tabs} />;
}
