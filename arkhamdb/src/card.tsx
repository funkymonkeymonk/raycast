import {Icon, Image, List, Action, ActionPanel} from "@raycast/api";
import got from "got";
import { useEffect, useState } from "react";
import {useCachedState} from "@raycast/utils";
import _ from "lodash";

//TODO: Build the display for when a card is selected.
export default function Command() {
  const [searchResults, setSearchResults] = useCachedState<any[] | undefined>("arkhamdbCardList");
  const [isLoading, setIsLoading] = useState(false);

// Define a default type for Cards that can be inherited from
//TODO: Get better images
//TODO: Get an actual neutral image
  const CLASS_ICONS = {
    guardian: {source: "guardian.png", mask: Image.Mask.Circle},
    mystic: {source: "mystic.png", mask: Image.Mask.Circle},
    neutral: {source: "neutral.png", mask: Image.Mask.Circle},
    rogue: {source: "rogue.png", mask: Image.Mask.Circle},
    seeker: {source: "seeker.png", mask: Image.Mask.Circle},
    survivor: {source: "survivor.png", mask: Image.Mask.Circle}
  };

  function CardListItem(props: any) {
    const {code, name, investigator_class, type, traits, url} = props.card
    const keywords = [code, investigator_class, type, traits]

    return (
        <List.Item
            id={code}
            title={name ?? "No name"}
            subtitle={type}
            icon={CLASS_ICONS[investigator_class.toLowerCase()]}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser title="Open in ArkhamDB" url={url}/>
                <Action.CopyToClipboard title="Copy card code to clipboard" content={code}/>
                <Action.OpenInBrowser title="Open ArkhamDB API link" url={"https://arkhamdb.com/api/public/card/" + code}/>
              </ActionPanel>
            }
        />
    );
  }

  //TODO: Add additional search filters
  async function getCardData(query: string) {
    async function callArkhamDB() {
      setIsLoading(true);
      const API_ROOT = 'https://www.arkhamdb.com'
      const PATH = '/api/public/cards'
      return got.get(API_ROOT + PATH).json()
    }

    const arkhamDBCardKeyMapper = {
      code: "code",
      real_name: "name",
      faction_name: "investigator_class",
      type_name: "type",
      real_traits: "traits",
      url: "url",
    };

    const cards = await callArkhamDB()
    //TODO: Replace this with a better mapping method as part of the API request once I've figured out the data I need
    const temp = cards.map( card => _.mapKeys(card, (value: any, key: string | number) => arkhamDBCardKeyMapper[key]))
    setIsLoading(false)

    return temp
  }

  useEffect(() => {
    (async () => setSearchResults(await getCardData()))();
  }, []);

  return (
      <List
          throttle={true}
          isLoading={isLoading || searchResults === undefined}
      >
        {searchResults?.map((card) =>
            <CardListItem key={card.code} card={card}/>
        )}
      </List>
  );
}
