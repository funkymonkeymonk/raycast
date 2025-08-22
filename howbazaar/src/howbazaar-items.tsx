import { ActionPanel, Detail, List, Action } from "@raycast/api";
import ky from "ky";
import { useEffect, useState } from "react";
import { useCachedState } from "@raycast/utils";

type QuestEntry = {
  tooltips: string[];
  rewardTooltips: string[];
};

type Quest = {
  entries: QuestEntry[];
};

type CombatEncounter = {
  cardId: string;
  cardName: string;
};

type Enchantment = {
  type: string;
  tooltips: string[];
};

type Tier = {
  tooltips: string[];
};

type Item = {
  id: string;
  name: string;
  startingTier: string;
  tiers: Tier[];
  tags: string[];
  hiddenTags: string[];
  customTags: string[];
  size: string;
  heroes: string[];
  enchantments: Enchantment[];
  quests: Quest[];
  unifiedTooltips: string[];
  combatEncounters: CombatEncounter[];
};

async function getData(setIsLoading: React.Dispatch<React.SetStateAction<boolean>>) {
  async function callApi() {
    setIsLoading(true);
    const API_ROOT = "https://www.howbazaar.gg/api";
    const PATH = "/items";
    return ky.get(API_ROOT + PATH).json<{ data: Item[] }>();
  }

  const res = await callApi();
  setIsLoading(false);
  return res.data;
}

type DynamicTagListProps = {
  title: string;
  tags: string[];
};

function DynamicTagList({ title, tags }: DynamicTagListProps) {
  return (
    <List.Item.Detail.Metadata.TagList title={title}>
      {tags.map((tag: string) => (
        <List.Item.Detail.Metadata.TagList.Item key={tag} text={tag} />
      ))}
    </List.Item.Detail.Metadata.TagList>
  );
}

function ItemMetadataList(props: { item: Item; full?: boolean }) {
  const { item, full } = props;

  const baseMetadata = (
    <>
      <List.Item.Detail.Metadata.Label title="Size" text={item.size} />
      <List.Item.Detail.Metadata.Label title="Starting Tier" text={item.startingTier} />
      <DynamicTagList title="Tags" tags={item.tags} />
      <DynamicTagList title="Heroes" tags={item.heroes} />
    </>
  );

  const extraMetadata = full ? (
    <>
      <List.Item.Detail.Metadata.Separator />
      <DynamicTagList title="Hidden Tags" tags={item.hiddenTags} />
      <DynamicTagList title="Custom Tags" tags={item.customTags} />
    </>
  ) : null;

  return (
    <List.Item.Detail.Metadata>
      {baseMetadata}
      {extraMetadata}
    </List.Item.Detail.Metadata>
  );
}

function DetailItemView(props: { item: Item }) {
  const { item } = props;
  const unifiedTooltips = item.unifiedTooltips.join("\n\n");

  const enchantments = item.enchantments.map((e) => "## " + e.type + "\n\n" + e.tooltips.join("\n\n")).join("\n\n");

  const markdown = unifiedTooltips + "\n\n" + enchantments;

  return <Detail markdown={markdown} metadata={<ItemMetadataList item={item} full={true} />} />;
}

function JSONItemView(props: { item: Item }) {
  const { item } = props;
  const markdown = "```json\n" + JSON.stringify(item, null, 2) + "\n```\n";
  return <Detail markdown={markdown} />;
}

function ItemListEntry(props: { item: Item }) {
  const { item } = props;

  const keywords = [item.size, ...item.tags, ...item.hiddenTags];
  return (
    <List.Item
      // icon={Icon.Bird}
      title={item.name}
      detail={
        <List.Item.Detail markdown={item.unifiedTooltips.join("\n\n")} metadata={<ItemMetadataList item={item} />} />
      }
      keywords={keywords}
      actions={
        <ActionPanel>
          <Action.Push title="Show Details" target={<DetailItemView item={item} />} />
          <Action.Push title="Show JSON" target={<JSONItemView item={item} />} />
        </ActionPanel>
      }
    />
  );
}

export default function Command() {
  const [searchResults, setSearchResults] = useCachedState<Item[] | undefined>("howBazaarItemList");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => setSearchResults(await getData(setIsLoading)))();
  }, []);

  return (
    <List throttle={true} isShowingDetail={true} isLoading={isLoading || searchResults === undefined}>
      {searchResults?.map((item) => <ItemListEntry key={item.id} item={item} />)}
    </List>
  );
}
